import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { BottomActionBar } from '@/components/BottomActionBar';
import { CandidateResultRow } from '@/components/CandidateResultRow';
import { FlowTopBar } from '@/components/FlowTopBar';
import { MobileScreen } from '@/components/MobileScreen';
import {
  clearCaptureDraft,
  type CaptureDraftCandidateSelection,
  getCaptureDraft,
  removeCaptureDraftFaceSelection,
  selectCaptureDraftCandidate,
  setCaptureDraftActiveFace,
} from '@/services/captureDraft';
import { saveCapture } from '@/services/captureStorage';
import { matchSantinhoFaces } from '@/services/matchService';
import { syncCapture } from '@/services/syncService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { FaceMatchGroup, SantinhoCapture } from '@/types/domain';

type ReviewState = 'matching' | 'match_found' | 'no_match' | 'match_error' | 'saving';

export default function CaptureReviewScreen() {
  const { height } = useWindowDimensions();
  const draft = getCaptureDraft();
  const startedMatch = useRef(false);
  const [faces, setFaces] = useState<FaceMatchGroup[]>([]);
  const [selections, setSelections] = useState<CaptureDraftCandidateSelection[]>(
    draft?.selectedCandidates ?? [],
  );
  const [activeFaceIndex, setActiveFaceIndex] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);
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
    setFaces([]);
    setSelections([]);
    setReviewComplete(false);

    try {
      const nextFaces = await matchSantinhoFaces({
        photoUri: currentDraft.photoUri,
        uf: currentDraft.location.uf,
      });
      if (nextFaces.length === 0) {
        setState('no_match');
        return;
      }

      const automaticSelections: CaptureDraftCandidateSelection[] = [];
      for (const face of nextFaces) {
        const bestMatch = face.matches[0];
        if (!bestMatch) {
          continue;
        }
        selectCaptureDraftCandidate(
          bestMatch,
          'face_vector',
          face.faceId,
          bestMatch.confidence,
        );
        automaticSelections.push({
          faceId: face.faceId,
          candidate: bestMatch,
          selectionType: 'face_vector',
          confidence: bestMatch.confidence,
        });
      }

      setFaces(nextFaces);
      setSelections(automaticSelections);
      setActiveFaceIndex(0);
      setCaptureDraftActiveFace(nextFaces[0]?.faceId ?? 'face-0');
      setState('match_found');
    } catch (err) {
      const message =
        err instanceof Error && !err.message.includes('Unsupported FormDataPart')
          ? err.message
          : 'Não consegui enviar essa foto para análise. Tente tirar outra ou busque pelo número.';
      setError(message);
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
      if (currentDraft?.selectedCandidates?.length) {
        setSelections(currentDraft.selectedCandidates);
        setState('match_found');
      }
    }, []),
  );

  const activeFace = faces[activeFaceIndex];
  const activeSelection = activeFace
    ? selections.find((selection) => selection.faceId === activeFace.faceId)
    : selections[0];

  function openManualSearch() {
    setCaptureDraftActiveFace(activeFace?.faceId ?? 'face-0');
    router.push('/capture/manual-search');
  }

  function advanceFace() {
    if (faces.length <= 1) {
      confirmAndSend();
      return;
    }
    if (activeFaceIndex < faces.length - 1) {
      const nextIndex = activeFaceIndex + 1;
      setActiveFaceIndex(nextIndex);
      setCaptureDraftActiveFace(faces[nextIndex]?.faceId ?? `face-${nextIndex}`);
      return;
    }
    setReviewComplete(true);
  }

  function ignoreFace() {
    if (activeFace) {
      removeCaptureDraftFaceSelection(activeFace.faceId);
      setSelections((current) =>
        current.filter((selection) => selection.faceId !== activeFace.faceId),
      );
    }
    if (activeFaceIndex < faces.length - 1) {
      const nextIndex = activeFaceIndex + 1;
      setActiveFaceIndex(nextIndex);
      setCaptureDraftActiveFace(faces[nextIndex]?.faceId ?? `face-${nextIndex}`);
    } else {
      setReviewComplete(true);
    }
  }

  function reviewAgain() {
    setReviewComplete(false);
    setActiveFaceIndex(0);
    setCaptureDraftActiveFace(faces[0]?.faceId ?? 'face-0');
  }

  async function confirmAndSend() {
    const currentDraft = getCaptureDraft();
    const confirmedSelections = currentDraft?.selectedCandidates ?? selections;
    const primary = confirmedSelections[0];
    if (!currentDraft || !primary || state === 'saving') {
      return;
    }

    setState('saving');
    const now = new Date().toISOString();
    const capture: SantinhoCapture = {
      id: `cap-${Date.now()}`,
      photoUri: currentDraft.photoUri,
      createdAt: now,
      capturedAt: currentDraft.capturedAt,
      uf: currentDraft.location.uf,
      candidateMatches: confirmedSelections.map((selection, index) => ({
        candidateId: selection.candidate.id,
        confidence: selection.confidence ?? 1,
        matchType: selection.selectionType,
        rank: index + 1,
      })),
      identifiedCandidates: confirmedSelections.map((selection) => ({
        candidateId: selection.candidate.id,
        office: selection.candidate.office,
        faceId: selection.faceId,
        selectionType: selection.selectionType,
        ...(selection.confidence !== undefined
          ? { confidence: selection.confidence }
          : {}),
      })),
      identifiedCandidateSnapshots: confirmedSelections.map(
        (selection) => selection.candidate,
      ),
      office: primary.candidate.office,
      selectedCandidateId: primary.candidate.id,
      status: 'confirmed',
      syncStatus: 'pending_sync',
      ...(primary.selectionType === 'manual_selection'
        ? { manualCandidateNumber: primary.candidate.number }
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
    return <MissingDraft />;
  }

  const locationLabel = draft.location.city ?? draft.location.uf;
  const timeLabel = new Date(draft.capturedAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  const imageHeight = Math.max(150, Math.min(250, height * 0.3));
  const bottom = getBottomActions({
    activeSelection: Boolean(activeSelection),
    advanceFace,
    confirmAndSend,
    facesCount: faces.length,
    ignoreFace,
    openManualSearch,
    reviewComplete,
    reviewAgain,
    runFaceMatch,
    selectionsCount: selections.length,
    state,
    takeAnother,
  });

  return (
    <MobileScreen
      bottom={<BottomActionBar {...bottom} />}
      compact={height < 700}
      top={<FlowTopBar onBack={() => router.back()} status="local" title="Identificar" />}
    >
      <View style={[styles.previewWrap, { height: imageHeight }]}>
        <Image
          resizeMode="cover"
          source={{ uri: draft.previewUri ?? draft.photoUri }}
          style={styles.preview}
        />
        {faces.map((face, index) =>
          face.boundingBox ? (
            <View
              key={face.faceId}
              style={[
                styles.faceMarker,
                index === activeFaceIndex && !reviewComplete && styles.activeFaceMarker,
                {
                  left: `${Math.min(92, face.boundingBox.x * 100)}%`,
                  top: `${Math.min(86, face.boundingBox.y * 100)}%`,
                },
              ]}
            >
              <Text style={styles.faceMarkerText}>{index + 1}</Text>
            </View>
          ) : null,
        )}
      </View>

      <View style={styles.metadata}>
        <MaterialCommunityIcons color={colors.asphalt} name="map-marker-outline" size={18} />
        <Text numberOfLines={1} style={styles.metadataText}>{locationLabel}</Text>
        <View style={styles.metadataDivider} />
        <MaterialCommunityIcons color={colors.asphalt} name="clock-outline" size={18} />
        <Text style={styles.metadataText}>{timeLabel}</Text>
      </View>

      <View style={styles.result}>
        <Text style={styles.resultTitle}>{getResultTitle(state, faces, activeFaceIndex, reviewComplete)}</Text>

        {state === 'matching' || state === 'saving' ? (
          <View style={styles.loadingRow}>
            <ActivityIndicator color={colors.red} />
            <Text style={styles.stateBody}>
              {state === 'saving' ? 'Guardando a evidência...' : 'Comparando com a base do TSE...'}
            </Text>
          </View>
        ) : null}

        {state === 'match_found' && !reviewComplete && activeSelection ? (
          <CandidateResultRow
            candidate={activeSelection.candidate}
            hint={activeSelection.selectionType === 'face_vector' ? 'melhor palpite' : 'escolhido por você'}
          />
        ) : null}

        {state === 'match_found' && !reviewComplete && !activeSelection ? (
          <Text style={styles.stateBody}>Não reconheci esse rosto. Busque pelo número ou ignore.</Text>
        ) : null}

        {reviewComplete ? <SelectionSummary selections={selections} /> : null}

        {state === 'no_match' ? (
          <Text style={styles.stateBody}>Não achei um rosto conhecido. Procure pelo número impresso no santinho.</Text>
        ) : null}

        {state === 'match_error' ? (
          <Text style={styles.error}>{error ?? 'Não consegui analisar essa foto agora.'}</Text>
        ) : null}
      </View>
    </MobileScreen>
  );
}

function MissingDraft() {
  return (
    <MobileScreen
      bottom={<BottomActionBar label="Voltar para capturar" onPress={() => router.replace('/capture/camera')} />}
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

function SelectionSummary({ selections }: { selections: CaptureDraftCandidateSelection[] }) {
  return (
    <View style={styles.summary}>
      {selections.slice(0, 3).map((selection, index) => (
        <View key={selection.faceId} style={styles.summaryRow}>
          <Text style={styles.summaryPosition}>{index + 1}</Text>
          <Text numberOfLines={1} style={styles.summaryName}>{selection.candidate.ballotName}</Text>
          <Text style={styles.summaryNumber}>{selection.candidate.number}</Text>
        </View>
      ))}
      {selections.length > 3 ? <Text style={styles.stateBody}>+ {selections.length - 3} envolvidos</Text> : null}
    </View>
  );
}

function getResultTitle(
  state: ReviewState,
  faces: FaceMatchGroup[],
  activeFaceIndex: number,
  reviewComplete: boolean,
): string {
  if (state === 'matching') return 'Procurando os envolvidos...';
  if (reviewComplete) return 'Envolvidos identificados';
  if (state === 'match_found' && faces.length > 1) {
    return `Pessoa ${activeFaceIndex + 1} de ${faces.length} · parece ser`;
  }
  return 'Parece ser';
}

function getBottomActions(params: {
  activeSelection: boolean;
  advanceFace: () => void;
  confirmAndSend: () => void;
  facesCount: number;
  ignoreFace: () => void;
  openManualSearch: () => void;
  reviewComplete: boolean;
  reviewAgain: () => void;
  runFaceMatch: () => void;
  selectionsCount: number;
  state: ReviewState;
  takeAnother: () => void;
}) {
  if (params.reviewComplete) {
    return {
      disabled: params.selectionsCount === 0,
      label: params.selectionsCount === 0 ? 'Identifique alguém' : 'Confirmar e enviar',
      onPress: params.confirmAndSend,
      secondary: [
        { label: 'Revisar', onPress: params.reviewAgain },
        { label: 'Tirar outra', onPress: params.takeAnother },
      ],
    };
  }

  if (params.state === 'match_found') {
    if (!params.activeSelection) {
      return {
        label: 'Buscar pelo número',
        onPress: params.openManualSearch,
        secondary: [
          ...(params.facesCount > 1 ? [{ label: 'Ignorar rosto', onPress: params.ignoreFace }] : []),
          { label: 'Tirar outra', onPress: params.takeAnother },
        ],
      };
    }
    return {
      label: params.facesCount > 1 ? 'Confirmar pessoa' : 'Confirmar e enviar',
      onPress: params.facesCount > 1 ? params.advanceFace : params.confirmAndSend,
      secondary: [
        { label: 'Não é esse', onPress: params.openManualSearch },
        params.facesCount > 1
          ? { label: 'Ignorar rosto', onPress: params.ignoreFace }
          : { label: 'Tirar outra', onPress: params.takeAnother },
      ],
    };
  }

  if (params.state === 'no_match') {
    return {
      label: 'Buscar pelo número',
      onPress: params.openManualSearch,
      secondary: [{ label: 'Tirar outra', onPress: params.takeAnother }],
    };
  }

  if (params.state === 'match_error') {
    return {
      label: 'Buscar pelo número',
      onPress: params.openManualSearch,
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
  previewWrap: { backgroundColor: '#EFEFEF', position: 'relative', width: '100%' },
  preview: { height: '100%', width: '100%' },
  faceMarker: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.asphalt,
    borderRadius: 17,
    borderWidth: 2,
    height: 34,
    justifyContent: 'center',
    position: 'absolute',
    width: 34,
  },
  activeFaceMarker: { backgroundColor: colors.alert, borderWidth: 3 },
  faceMarkerText: { color: colors.asphalt, fontSize: 14, fontWeight: '900' },
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
  metadataDivider: { backgroundColor: colors.line, height: 18, marginHorizontal: spacing.xs, width: 1 },
  result: { flex: 1, gap: spacing.sm },
  resultTitle: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  loadingRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, minHeight: 90 },
  centerState: { alignItems: 'flex-start', flex: 1, gap: spacing.md, justifyContent: 'center' },
  stateTitle: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 34,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  stateBody: { color: colors.steel, fontSize: 15, fontWeight: '600', lineHeight: 21 },
  error: { borderColor: colors.red, borderWidth: 1, color: colors.red, fontSize: 14, fontWeight: '800', padding: spacing.md },
  summary: { borderTopColor: colors.line, borderTopWidth: 1 },
  summaryRow: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 38,
  },
  summaryPosition: { color: colors.red, fontFamily: fontFamilies.display, fontSize: 18, fontWeight: '900', width: 20 },
  summaryName: { color: colors.asphalt, flex: 1, fontFamily: fontFamilies.display, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  summaryNumber: { color: colors.asphalt, fontSize: 13, fontWeight: '800' },
});
