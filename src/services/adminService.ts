import { getApiBaseUrl } from '@/services/apiConfig';
import { apiCandidateToCandidate, type ApiCandidate } from '@/services/apiCandidate';
import type { Candidate, Office, Uf } from '@/types/domain';

const SESSION_KEY = 'santinhohunter:admin-session';

export type AdminCaptureStatus = 'confirmed' | 'rejected';

export type AdminCapture = {
  id: string;
  clientCaptureId: string;
  capturedAt: string;
  createdAt: string;
  uf: Uf;
  city?: string;
  latitudeApprox?: number;
  longitudeApprox?: number;
  accuracy?: number;
  status: AdminCaptureStatus;
  source: string;
  evidenceAvailable: boolean;
  evidenceMimeType?: string;
  evidenceSizeBytes?: number;
  candidates: {
    candidate: Candidate;
    faceId?: string;
    selectionType: string;
    confidence?: number;
  }[];
  moderationEvents: {
    id: string;
    previousStatus: AdminCaptureStatus;
    newStatus: AdminCaptureStatus;
    reason: string;
    createdAt: string;
  }[];
};

export type AdminCaptureList = {
  summary: { confirmed: number; rejected: number; withoutEvidence: number };
  total: number;
  entries: AdminCapture[];
};

export type AdminCaptureFilters = {
  status?: AdminCaptureStatus | undefined;
  uf?: string | undefined;
  office?: Office | undefined;
  candidateId?: string | undefined;
  from?: string | undefined;
  to?: string | undefined;
  query?: string | undefined;
  limit: number;
  offset: number;
};

type ApiAdminCapture = {
  id: string;
  client_capture_id: string;
  captured_at: string;
  created_at: string;
  uf: Uf;
  city?: string | null;
  latitude_approx?: number | null;
  longitude_approx?: number | null;
  accuracy?: number | null;
  status: AdminCaptureStatus;
  source: string;
  evidence_available: boolean;
  evidence_mime_type?: string | null;
  evidence_size_bytes?: number | null;
  candidates: {
    candidate: ApiCandidate;
    face_id?: string | null;
    selection_type: string;
    confidence?: number | null;
  }[];
  moderation_events: {
    id: string;
    previous_status: AdminCaptureStatus;
    new_status: AdminCaptureStatus;
    reason: string;
    created_at: string;
  }[];
};

export class AdminUnauthorizedError extends Error {}

export function hasAdminSession(): boolean {
  return Boolean(readToken());
}

export async function loginAdmin(password: string): Promise<void> {
  const response = await fetch(`${getApiBaseUrl()}/admin/session`, {
    body: JSON.stringify({ password }),
    headers: { 'Content-Type': 'application/json' },
    method: 'POST',
  });
  if (!response.ok) throw new Error(await responseMessage(response, 'Não foi possível entrar.'));
  const payload = (await response.json()) as { token: string; expires_at: string };
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
}

export async function logoutAdmin(): Promise<void> {
  const token = readToken();
  sessionStorage.removeItem(SESSION_KEY);
  if (!token) return;
  await fetch(`${getApiBaseUrl()}/admin/session/logout`, {
    headers: { Authorization: `Bearer ${token}` },
    method: 'POST',
  }).catch(() => undefined);
}

export async function listAdminCaptures(filters: AdminCaptureFilters): Promise<AdminCaptureList> {
  const query = new URLSearchParams({ limit: String(filters.limit), offset: String(filters.offset) });
  for (const [key, value] of Object.entries(filters)) {
    if (key !== 'limit' && key !== 'offset' && value) query.set(key, String(value));
  }
  const payload = (await adminJson(`/admin/captures?${query}`)) as {
    summary: { confirmed: number; rejected: number; without_evidence: number };
    total: number;
    entries: ApiAdminCapture[];
  };
  return {
    summary: {
      confirmed: payload.summary.confirmed,
      rejected: payload.summary.rejected,
      withoutEvidence: payload.summary.without_evidence,
    },
    total: payload.total,
    entries: payload.entries.map(mapCapture),
  };
}

export async function getAdminCapture(id: string): Promise<AdminCapture> {
  return mapCapture((await adminJson(`/admin/captures/${id}`)) as ApiAdminCapture);
}

export async function updateAdminCaptureStatus(
  id: string,
  status: AdminCaptureStatus,
  reason: string,
): Promise<AdminCapture> {
  return mapCapture(
    (await adminJson(`/admin/captures/${id}/status`, {
      body: JSON.stringify({ reason, status }),
      headers: { 'Content-Type': 'application/json' },
      method: 'PATCH',
    })) as ApiAdminCapture,
  );
}

export async function loadAdminEvidence(id: string): Promise<string> {
  const response = await adminFetch(`/admin/captures/${id}/evidence`);
  const blob = await response.blob();
  return URL.createObjectURL(blob);
}

async function adminJson(path: string, init?: RequestInit): Promise<unknown> {
  return (await adminFetch(path, init)).json();
}

async function adminFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = readToken();
  if (!token) throw new AdminUnauthorizedError('Sessão administrativa necessária');
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (response.status === 401) {
    sessionStorage.removeItem(SESSION_KEY);
    throw new AdminUnauthorizedError('Sua sessão expirou.');
  }
  if (!response.ok) throw new Error(await responseMessage(response, 'Operação administrativa falhou.'));
  return response;
}

function readToken(): string | null {
  if (typeof sessionStorage === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as { token: string; expires_at: string };
    if (new Date(session.expires_at).getTime() <= Date.now()) {
      sessionStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session.token;
  } catch {
    sessionStorage.removeItem(SESSION_KEY);
    return null;
  }
}

async function responseMessage(response: Response, fallback: string): Promise<string> {
  try {
    const payload = (await response.json()) as { detail?: string };
    return payload.detail ?? fallback;
  } catch {
    return fallback;
  }
}

function mapCapture(capture: ApiAdminCapture): AdminCapture {
  return {
    id: capture.id,
    clientCaptureId: capture.client_capture_id,
    capturedAt: capture.captured_at,
    createdAt: capture.created_at,
    uf: capture.uf,
    ...(capture.city ? { city: capture.city } : {}),
    ...(capture.latitude_approx != null ? { latitudeApprox: capture.latitude_approx } : {}),
    ...(capture.longitude_approx != null ? { longitudeApprox: capture.longitude_approx } : {}),
    ...(capture.accuracy != null ? { accuracy: capture.accuracy } : {}),
    status: capture.status,
    source: capture.source,
    evidenceAvailable: capture.evidence_available,
    ...(capture.evidence_mime_type ? { evidenceMimeType: capture.evidence_mime_type } : {}),
    ...(capture.evidence_size_bytes != null ? { evidenceSizeBytes: capture.evidence_size_bytes } : {}),
    candidates: capture.candidates.map((selection) => ({
      candidate: apiCandidateToCandidate(selection.candidate, capture.uf),
      ...(selection.face_id ? { faceId: selection.face_id } : {}),
      selectionType: selection.selection_type,
      ...(selection.confidence != null ? { confidence: selection.confidence } : {}),
    })),
    moderationEvents: capture.moderation_events.map((event) => ({
      id: event.id,
      previousStatus: event.previous_status,
      newStatus: event.new_status,
      reason: event.reason,
      createdAt: event.created_at,
    })),
  };
}
