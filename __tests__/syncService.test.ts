import AsyncStorage from '@react-native-async-storage/async-storage';

import { getStoredCaptures, saveCapture } from '@/services/captureStorage';
import { syncPendingCaptures } from '@/services/syncService';
import type { SantinhoCapture } from '@/types/domain';

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
});
