import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import { apiCandidateToCandidate as mapApiCandidate } from '@/services/apiCandidate';
import { getApiBaseUrl } from '@/services/apiConfig';
import type { FaceMatchGroup, MatchedCandidate, Office, Uf } from '@/types/domain';

type ApiMatchCandidate = {
  candidate_id: string;
  election_year?: number;
  ballot_name: string;
  party: string;
  number: string;
  office: Office;
  distance: number;
  confidence: number;
};

type ApiMatchResponse = {
  matches: ApiMatchCandidate[];
  faces?: {
    face_id: string;
    bounding_box?: {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null;
    matches: ApiMatchCandidate[];
  }[];
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
  const faces = await matchSantinhoFaces(params);
  return faces[0]?.matches ?? [];
}

export async function matchSantinhoFaces(
  params: MatchSantinhoPhotoParams,
): Promise<FaceMatchGroup[]> {
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
  const apiFaces =
    payload.faces !== undefined
      ? payload.faces
      : payload.matches.length > 0
        ? [{ face_id: 'face-0', bounding_box: null, matches: payload.matches }]
        : [];

  return apiFaces.map((face) => ({
    faceId: face.face_id,
    ...(face.bounding_box ? { boundingBox: face.bounding_box } : {}),
    matches: face.matches.map((candidate) => apiCandidateToCandidate(candidate, params.uf)),
  }));
}

async function appendPhoto(body: FormData, photoUri: string): Promise<void> {
  if (Platform.OS === 'web') {
    const response = await fetch(photoUri);
    const blob = await response.blob();
    body.append('file', blob, 'santinho.jpg');
    return;
  }

  body.append('file', new File(photoUri), 'santinho.jpg');
}

function apiCandidateToCandidate(candidate: ApiMatchCandidate, uf: Uf): MatchedCandidate {
  return {
    ...mapApiCandidate(
      {
        candidate_id: candidate.candidate_id,
        election_year: candidate.election_year ?? 2026,
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
