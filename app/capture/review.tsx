import { router, useLocalSearchParams } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { saveCapture } from '@/services/captureStorage';
import { getDefaultUf } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import type { CaptureReviewParams } from '@/types/navigation';

export default function CaptureReviewScreen() {
  const params = useLocalSearchParams<CaptureReviewParams>();
  const photoUri = params.photoUri;

  async function saveWithoutCandidate() {
    const now = new Date().toISOString();

    await saveCapture({
      id: `cap-${Date.now()}`,
      photoUri,
      createdAt: now,
      capturedAt: now,
      uf: getDefaultUf(),
      candidateMatches: [],
      status: 'needs_manual_match',
      syncStatus: 'pending_sync',
      ...(params.latitude ? { latitude: Number(params.latitude) } : {}),
      ...(params.longitude ? { longitude: Number(params.longitude) } : {}),
      ...(params.accuracy ? { accuracy: Number(params.accuracy) } : {}),
    });

    router.replace('/capture/manual-search');
  }

  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Conferir flagra</Text>
        <Text style={styles.title}>Esse aqui tava dando sopa?</Text>
      </View>

      <Image source={{ uri: photoUri }} style={styles.preview} />

      <View style={styles.metaBox}>
        <Text style={styles.metaTitle}>Carimbo do flagra</Text>
        <Text style={styles.meta}>Hora: {new Date().toLocaleString()}</Text>
        <Text style={styles.meta}>
          Local: {params.latitude && params.longitude ? 'capturado' : 'sem precisão'}
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
});
