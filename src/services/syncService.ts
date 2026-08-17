import { getApiBaseUrl } from '@/services/apiConfig';
import {
  getStoredCaptures,
  replaceStoredCaptures,
  updateStoredCapture,
} from '@/services/captureStorage';
import type { SantinhoCapture } from '@/types/domain';
import { getCaptureEvidence } from '@/services/captureEvidenceStorage';

type ApiCapturePayload = {
  client_capture_id: string;
  captured_at: string;
  uf: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  accuracy?: number;
  selected_candidate_id: string;
  office: string;
  selected_candidates?: {
    candidate_id: string;
    office: string;
    face_id?: string;
    selection_type: string;
    confidence?: number;
  }[];
  candidate_matches: {
    candidate_id: string;
    confidence: number;
    match_type: string;
    rank: number;
  }[];
};

export async function syncCapture(capture: SantinhoCapture): Promise<SantinhoCapture> {
  if (!canSyncCapture(capture)) {
    return capture;
  }

  await updateStoredCapture(capture.id, (storedCapture) => ({
    ...storedCapture,
    syncStatus: 'syncing',
  }));

  try {
    const response = capture.evidenceRequired
      ? await syncCaptureWithEvidence(capture)
      : await syncLegacyCapture(capture);

    if (!response.ok) {
      throw new Error(`Sync falhou com status ${response.status}`);
    }

    return (
      (await updateStoredCapture(capture.id, (storedCapture) => ({
        ...storedCapture,
        syncStatus: 'synced',
      }))) ?? { ...capture, syncStatus: 'synced' }
    );
  } catch {
    return (
      (await updateStoredCapture(capture.id, (storedCapture) => ({
        ...storedCapture,
        syncStatus: 'sync_failed',
      }))) ?? { ...capture, syncStatus: 'sync_failed' }
    );
  }
}

async function syncLegacyCapture(capture: SantinhoCapture): Promise<Response> {
  return fetch(`${getApiBaseUrl()}/captures`, {
    body: JSON.stringify(toApiPayload(capture)),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
}

async function syncCaptureWithEvidence(capture: SantinhoCapture): Promise<Response> {
  if (!capture.evidenceUri) throw new Error('Captura sem evidência local');
  const evidence = await getCaptureEvidence(capture.evidenceUri);
  const body = new FormData();
  body.append('payload', JSON.stringify(toApiPayload(capture)));
  body.append('file', evidence, 'santinho.jpg');
  return fetch(`${getApiBaseUrl()}/captures/with-evidence`, { body, method: 'POST' });
}

export async function syncPendingCaptures(): Promise<SantinhoCapture[]> {
  const captures = await getStoredCaptures();
  let nextCaptures = captures;

  for (const capture of captures) {
    if (capture.syncStatus !== 'pending_sync' && capture.syncStatus !== 'sync_failed') {
      continue;
    }

    const syncedCapture = await syncCapture(capture);
    nextCaptures = nextCaptures.map((item) =>
      item.id === syncedCapture.id ? syncedCapture : item,
    );
  }

  await replaceStoredCaptures(nextCaptures);
  return nextCaptures;
}

function canSyncCapture(capture: SantinhoCapture): boolean {
  return (
    capture.status === 'confirmed' &&
    ((Boolean(capture.selectedCandidateId) && Boolean(capture.office)) ||
      Boolean(capture.identifiedCandidates?.length))
  );
}

function toApiPayload(capture: SantinhoCapture): ApiCapturePayload {
  const primarySelection = capture.identifiedCandidates?.[0];
  const selectedCandidateId = capture.selectedCandidateId ?? primarySelection?.candidateId;
  const office = capture.office ?? primarySelection?.office;
  if (!selectedCandidateId || !office) {
    throw new Error('Captura sem candidato confirmado');
  }

  return {
    client_capture_id: capture.id,
    captured_at: capture.capturedAt,
    uf: capture.uf,
    ...(capture.city ? { city: capture.city } : {}),
    ...(capture.latitude !== undefined ? { latitude: capture.latitude } : {}),
    ...(capture.longitude !== undefined ? { longitude: capture.longitude } : {}),
    ...(capture.accuracy !== undefined ? { accuracy: capture.accuracy } : {}),
    selected_candidate_id: selectedCandidateId,
    office,
    ...(capture.identifiedCandidates?.length
      ? {
          selected_candidates: capture.identifiedCandidates.map((selection) => ({
            candidate_id: selection.candidateId,
            office: selection.office,
            ...(selection.faceId ? { face_id: selection.faceId } : {}),
            selection_type: selection.selectionType,
            ...(selection.confidence !== undefined
              ? { confidence: selection.confidence }
              : {}),
          })),
        }
      : {}),
    candidate_matches: capture.candidateMatches.map((match) => ({
      candidate_id: match.candidateId,
      confidence: match.confidence,
      match_type: match.matchType,
      rank: match.rank,
    })),
  };
}
