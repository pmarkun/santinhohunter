import AsyncStorage from '@react-native-async-storage/async-storage';

import { getStoredCaptures, saveCapture } from '@/services/captureStorage';
import { syncPendingCaptures } from '@/services/syncService';
import type { SantinhoCapture } from '@/types/domain';
import { getCaptureEvidence } from '@/services/captureEvidenceStorage';

jest.mock('@/services/captureEvidenceStorage', () => ({
  clearCaptureEvidenceStorage: jest.fn(async () => undefined),
  getCaptureEvidence: jest.fn(async () => new Blob(['jpeg'], { type: 'image/jpeg' })),
}));

const confirmedCapture: SantinhoCapture = {
  id: 'cap-sync-1',
  photoUri: 'mock://photo',
  createdAt: '2026-01-01T00:00:00.000Z',
  capturedAt: '2026-01-01T00:00:00.000Z',
  uf: 'SP',
  candidateMatches: [
    {
      candidateId: '250002052120',
      confidence: 1,
      matchType: 'manual_selection',
      rank: 1,
    },
  ],
  selectedCandidateId: '250002052120',
  office: 'councilor',
  status: 'confirmed',
  syncStatus: 'pending_sync',
};

describe('syncService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('moves pending captures to synced after API success', async () => {
    await saveCapture(confirmedCapture);
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn(async () => ({ id: 'server-id', sync_status: 'synced' })),
    } as unknown as Response);

    await syncPendingCaptures();

    const captures = await getStoredCaptures();
    expect(captures[0]?.syncStatus).toBe('synced');
  });

  it('keeps failed network captures available for retry', async () => {
    await saveCapture(confirmedCapture);
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    await syncPendingCaptures();

    const captures = await getStoredCaptures();
    expect(captures[0]?.syncStatus).toBe('sync_failed');
  });

  it('sends every identified candidate in the capture payload', async () => {
    await saveCapture({
      ...confirmedCapture,
      identifiedCandidates: [
        {
          candidateId: '250002052120',
          office: 'councilor',
          faceId: 'face-0',
          selectionType: 'face_vector',
          confidence: 0.92,
        },
        {
          candidateId: 'candidate-2',
          office: 'councilor',
          faceId: 'face-1',
          selectionType: 'manual_selection',
        },
      ],
    });
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn(async () => ({ id: 'server-id', sync_status: 'synced' })),
    } as unknown as Response);

    await syncPendingCaptures();

    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const payload = JSON.parse(String(request.body)) as { selected_candidates: unknown[] };
    expect(payload.selected_candidates).toEqual([
      expect.objectContaining({ candidate_id: '250002052120', face_id: 'face-0' }),
      expect.objectContaining({ candidate_id: 'candidate-2', face_id: 'face-1' }),
    ]);
  });

  it('only syncs a new capture after uploading its evidence', async () => {
    await saveCapture({
      ...confirmedCapture,
      evidenceRequired: true,
      evidenceUri: 'file:///persistent/cap-sync-1.jpg',
    });
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn(async () => ({ id: 'server-id', sync_status: 'synced' })),
    } as unknown as Response);

    await syncPendingCaptures();

    expect(getCaptureEvidence).toHaveBeenCalledWith('file:///persistent/cap-sync-1.jpg');
    expect(fetchMock.mock.calls[0]?.[0]).toContain('/captures/with-evidence');
    const request = fetchMock.mock.calls[0]?.[1] as RequestInit;
    expect(request.body).toBeInstanceOf(FormData);
    await expect(getStoredCaptures()).resolves.toEqual([
      expect.objectContaining({ syncStatus: 'synced' }),
    ]);
  });

  it('keeps required evidence pending when the local photo is missing', async () => {
    jest.mocked(getCaptureEvidence).mockRejectedValueOnce(new Error('missing'));
    await saveCapture({
      ...confirmedCapture,
      evidenceRequired: true,
      evidenceUri: 'file:///missing.jpg',
    });

    await syncPendingCaptures();

    await expect(getStoredCaptures()).resolves.toEqual([
      expect.objectContaining({ syncStatus: 'sync_failed' }),
    ]);
  });
});
