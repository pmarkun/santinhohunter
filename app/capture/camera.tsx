import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { setCaptureDraft } from '@/services/captureDraft';
import { getCaptureLocation, type CaptureLocation } from '@/services/locationService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(resolve).catch(reject).finally(() => clearTimeout(timeoutId));
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
      const capturedAt = new Date().toISOString();
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

      setCaptureDraft({ photoUri: photo.uri, location, capturedAt });
      router.push('/capture/review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não consegui capturar agora.');
    } finally {
      setCapturing(false);
    }
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <StatusBar style="light" />
        <ActivityIndicator color={colors.alert} />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permission}>
        <StatusBar style="dark" />
        <MaterialCommunityIcons color={colors.asphalt} name="camera-off" size={46} />
        <Text style={styles.permissionTitle}>Sem câmera não tem caça.</Text>
        <Text style={styles.permissionBody}>
          Libere a câmera para fotografar o santinho jogado na rua.
        </Text>
        <PrimaryActionButton label="Liberar câmera" onPress={requestPermission} />
        <PrimaryActionButton
          label="Ir para o ranking"
          onPress={() => router.replace('/(tabs)/ranking')}
          variant="paper"
        />
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <CameraView ref={cameraRef} style={styles.camera} />

      <SafeAreaView edges={['top']} style={styles.topControls}>
        <Pressable
          accessibilityLabel="Fechar câmera"
          accessibilityRole="button"
          onPress={() => router.back()}
          style={styles.iconButton}
        >
          <MaterialCommunityIcons color={colors.paper} name="close" size={28} />
        </Pressable>
        <View style={styles.locationState}>
          <MaterialCommunityIcons color={colors.asphalt} name="map-marker" size={16} />
          <Text style={styles.locationText}>Localização no disparo</Text>
        </View>
      </SafeAreaView>

      <View pointerEvents="none" style={styles.frame}>
        <Text style={styles.frameText}>Enquadre o santinho inteiro</Text>
      </View>

      <SafeAreaView edges={['bottom']} style={styles.bottomControls}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Text style={styles.captureState}>
          {capturing ? 'Salvando o flagra...' : 'Toque para fotografar'}
        </Text>
        <Pressable
          accessibilityLabel={capturing ? 'Salvando fotografia' : 'Fotografar santinho'}
          accessibilityRole="button"
          disabled={capturing}
          onPress={takePicture}
          style={({ pressed }) => [styles.shutterOuter, pressed && styles.shutterPressed]}
        >
          {capturing ? (
            <ActivityIndicator color={colors.asphalt} />
          ) : (
            <View style={styles.shutterInner} />
          )}
        </Pressable>
      </SafeAreaView>
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
  topControls: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
    top: 0,
  },
  iconButton: {
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.68)',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  locationState: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    flexDirection: 'row',
    gap: spacing.xs,
    minHeight: 36,
    paddingHorizontal: spacing.md,
  },
  locationText: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  frame: {
    borderColor: colors.alert,
    borderWidth: 3,
    bottom: 174,
    left: spacing.xl,
    position: 'absolute',
    right: spacing.xl,
    top: 112,
  },
  frameText: {
    alignSelf: 'center',
    backgroundColor: colors.alert,
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 14,
    fontWeight: '900',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    textTransform: 'uppercase',
    transform: [{ translateY: -28 }],
  },
  bottomControls: {
    alignItems: 'center',
    bottom: spacing.lg,
    gap: spacing.sm,
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  captureState: {
    color: colors.paper,
    fontSize: 13,
    fontWeight: '800',
    textShadowColor: colors.asphalt,
    textShadowOffset: { height: 1, width: 0 },
    textShadowRadius: 2,
  },
  shutterOuter: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.asphalt,
    borderRadius: 43,
    borderWidth: 3,
    height: 86,
    justifyContent: 'center',
    width: 86,
  },
  shutterInner: {
    backgroundColor: colors.alert,
    borderColor: colors.asphalt,
    borderRadius: 31,
    borderWidth: 2,
    height: 62,
    width: 62,
  },
  shutterPressed: {
    transform: [{ scale: 0.95 }],
  },
  error: {
    backgroundColor: colors.paper,
    color: colors.red,
    fontSize: 14,
    fontWeight: '900',
    padding: spacing.md,
    textAlign: 'center',
    width: '100%',
  },
  permission: {
    backgroundColor: colors.paper,
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permissionTitle: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 36,
    fontWeight: '900',
    lineHeight: 38,
    textTransform: 'uppercase',
  },
  permissionBody: {
    color: colors.steel,
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 23,
  },
});
