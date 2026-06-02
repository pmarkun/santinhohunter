import { matchSantinhoPhoto } from '@/services/matchService';

describe('matchService', () => {
  const originalFetch = global.fetch;

  afterEach(() => {
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
});
