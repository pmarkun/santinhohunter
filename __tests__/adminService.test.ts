import {
  AdminUnauthorizedError,
  hasAdminSession,
  listAdminCaptures,
  loginAdmin,
  updateAdminCaptureStatus,
} from '@/services/adminService';

const storage = new Map<string, string>();
const sessionStorageMock = {
  getItem: jest.fn((key: string) => storage.get(key) ?? null),
  removeItem: jest.fn((key: string) => storage.delete(key)),
  setItem: jest.fn((key: string, value: string) => storage.set(key, value)),
};

const apiCapture = {
  id: 'server-1',
  client_capture_id: 'cap-1',
  captured_at: '2026-08-17T12:00:00Z',
  created_at: '2026-08-17T12:01:00Z',
  uf: 'SP',
  city: 'Sao Paulo',
  status: 'confirmed',
  source: 'app',
  evidence_available: true,
  candidates: [
    {
      candidate: {
        id: 'candidate-1',
        election_year: 2026,
        uf: 'SP',
        office: 'governor',
        number: '10',
        ballot_name: 'CANDIDATA TESTE',
        full_name: 'Candidata Teste',
        party: 'TESTE',
      },
      selection_type: 'face_vector',
      confidence: 0.9,
    },
  ],
  moderation_events: [],
};

describe('adminService', () => {
  beforeEach(() => {
    storage.clear();
    jest.restoreAllMocks();
    Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: sessionStorageMock });
  });

  it('keeps the signed session only in sessionStorage', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn(async () => ({ token: 'signed-token', expires_at: '2099-01-01T00:00:00Z' })),
    } as unknown as Response);

    await loginAdmin('secret');

    expect(hasAdminSession()).toBe(true);
    expect(sessionStorageMock.setItem).toHaveBeenCalledWith(
      'santinhohunter:admin-session',
      expect.stringContaining('signed-token'),
    );
  });

  it('maps filters, summary and candidates from the API', async () => {
    seedSession();
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn(async () => ({
        summary: { confirmed: 3, rejected: 1, without_evidence: 2 },
        total: 1,
        entries: [apiCapture],
      })),
    } as unknown as Response);

    const result = await listAdminCaptures({ limit: 25, offset: 0, status: 'confirmed', uf: 'SP' });

    expect(fetchMock.mock.calls[0]?.[0]).toContain('status=confirmed');
    expect(result.summary.withoutEvidence).toBe(2);
    expect(result.entries[0]?.candidates[0]?.candidate.ballotName).toBe('CANDIDATA TESTE');
  });

  it('sends moderation reason and status', async () => {
    seedSession();
    const fetchMock = jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn(async () => ({ ...apiCapture, status: 'rejected' })),
    } as unknown as Response);

    const result = await updateAdminCaptureStatus('server-1', 'rejected', 'Registro incorreto');

    expect(result.status).toBe('rejected');
    expect(fetchMock.mock.calls[0]?.[1]).toEqual(expect.objectContaining({
      body: JSON.stringify({ reason: 'Registro incorreto', status: 'rejected' }),
      method: 'PATCH',
    }));
  });

  it('clears an expired server session after a 401', async () => {
    seedSession();
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({ ok: false, status: 401 } as Response);

    await expect(listAdminCaptures({ limit: 25, offset: 0 })).rejects.toBeInstanceOf(AdminUnauthorizedError);
    expect(hasAdminSession()).toBe(false);
  });
});

function seedSession() {
  storage.set(
    'santinhohunter:admin-session',
    JSON.stringify({ token: 'signed-token', expires_at: '2099-01-01T00:00:00Z' }),
  );
}
