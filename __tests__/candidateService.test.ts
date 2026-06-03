import {
  searchCandidatesByNumber,
  searchCandidatesByNumberFromApi,
} from '@/services/candidateService';

describe('candidateService', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('searches candidates by number prefix in the active UF', () => {
    const results = searchCandidatesByNumber({ uf: 'SP', number: '13' });

    expect(results.map((candidate) => candidate.number)).toEqual(
      expect.arrayContaining(['13', '13131']),
    );
  });

  it('filters by office when provided', () => {
    const results = searchCandidatesByNumber({
      uf: 'SP',
      number: '13',
      office: 'state_deputy',
    });

    expect(results).toHaveLength(1);
    expect(results[0]?.id).toBe('sp-state-13131');
  });

  it('ignores non numeric characters', () => {
    const results = searchCandidatesByNumber({ uf: 'SP', number: '50-50' });

    expect(results[0]?.id).toBe('sp-federal-5050');
  });

  it('searches candidates by number through the API', async () => {
    jest.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: jest.fn(async () => ({
        candidates: [
          {
            id: '250002052120',
            election_year: 2024,
            uf: 'SP',
            office: 'councilor',
            number: '18888',
            ballot_name: 'PEDRO DA IA',
            full_name: 'PEDRO DA IA',
            party: 'REDE',
          },
        ],
      })),
    } as unknown as Response);

    const results = await searchCandidatesByNumberFromApi({ uf: 'SP', number: '18888' });

    expect(results[0]?.id).toBe('250002052120');
    expect(results[0]?.ballotName).toBe('PEDRO DA IA');
  });

  it('falls back to local candidates when API search fails', async () => {
    jest.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    const results = await searchCandidatesByNumberFromApi({ uf: 'SP', number: '5050' });

    expect(results[0]?.id).toBe('sp-federal-5050');
  });
});
