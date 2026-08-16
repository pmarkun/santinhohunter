import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BottomActionBar } from '@/components/BottomActionBar';
import { CandidateResultRow } from '@/components/CandidateResultRow';
import { FlowTopBar } from '@/components/FlowTopBar';
import { MobileScreen } from '@/components/MobileScreen';
import {
  clearCaptureDraft,
  getCaptureDraft,
  selectCaptureDraftCandidate,
} from '@/services/captureDraft';
import { saveCapture } from '@/services/captureStorage';
import { matchSantinhoPhoto } from '@/services/matchService';
import { syncCapture } from '@/services/syncService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { Candidate, MatchedCandidate, SantinhoCapture } from '@/types/domain';

type ReviewState = 'matching' | 'match_found' | 'no_match' | 'match_error' | 'saving';

export default function CaptureReviewScreen() {
  const { height } = useWindowDimensions();
  const draft = getCaptureDraft();
  const startedMatch = useRef(false);
  const [matches, setMatches] = useState<MatchedCandidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    draft?.selectedCandidate ?? null,
  );
  const [selectionType, setSelectionType] = useState<'face_vector' | 'manual_selection'>(
    draft?.selectionType ?? 'face_vector',
  );
  const [state, setState] = useState<ReviewState>(
    draft?.selectedCandidate ? 'match_found' : 'matching',
  );
  const [error, setError] = useState<string | null>(null);

  const runFaceMatch = useCallback(async () => {
    const currentDraft = getCaptureDraft();
    if (!currentDraft) {
      return;
    }

    setState('matching');
    setError(null);
    setMatches([]);

    try {
      const nextMatches = await matchSantinhoPhoto({
        photoUri: currentDraft.photoUri,
        uf: currentDraft.location.uf,
      });
      setMatches(nextMatches);

      const bestMatch = nextMatches[0];
      if (!bestMatch) {
        setSelectedCandidate(null);
        setState('no_match');
        return;
      }

      selectCaptureDraftCandidate(bestMatch, 'face_vector');
      setSelectedCandidate(bestMatch);
      setSelectionType('face_vector');
      setState('match_found');
    } catch (err) {
      setSelectedCandidate(null);
      setError(err instanceof Error ? err.message : 'O detector tropeçou agora.');
      setState('match_error');
    }
  }, []);

  useEffect(() => {
    if (!draft?.selectedCandidate && !startedMatch.current) {
      startedMatch.current = true;
      runFaceMatch();
    }
  }, [draft?.selectedCandidate, runFaceMatch]);

  useFocusEffect(
    useCallback(() => {
      const currentDraft = getCaptureDraft();
      if (currentDraft?.selectedCandidate) {
        setSelectedCandidate(currentDraft.selectedCandidate);
        setSelectionType(currentDraft.selectionType ?? 'manual_selection');
        setState('match_found');
      }
    }, []),
  );

  async function confirmAndSend() {
    const currentDraft = getCaptureDraft();
    if (!currentDraft || !selectedCandidate || state === 'saving') {
      return;
    }

    setState('saving');
    const now = new Date().toISOString();
    const candidateMatches =
      selectionType === 'face_vector'
        ? matches.map((match, index) => ({
            candidateId: match.id,
            confidence: match.confidence,
            matchType: 'face_vector' as const,
            rank: index + 1,
          }))
        : [
            {
              candidateId: selectedCandidate.id,
              confidence: 1,
              matchType: 'manual_selection' as const,
              rank: 1,
            },
          ];

    const capture: SantinhoCapture = {
      id: `cap-${Date.now()}`,
      photoUri: currentDraft.photoUri,
      createdAt: now,
      capturedAt: currentDraft.capturedAt,
      uf: currentDraft.location.uf,
      candidateMatches,
      office: selectedCandidate.office,
      selectedCandidateId: selectedCandidate.id,
      status: 'confirmed',
      syncStatus: 'pending_sync',
      ...(selectionType === 'manual_selection'
        ? { manualCandidateNumber: selectedCandidate.number }
        : {}),
      ...(currentDraft.location.latitude !== undefined
        ? { latitude: currentDraft.location.latitude }
        : {}),
      ...(currentDraft.location.longitude !== undefined
        ? { longitude: currentDraft.location.longitude }
        : {}),
      ...(currentDraft.location.accuracy !== undefined
        ? { accuracy: currentDraft.location.accuracy }
        : {}),
      ...(currentDraft.location.city ? { city: currentDraft.location.city } : {}),
    };

    await saveCapture(capture);
    const syncedCapture = await syncCapture(capture);
    clearCaptureDraft();
    router.replace({
      pathname: '/capture/success',
      params: { syncStatus: syncedCapture.syncStatus },
    });
  }

  function takeAnother() {
    clearCaptureDraft();
    router.replace('/capture/camera');
  }

  if (!draft) {
    return (
      <MobileScreen
        bottom={
          <BottomActionBar label="Voltar para capturar" onPress={() => router.replace('/capture/camera')} />
        }
        top={<FlowTopBar onBack={() => router.replace('/(tabs)/hunt')} title="Identificar" />}
      >
        <View style={styles.centerState}>
          <MaterialCommunityIcons color={colors.red} name="image-off-outline" size={46} />
          <Text style={styles.stateTitle}>A foto escapou.</Text>
          <Text style={styles.stateBody}>Volte à câmera e tente fotografar de novo.</Text>
        </View>
      </MobileScreen>
    );
  }

  const locationLabel = draft.location.city ?? draft.location.uf;
  const timeLabel = new Date(draft.capturedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const imageHeight = Math.max(150, Math.min(260, height * 0.31));
  const bottom = getBottomActions({
    confirmAndSend,
    runFaceMatch,
    state,
    takeAnother,
  });

  return (
    <MobileScreen
      bottom={<BottomActionBar {...bottom} />}
      compact={height < 700}
      top={<FlowTopBar onBack={() => router.back()} status="local" title="Identificar" />}
    >
      <Image
        resizeMode="cover"
        source={{ uri: draft.photoUri }}
        style={[styles.preview, { height: imageHeight }]}
      />

      <View style={styles.metadata}>
        <MaterialCommunityIcons color={colors.asphalt} name="map-marker-outline" size={18} />
        <Text numberOfLines={1} style={styles.metadataText}>
          {locationLabel}
        </Text>
        <View style={styles.metadataDivider} />
        <MaterialCommunityIcons color={colors.asphalt} name="clock-outline" size={18} />
        <Text style={styles.metadataText}>{timeLabel}</Text>
      </View>

      <View style={styles.result}>
        <Text style={styles.resultTitle}>
          {state === 'matching' ? 'Procurando os envolvidos...' : 'Parece ser'}
        </Text>

        {state === 'matching' || state === 'saving' ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.red} />
            <Text style={styles.stateBody}>
              {state === 'saving' ? 'Guardando a evidência...' : 'Comparando com a base do TSE...'}
            </Text>
          </View>
        ) : null}

        {state === 'match_found' && selectedCandidate ? (
          <CandidateResultRow
            candidate={selectedCandidate}
            hint={selectionType === 'face_vector' ? 'melhor palpite' : 'escolhido por você'}
          />
        ) : null}

        {state === 'no_match' ? (
          <Text style={styles.stateBody}>
            Não achei um rosto conhecido. Procure pelo número impresso no santinho.
          </Text>
        ) : null}

        {state === 'match_error' ? (
          <Text style={styles.error}>{error ?? 'Não consegui analisar essa foto agora.'}</Text>
        ) : null}
      </View>
    </MobileScreen>
  );
}

