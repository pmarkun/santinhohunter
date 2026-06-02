import { router } from 'expo-router';
import { useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { CandidateCard } from '@/components/CandidateCard';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { clearCaptureDraft, getCaptureDraft } from '@/services/captureDraft';
import { saveCapture } from '@/services/captureStorage';
import { matchSantinhoPhoto } from '@/services/matchService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import type { MatchedCandidate } from '@/types/domain';

export default function CaptureReviewScreen() {
  const draft = getCaptureDraft();
  const [matches, setMatches] = useState<MatchedCandidate[]>([]);
  const [matching, setMatching] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  async function saveWithoutCandidate(
    status: 'needs_manual_match' | 'rejected' = 'needs_manual_match',
  ) {
    if (!draft) {
      router.replace('/(tabs)/hunt');
      return;
    }

    const now = new Date().toISOString();

    await saveCapture({
      id: `cap-${Date.now()}`,
      photoUri: draft.photoUri,
      createdAt: now,
      capturedAt: draft.capturedAt,
      uf: draft.location.uf,
      candidateMatches: [],
      status,
      syncStatus: 'pending_sync',
      ...(draft.location.latitude !== undefined ? { latitude: draft.location.latitude } : {}),
      ...(draft.location.longitude !== undefined ? { longitude: draft.location.longitude } : {}),
      ...(draft.location.accuracy !== undefined ? { accuracy: draft.location.accuracy } : {}),
      ...(draft.location.city ? { city: draft.location.city } : {}),
    });

    clearCaptureDraft();
    router.replace(status === 'rejected' ? '/(tabs)/history' : '/capture/manual-search');
  }

  async function runFaceMatch() {
    if (!draft || matching) {
      return;
    }

    setMatching(true);
    setMatchError(null);
    setMatches([]);

    try {
      const nextMatches = await matchSantinhoPhoto({
        photoUri: draft.photoUri,
        uf: draft.location.uf,
      });

      setMatches(nextMatches);

      if (nextMatches.length === 0) {
        setMatchError('Não achei candidato nessa foto. Dá para buscar pelo número.');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'O detector tropeçou agora.';
      setMatchError(message);
    } finally {
      setMatching(false);
    }
  }

  async function confirmMatch(candidate: MatchedCandidate) {
    if (!draft) {
      router.replace('/(tabs)/hunt');
      return;
    }

    const now = new Date().toISOString();

    await saveCapture({
      id: `cap-${Date.now()}`,
      photoUri: draft.photoUri,
      createdAt: now,
      capturedAt: draft.capturedAt,
      uf: draft.location.uf,
      candidateMatches: matches.map((match, index) => ({
        candidateId: match.id,
        confidence: match.confidence,
        matchType: 'face_vector',
        rank: index + 1,
      })),
      office: candidate.office,
      selectedCandidateId: candidate.id,
      status: 'confirmed',
      syncStatus: 'pending_sync',
      ...(draft.location.latitude !== undefined ? { latitude: draft.location.latitude } : {}),
      ...(draft.location.longitude !== undefined ? { longitude: draft.location.longitude } : {}),
      ...(draft.location.accuracy !== undefined ? { accuracy: draft.location.accuracy } : {}),
      ...(draft.location.city ? { city: draft.location.city } : {}),
    });

    clearCaptureDraft();
    router.replace('/(tabs)/history');
  }

  if (!draft) {
    return (
      <AppScreen>
        <View>
          <Text style={styles.kicker}>Sem flagra carregado</Text>
          <Text style={styles.title}>A foto escapou.</Text>
        </View>
        <Text style={styles.helpText}>
          Volte para a câmera e tente fotografar o santinho de novo.
        </Text>
        <PrimaryActionButton
          label="Voltar para capturar"
          onPress={() => router.replace('/capture/camera')}
        />
      </AppScreen>
    );
  }

  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Conferir flagra</Text>
        <Text style={styles.title}>Esse aqui tava dando sopa?</Text>
      </View>

      <Image source={{ uri: draft.photoUri }} style={styles.preview} />

      <View style={styles.metaBox}>
        <Text style={styles.metaTitle}>Carimbo do flagra</Text>
        <Text style={styles.meta}>
          Hora: {new Date(draft.capturedAt).toLocaleString()}
        </Text>
        <Text style={styles.meta}>
          Local:{' '}
          {draft.location.latitude && draft.location.longitude ? 'capturado' : 'sem precisão'}
        </Text>
      </View>

      {matchError ? <Text style={styles.error}>{matchError}</Text> : null}

      {matches.length > 0 ? (
        <View style={styles.matches}>
          <Text style={styles.metaTitle}>Possíveis donos do lixo</Text>
          {matches.map((candidate) => (
            <View key={candidate.id} style={styles.matchItem}>
              <CandidateCard candidate={candidate} />
              <Text style={styles.confidence}>
                Confiança: {Math.round(candidate.confidence * 100)}%
              </Text>
              <PrimaryActionButton
                label="É esse"
                onPress={() => confirmMatch(candidate)}
                variant="red"
              />
            </View>
          ))}
        </View>
      ) : null}

      <PrimaryActionButton
        label={matching ? 'Analisando rosto...' : 'Buscar candidato'}
        onPress={runFaceMatch}
      />
      <PrimaryActionButton
        label="Buscar pelo número"
        onPress={() => saveWithoutCandidate()}
        variant="paper"
      />
      <PrimaryActionButton label="Tirar outra" onPress={() => router.back()} variant="paper" />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.asphalt,
    fontSize: 30,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  preview: {
    aspectRatio: 3 / 4,
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    width: '100%',
  },
  metaBox: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.xs,
    padding: spacing.lg,
  },
  metaTitle: {
    color: colors.asphalt,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  meta: {
    color: colors.steel,
    fontSize: 14,
    fontWeight: '700',
  },
  matches: {
    gap: spacing.md,
  },
  matchItem: {
    gap: spacing.sm,
  },
  confidence: {
    color: colors.steel,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  error: {
    backgroundColor: colors.card,
    borderColor: colors.red,
    borderRadius: 8,
    borderWidth: 1,
    color: colors.red,
    fontSize: 14,
    fontWeight: '900',
    padding: spacing.md,
  },
  helpText: {
    color: colors.steel,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
});
