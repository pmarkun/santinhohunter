import AsyncStorage from '@react-native-async-storage/async-storage';

import { getCandidatesByUf } from '@/services/candidateService';
import { apiCandidateToCandidate, type ApiCandidate } from '@/services/apiCandidate';
import { getApiBaseUrl } from '@/services/apiConfig';
import type { Office, RankingEntry, SantinhoCapture, Uf } from '@/types/domain';

type ApiRankingEntry = {
  candidate: ApiCandidate;
  count: number;
  last_capture_at: string;
};

type ApiRankingResponse = {
  entries: ApiRankingEntry[];
};

function rankingCacheKey(uf: Uf, office: Office): string {
  return `santinhohunter:ranking:${uf}:${office}`;
}

export function buildRanking(params: {
  uf: Uf;
  office: Office;
  captures: SantinhoCapture[];
}): RankingEntry[] {
  const candidates = getCandidatesByUf(params.uf).filter(
    (candidate) => candidate.office === params.office,
  );

  return candidates
    .map((candidate) => {
      const candidateCaptures = params.captures.filter(
        (capture) =>
          capture.uf === params.uf &&
          capture.office === params.office &&
          capture.selectedCandidateId === candidate.id &&
          capture.status === 'confirmed',
      );

      return {
        candidate,
        count: candidateCaptures.length,
        lastCaptureAt: candidateCaptures[0]?.capturedAt ?? new Date(0).toISOString(),
      };
    })
    .filter((entry) => entry.count > 0)
    .sort((left, right) => {
      if (right.count !== left.count) {
        return right.count - left.count;
      }

      return right.lastCaptureAt.localeCompare(left.lastCaptureAt);
    });
}

export async function fetchPublicRanking(params: {
  uf: Uf;
  office: Office;
}): Promise<RankingEntry[]> {
  const query = new URLSearchParams({ uf: params.uf, office: params.office });

  try {
    const response = await fetch(`${getApiBaseUrl()}/rankings?${query.toString()}`);
    if (!response.ok) {
      throw new Error(`Ranking falhou com status ${response.status}`);
    }

    const payload = (await response.json()) as ApiRankingResponse;
    const entries = payload.entries.map((entry) => ({
      candidate: apiCandidateToCandidate(entry.candidate, params.uf),
      count: entry.count,
      lastCaptureAt: entry.last_capture_at,
    }));
    await AsyncStorage.setItem(rankingCacheKey(params.uf, params.office), JSON.stringify(entries));
    return entries;
  } catch {
    const cached = await AsyncStorage.getItem(rankingCacheKey(params.uf, params.office));
    if (cached) {
      const parsed = JSON.parse(cached) as RankingEntry[];
      if (Array.isArray(parsed)) {
        return parsed;
      }
    }

    return buildRanking({
      uf: params.uf,
      office: params.office,
      captures: getMockCaptures(params.uf),
    });
  }
}

export function getMockCaptures(uf: Uf): SantinhoCapture[] {
  const now = new Date();
  const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60000);
  const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60000);

  return [
    {
      id: 'cap-1',
      photoUri: 'mock://santinho-1',
      createdAt: now.toISOString(),
      capturedAt: now.toISOString(),
      uf,
      city: 'Sao Paulo',
      candidateMatches: [],
      selectedCandidateId: 'sp-governor-10',
      office: 'governor',
      status: 'confirmed',
      syncStatus: 'synced',
    },
    {
      id: 'cap-2',
      photoUri: 'mock://santinho-2',
      createdAt: fifteenMinutesAgo.toISOString(),
      capturedAt: fifteenMinutesAgo.toISOString(),
      uf,
      city: 'Sao Paulo',
      candidateMatches: [],
      selectedCandidateId: 'sp-governor-10',
      office: 'governor',
      status: 'confirmed',
      syncStatus: 'synced',
    },
    {
      id: 'cap-3',
      photoUri: 'mock://santinho-3',
      createdAt: twoHoursAgo.toISOString(),
      capturedAt: twoHoursAgo.toISOString(),
      uf,
      city: 'Sao Paulo',
      candidateMatches: [],
      selectedCandidateId: 'sp-president-13',
      office: 'president',
      status: 'confirmed',
      syncStatus: 'synced',
    },
  ];
}
