import type { Candidate, Office, Uf } from '@/types/domain';

export type ApiCandidate = {
  id?: string;
  candidate_id?: string;
  election_year?: number;
  uf?: Uf | 'BR';
  office: Office;
  number: string;
  ballot_name?: string;
  full_name?: string;
  party: string;
  photo_url?: string | null;
};

export function apiCandidateToCandidate(candidate: ApiCandidate, fallbackUf: Uf): Candidate {
  const candidateId = candidate.id ?? candidate.candidate_id;
  const ballotName = candidate.ballot_name ?? candidate.full_name ?? candidate.number;

  if (!candidateId) {
    throw new Error('Candidato sem id na API');
  }

  return {
    id: candidateId,
    electionYear: candidate.election_year ?? 2024,
    uf: candidate.uf ?? fallbackUf,
    office: candidate.office,
    number: candidate.number,
    ballotName,
    fullName: candidate.full_name ?? ballotName,
    party: candidate.party,
    ...(candidate.photo_url ? { photoUrl: candidate.photo_url } : {}),
  };
}
