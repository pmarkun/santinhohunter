import { buildRanking } from '@/services/rankingService';
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
});
