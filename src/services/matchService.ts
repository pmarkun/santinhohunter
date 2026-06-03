import { Platform } from 'react-native';

import { apiCandidateToCandidate as mapApiCandidate } from '@/services/apiCandidate';
import { getApiBaseUrl } from '@/services/apiConfig';
import type { MatchedCandidate, Office, Uf } from '@/types/domain';

type ApiMatchCandidate = {
  candidate_id: string;
  ballot_name: string;
  party: string;
  number: string;
  office: Office;
  distance: number;
  confidence: number;
};

type ApiMatchResponse = {
  matches: ApiMatchCandidate[];
};

export type MatchSantinhoPhotoParams = {
  photoUri: string;
  uf: Uf;
  office?: Office;
};

export function getMatchApiBaseUrl(): string {
  return getApiBaseUrl();
}

export async function matchSantinhoPhoto(
  params: MatchSantinhoPhotoParams,
): Promise<MatchedCandidate[]> {
  const body = new FormData();
  await appendPhoto(body, params.photoUri);

  const query = new URLSearchParams({ uf: params.uf });

  if (params.office) {
    query.set('office', params.office);
  }

  const response = await fetch(`${getMatchApiBaseUrl()}/matches?${query.toString()}`, {
    body,
    method: 'POST',
  });

  if (!response.ok) {
    throw new Error(`Match falhou com status ${response.status}`);
  }

  const payload = (await response.json()) as ApiMatchResponse;
  return payload.matches.map((candidate) => apiCandidateToCandidate(candidate, params.uf));
}

async function appendPhoto(body: FormData, photoUri: string): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await fetch(photoUri);
    const blob = await response.blob();
    body.append('file', blob, 'santinho.jpg');
    return;
  }

  body.append('file', {
    name: 'santinho.jpg',
    type: 'image/jpeg',
    uri: photoUri,
  } as unknown as Blob);
}

function apiCandidateToCandidate(candidate: ApiMatchCandidate, uf: Uf): MatchedCandidate {
  return {
    ...mapApiCandidate(
      {
        candidate_id: candidate.candidate_id,
        election_year: 2024,
        uf,
        office: candidate.office,
        number: candidate.number,
        ballot_name: candidate.ballot_name,
        full_name: candidate.ballot_name,
        party: candidate.party,
      },
      uf,
    ),
    confidence: candidate.confidence,
    distance: candidate.distance,
  };
}
