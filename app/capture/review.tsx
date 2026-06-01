import { router } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { clearCaptureDraft, getCaptureDraft } from '@/services/captureDraft';
import { saveCapture } from '@/services/captureStorage';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';

export default function CaptureReviewScreen() {
  const draft = getCaptureDraft();

  async function saveWithoutCandidate() {
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
      status: 'needs_manual_match',
      syncStatus: 'pending_sync',
      ...(draft.location.latitude !== undefined ? { latitude: draft.location.latitude } : {}),
      ...(draft.location.longitude !== undefined ? { longitude: draft.location.longitude } : {}),
      ...(draft.location.accuracy !== undefined ? { accuracy: draft.location.accuracy } : {}),
      ...(draft.location.city ? { city: draft.location.city } : {}),
    });

    clearCaptureDraft();
    router.replace('/capture/manual-search');
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

      <PrimaryActionButton label="Buscar candidato" onPress={saveWithoutCandidate} />
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
  helpText: {
    color: colors.steel,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
});
