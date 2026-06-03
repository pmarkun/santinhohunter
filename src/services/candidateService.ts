import { mockCandidates } from '@/data/mockCandidates';
import { apiCandidateToCandidate, type ApiCandidate } from '@/services/apiCandidate';
import { getApiBaseUrl } from '@/services/apiConfig';
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

export async function searchCandidatesByNumberFromApi(params: {
  uf: Uf;
  number: string;
  office?: Office;
}): Promise<Candidate[]> {
  const query = params.number.replace(/\D/g, '');

  if (!query) {
    return [];
  }

  const searchParams = new URLSearchParams({ uf: params.uf, number: query });
  if (params.office) {
    searchParams.set('office', params.office);
  }

  try {
    const response = await fetch(
      `${getApiBaseUrl()}/candidates/search?${searchParams.toString()}`,
    );

    if (!response.ok) {
      throw new Error(`Busca falhou com status ${response.status}`);
    }

    const payload = (await response.json()) as { candidates: ApiCandidate[] };
    return payload.candidates.map((candidate) => apiCandidateToCandidate(candidate, params.uf));
  } catch {
    return searchCandidatesByNumber(params);
  }
}

export function findCandidateById(candidateId: string): Candidate | null {
  return mockCandidates.find((candidate) => candidate.id === candidateId) ?? null;
}
