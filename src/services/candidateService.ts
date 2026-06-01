import { mockCandidates } from '@/data/mockCandidates';
import type { Candidate, Office, Uf } from '@/types/domain';

export function getCandidatesByUf(uf: Uf): Candidate[] {
  return mockCandidates.filter((candidate) => candidate.uf === uf || candidate.uf === 'BR');
}

export function searchCandidatesByNumber(params: {
  uf: Uf;
  number: string;
  office?: Office;
}): Candidate[] {
  const query = params.number.replace(/\D/g, '');

  if (!query) {
    return [];
  }

  return getCandidatesByUf(params.uf)
    .filter((candidate) => candidate.number.startsWith(query))
    .filter((candidate) => !params.office || candidate.office === params.office);
}

export function findCandidateById(candidateId: string): Candidate | null {
  return mockCandidates.find((candidate) => candidate.id === candidateId) ?? null;
}
