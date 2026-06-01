import { clearCaptureDraft, getCaptureDraft, setCaptureDraft } from '@/services/captureDraft';

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
});
