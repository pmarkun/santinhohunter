import AsyncStorage from '@react-native-async-storage/async-storage';

import { buildRanking, fetchPublicRanking } from '@/services/rankingService';
import type { SantinhoCapture } from '@/types/domain';

const baseCapture: SantinhoCapture = {
  id: 'cap',
  photoUri: 'mock://photo',
  createdAt: '2026-01-01T00:00:00.000Z',
  capturedAt: '2026-01-01T00:00:00.000Z',
  uf: 'SP',
  candidateMatches: [],
  status: 'confirmed',
  syncStatus: 'synced',
};

describe('rankingService', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.restoreAllMocks();
  });

  it('orders confirmed captures by count', () => {
    const captures: SantinhoCapture[] = [
      {
        ...baseCapture,
        id: 'cap-1',
        selectedCandidateId: 'sp-governor-13',
        office: 'governor',
      },
      {
        ...baseCapture,
        id: 'cap-2',
        selectedCandidateId: 'sp-governor-10',
        office: 'governor',
      },
      {
        ...baseCapture,
        id: 'cap-3',
        selectedCandidateId: 'sp-governor-10',
        office: 'governor',
      },
    ];

    const ranking = buildRanking({ uf: 'SP', office: 'governor', captures });

    expect(ranking[0]?.candidate.id).toBe('sp-governor-10');
    expect(ranking[0]?.count).toBe(2);
    expect(ranking[1]?.candidate.id).toBe('sp-governor-13');
    expect(ranking[1]?.count).toBe(1);
  });

  it('ignores captures from other offices and unconfirmed captures', () => {
    const captures: SantinhoCapture[] = [
      {
        ...baseCapture,
        id: 'cap-1',
        selectedCandidateId: 'sp-governor-10',
        office: 'governor',
        status: 'needs_manual_match',
      },
      {
        ...baseCapture,
        id: 'cap-2',
        selectedCandidateId: 'sp-president-13',
        office: 'president',
      },
    ];

    const ranking = buildRanking({ uf: 'SP', office: 'governor', captures });

    expect(ranking).toEqual([]);
  });

  it('uses public ranking API and caches the latest result', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn(async () => ({
        entries: [
          {
            candidate: {
              id: '250002052120',
              election_year: 2024,
              uf: 'SP',
              office: 'councilor',
              number: '18888',
              ballot_name: 'PEDRO DA IA',
              full_name: 'PEDRO DA IA',
              party: 'REDE',
            },
            count: 3,
            last_capture_at: '2026-06-02T12:00:00Z',
          },
        ],
      })),
    } as unknown as Response);

    const ranking = await fetchPublicRanking({ uf: 'SP', office: 'councilor' });

    expect(ranking[0]?.candidate.id).toBe('250002052120');
    expect(ranking[0]?.count).toBe(3);
    await expect(
      AsyncStorage.getItem('santinhohunter:ranking:SP:councilor'),
    ).resolves.toContain('PEDRO DA IA');
  });

  it('falls back to cached ranking when the API is offline', async () => {
    await AsyncStorage.setItem(
      'santinhohunter:ranking:SP:councilor',
      JSON.stringify([
        {
          candidate: {
            id: '250002052120',
            electionYear: 2024,
            uf: 'SP',
            office: 'councilor',
            number: '18888',
            ballotName: 'PEDRO DA IA',
            fullName: 'PEDRO DA IA',
            party: 'REDE',
          },
          count: 1,
          lastCaptureAt: '2026-06-02T12:00:00Z',
        },
      ]),
    );
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    const ranking = await fetchPublicRanking({ uf: 'SP', office: 'councilor' });

    expect(ranking[0]?.candidate.id).toBe('250002052120');
    expect(ranking[0]?.count).toBe(1);
  });
});
