import { searchCandidatesByNumber } from '@/services/candidateService';

describe('candidateService', () => {
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
});
