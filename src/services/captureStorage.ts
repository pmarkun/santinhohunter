import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Office, SantinhoCapture } from '@/types/domain';

const CAPTURES_KEY = 'santinhohunter:captures';

export async function getStoredCaptures(): Promise<SantinhoCapture[]> {
  const raw = await AsyncStorage.getItem(CAPTURES_KEY);

  if (!raw) {
    return [];
  }

  const parsed = JSON.parse(raw) as SantinhoCapture[];
  return Array.isArray(parsed) ? parsed : [];
}

export async function saveCapture(capture: SantinhoCapture): Promise<SantinhoCapture[]> {
  const captures = await getStoredCaptures();
  const nextCaptures = [capture, ...captures];
  await AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify(nextCaptures));
  return nextCaptures;
}

export async function replaceStoredCaptures(
  captures: SantinhoCapture[],
): Promise<SantinhoCapture[]> {
  await AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify(captures));
  return captures;
}

export async function updateStoredCapture(
  captureId: string,
  updater: (capture: SantinhoCapture) => SantinhoCapture,
): Promise<SantinhoCapture | null> {
  const captures = await getStoredCaptures();
  let updatedCapture: SantinhoCapture | null = null;
  const nextCaptures = captures.map((capture) => {
    if (capture.id !== captureId) {
      return capture;
    }

    updatedCapture = updater(capture);
    return updatedCapture;
  });

  if (!updatedCapture) {
    return null;
  }

  await replaceStoredCaptures(nextCaptures);
  return updatedCapture;
}

export async function confirmLatestCaptureCandidate(params: {
  candidateId: string;
  candidateNumber: string;
  office: Office;
}): Promise<SantinhoCapture | null> {
  const captures = await getStoredCaptures();
  const [latestCapture, ...rest] = captures;

  if (!latestCapture) {
    return null;
  }

  const confirmed: SantinhoCapture = {
    ...latestCapture,
    candidateMatches: [
      {
        candidateId: params.candidateId,
        confidence: 1,
        matchType: 'manual_selection',
        rank: 1,
      },
    ],
    manualCandidateNumber: params.candidateNumber,
    office: params.office,
    selectedCandidateId: params.candidateId,
    status: 'confirmed',
    syncStatus: 'pending_sync',
  };

  await AsyncStorage.setItem(CAPTURES_KEY, JSON.stringify([confirmed, ...rest]));
  return confirmed;
}

export async function clearStoredCaptures(): Promise<void> {
  await AsyncStorage.removeItem(CAPTURES_KEY);
}