function getBottomActions(params: {
  confirmAndSend: () => void;
  runFaceMatch: () => void;
  state: ReviewState;
  takeAnother: () => void;
}) {
  if (params.state === 'match_found') {
    return {
      label: 'Confirmar e enviar',
      onPress: params.confirmAndSend,
      secondary: [
        { label: 'Não é esse', onPress: () => router.push('/capture/manual-search') },
        { label: 'Tirar outra', onPress: params.takeAnother },
      ],
    };
  }

  if (params.state === 'no_match') {
    return {
      label: 'Buscar pelo número',
      onPress: () => router.push('/capture/manual-search'),
      secondary: [{ label: 'Tirar outra', onPress: params.takeAnother }],
    };
  }

  if (params.state === 'match_error') {
    return {
      label: 'Buscar pelo número',
      onPress: () => router.push('/capture/manual-search'),
      secondary: [
        { label: 'Tentar detector', onPress: params.runFaceMatch },
        { label: 'Tirar outra', onPress: params.takeAnother },
      ],
    };
  }

  return {
    disabled: true,
    label: params.state === 'saving' ? 'Enviando...' : 'Analisando...',
    onPress: () => undefined,
  };
}

const styles = StyleSheet.create({
  preview: {
    backgroundColor: '#EFEFEF',
    width: '100%',
  },
  metadata: {
    alignItems: 'center',
    borderBottomColor: colors.asphalt,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 34,
  },
  metadataText: {
    color: colors.asphalt,
    flexShrink: 1,
    fontFamily: fontFamilies.display,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  metadataDivider: {
    backgroundColor: colors.line,
    height: 18,
    marginHorizontal: spacing.xs,
    width: 1,
  },
  result: {
    flex: 1,
    gap: spacing.sm,
  },
  resultTitle: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 21,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  loadingRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 90,
  },
  centerState: {
    alignItems: 'flex-start',
    flex: 1,
    gap: spacing.md,
    justifyContent: 'center',
  },
  stateTitle: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 34,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stateBody: {
    color: colors.steel,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 21,
  },
  error: {
    borderColor: colors.red,
    borderWidth: 1,
    color: colors.red,
    fontSize: 14,
    fontWeight: '800',
    padding: spacing.md,
  },
});
