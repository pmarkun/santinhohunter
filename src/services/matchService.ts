import { Platform } from 'react-native';

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
  return process.env.EXPO_PUBLIC_SANTINHO_API_BASE_URL ?? 'http://127.0.0.1:8011';
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
    id: candidate.candidate_id,
    electionYear: 2024,
    uf,
    office: candidate.office,
    number: candidate.number,
    ballotName: candidate.ballot_name,
    fullName: candidate.ballot_name,
    party: candidate.party,
    confidence: candidate.confidence,
    distance: candidate.distance,
  };
}
