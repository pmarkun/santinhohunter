import {
  clearCaptureDraft,
  getCaptureDraft,
  selectCaptureDraftCandidate,
  setCaptureDraft,
} from '@/services/captureDraft';

describe('captureDraft', () => {
  afterEach(() => {
    clearCaptureDraft();
  });

  it('stores the current capture draft outside the route URL', () => {
    const draft = {
      photoUri: 'data:image/jpeg;base64,abc',
      capturedAt: '2026-06-01T12:00:00.000Z',
      location: {
        uf: 'SP' as const,
        latitude: -23.5,
        longitude: -46.6,
      },
    };

    setCaptureDraft(draft);

    expect(getCaptureDraft()).toEqual(draft);
  });

  it('clears the current capture draft', () => {
    setCaptureDraft({
      photoUri: 'mock://photo',
      capturedAt: '2026-06-01T12:00:00.000Z',
      location: { uf: 'SP' },
    });

    clearCaptureDraft();

    expect(getCaptureDraft()).toBeNull();
  });

  it('keeps a manual candidate attached to the active draft', () => {
    setCaptureDraft({
      photoUri: 'mock://photo',
      capturedAt: '2026-06-01T12:00:00.000Z',
      location: { uf: 'SP' },
    });

    selectCaptureDraftCandidate(
      {
        id: 'candidate-1',
        electionYear: 2026,
        uf: 'SP',
        office: 'federal_deputy',
        number: '1234',
        ballotName: 'CANDIDATA TESTE',
        fullName: 'CANDIDATA TESTE',
        party: 'ABC',
      },
      'manual_selection',
    );

    expect(getCaptureDraft()).toEqual(
      expect.objectContaining({
        selectedCandidate: expect.objectContaining({ id: 'candidate-1' }),
        selectionType: 'manual_selection',
      }),
    );
  });
});
