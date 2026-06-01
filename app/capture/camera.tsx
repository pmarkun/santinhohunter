import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { setCaptureDraft } from '@/services/captureDraft';
import { getCaptureLocation, type CaptureLocation } from '@/services/locationService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      reject(new Error(message));
    }, timeoutMs);

    promise
      .then(resolve)
      .catch(reject)
      .finally(() => clearTimeout(timeoutId));
  });
}

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function takePicture() {
    if (!cameraRef.current || capturing) {
      return;
    }

    setCapturing(true);
    setError(null);

    try {
      const photo = await withTimeout(
        cameraRef.current.takePictureAsync({ quality: 0.72 }),
        10000,
        'A câmera demorou demais para responder.',
      );
      const location = await getCaptureLocation().catch(
        (): CaptureLocation => ({ uf: 'SP' }),
      );

      if (!photo?.uri) {
        throw new Error('Não consegui salvar a foto.');
      }

      setCaptureDraft({
        photoUri: photo.uri,
        location,
        capturedAt: new Date().toISOString(),
      });

      router.push('/capture/review');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Não consegui capturar agora.';
      setError(message);
    } finally {
      setCapturing(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.alert} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permission}>
        <Text style={styles.title}>Sem câmera não tem caça.</Text>
        <Text style={styles.body}>
          Libera a câmera para fotografar o santinho jogado na rua.
        </Text>
        <PrimaryActionButton label="Liberar câmera" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} />
      <View pointerEvents="none" style={styles.frame}>
        <Text style={styles.frameText}>Enquadra o lixo eleitoral</Text>
      </View>
      <View style={styles.controls}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryActionButton
          label={capturing ? 'Flagrando...' : 'Fotografar'}
          onPress={takePicture}
          variant="red"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    alignItems: 'center',
    backgroundColor: colors.asphalt,
    flex: 1,
    justifyContent: 'center',
  },
  container: {
    backgroundColor: colors.asphalt,
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  frame: {
    borderColor: colors.alert,
    borderWidth: 4,
    bottom: 150,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
    top: 100,
  },
  frameText: {
    backgroundColor: colors.alert,
    color: colors.asphalt,
    fontSize: 14,
    fontWeight: '900',
    padding: spacing.sm,
    position: 'absolute',
    textTransform: 'uppercase',
    top: -36,
  },
  controls: {
    bottom: spacing.xl,
    gap: spacing.md,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  error: {
    backgroundColor: colors.paper,
    borderRadius: 8,
    color: colors.red,
    fontSize: 14,
    fontWeight: '900',
    padding: spacing.md,
    textAlign: 'center',
  },
  permission: {
    backgroundColor: colors.newsprint,
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.asphalt,
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  body: {
    color: colors.steel,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
});
