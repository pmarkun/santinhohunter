import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  clearStoredCaptures,
  confirmLatestCaptureCandidate,
  getStoredCaptures,
  saveCapture,
} from '@/services/captureStorage';
import type { SantinhoCapture } from '@/types/domain';

const capture: SantinhoCapture = {
  id: 'cap-1',
  photoUri: 'mock://photo',
  createdAt: '2026-01-01T00:00:00.000Z',
  capturedAt: '2026-01-01T00:00:00.000Z',
  uf: 'SP',
  candidateMatches: [],
  status: 'needs_manual_match',
  syncStatus: 'pending_sync',
};

describe('captureStorage', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
  });

  it('saves captures newest first', async () => {
    await saveCapture(capture);
    await saveCapture({ ...capture, id: 'cap-2' });

    const captures = await getStoredCaptures();

    expect(captures.map((item) => item.id)).toEqual(['cap-2', 'cap-1']);
  });

  it('confirms the latest capture with a manual candidate selection', async () => {
    await saveCapture(capture);

    const confirmed = await confirmLatestCaptureCandidate({
      candidateId: 'sp-state-13131',
      candidateNumber: '13131',
      office: 'state_deputy',
    });

    expect(confirmed?.status).toBe('confirmed');
    expect(confirmed?.selectedCandidateId).toBe('sp-state-13131');
    expect(confirmed?.candidateMatches[0]?.matchType).toBe('manual_selection');
  });

  it('clears stored captures', async () => {
    await saveCapture(capture);
    await clearStoredCaptures();

    await expect(getStoredCaptures()).resolves.toEqual([]);
  });
});
