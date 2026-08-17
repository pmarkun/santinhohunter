import {
  getMatchResize,
  matchSantinhoFaces,
  matchSantinhoPhoto,
} from '@/services/matchService';
import { Image } from 'react-native';

jest.mock('expo-file-system', () => ({
  File: jest.fn().mockImplementation(() => new Blob(['photo'], { type: 'image/jpeg' })),
}));

describe('matchService', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Image, 'getSize').mockImplementation(
      ((
        _uri: string,
        success?: (width: number, height: number) => void,
      ) => {
        success?.(3024, 4032);
        return Promise.resolve({ height: 4032, width: 3024 });
      }) as never,
    );
  });

  afterEach(() => {
    jest.restoreAllMocks();
    global.fetch = originalFetch;
    delete process.env.EXPO_PUBLIC_SANTINHO_API_BASE_URL;
  });

  it('uploads a photo and maps backend matches', async () => {
    process.env.EXPO_PUBLIC_SANTINHO_API_BASE_URL = 'https://api.example.test';
    const fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        matches: [
          {
            candidate_id: '250002052120',
            election_year: 2024,
            ballot_name: 'PEDRO DA IA',
            party: 'REDE',
            number: '18888',
            office: 'councilor',
            distance: 0.02,
            confidence: 0.98,
          },
        ],
      }),
    });
    global.fetch = fetchMock;

    const matches = await matchSantinhoPhoto({
      photoUri: 'file:///tmp/santinho.jpg',
      uf: 'SP',
      office: 'councilor',
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.example.test/matches?uf=SP&office=councilor',
      expect.objectContaining({ method: 'POST' }),
    );
    const [, request] = fetchMock.mock.calls[0];
    const body = request.body as FormData;
    const uploadedFile = body.get('file');

    expect(uploadedFile).toBeInstanceOf(Blob);
    expect(uploadedFile).toEqual(expect.objectContaining({ name: 'santinho.jpg' }));
    expect(matches[0]).toEqual({
      id: '250002052120',
      electionYear: 2024,
      uf: 'SP',
      office: 'councilor',
      number: '18888',
      ballotName: 'PEDRO DA IA',
      fullName: 'PEDRO DA IA',
      party: 'REDE',
      confidence: 0.98,
      distance: 0.02,
    });
  });

  it('caps the longest photo dimension without changing its orientation', () => {
    expect(getMatchResize(4032, 3024)).toEqual({ width: 1920 });
    expect(getMatchResize(3024, 4032)).toEqual({ height: 1920 });
    expect(getMatchResize(1080, 1920)).toBeNull();
  });

  it('uses known capture dimensions without decoding the image again', async () => {
    const onPerformance = jest.fn();
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      headers: new Headers({ 'server-timing': 'total;dur=1200' }),
      json: async () => ({ matches: [] }),
    });

    await matchSantinhoFaces({
      photoUri: 'file:///tmp/santinho.jpg',
      photoWidth: 1080,
      photoHeight: 1920,
      uf: 'SP',
      onPerformance,
    });

    expect(Image.getSize).not.toHaveBeenCalled();
    expect(onPerformance).toHaveBeenCalledWith(
      expect.objectContaining({ uploadBytes: 5, serverTiming: 'total;dur=1200' }),
    );
  });

  it('throws when the backend rejects the request', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
    });

    await expect(
      matchSantinhoPhoto({
        photoUri: 'file:///tmp/santinho.jpg',
        uf: 'SP',
      }),
    ).rejects.toThrow('Match falhou com status 503');
  });

  it('maps candidates grouped by detected face', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        matches: [],
        faces: [
          {
            face_id: 'face-0',
            bounding_box: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
            matches: [
              {
                candidate_id: 'candidate-1',
                ballot_name: 'CANDIDATA UM',
                party: 'ABC',
                number: '1234',
                office: 'federal_deputy',
                distance: 0.1,
                confidence: 0.9,
              },
            ],
          },
          { face_id: 'face-1', bounding_box: null, matches: [] },
        ],
      }),
    });

    const faces = await matchSantinhoFaces({
      photoUri: 'file:///tmp/santinho.jpg',
      uf: 'SP',
    });

    expect(faces).toHaveLength(2);
    expect(faces[0]).toEqual(
      expect.objectContaining({
        faceId: 'face-0',
        boundingBox: { x: 0.1, y: 0.2, width: 0.3, height: 0.4 },
        matches: [expect.objectContaining({ id: 'candidate-1' })],
      }),
    );
  });
});
