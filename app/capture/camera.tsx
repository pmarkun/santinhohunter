import { CameraView, useCameraPermissions } from 'expo-camera';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { getCaptureLocation } from '@/services/locationService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';

export default function CameraScreen() {
  const cameraRef = useRef<CameraView>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [capturing, setCapturing] = useState(false);

  async function takePicture() {
    if (!cameraRef.current || capturing) {
      return;
    }

    setCapturing(true);

    try {
      const [photo, location] = await Promise.all([
        cameraRef.current.takePictureAsync({ quality: 0.72 }),
        getCaptureLocation(),
      ]);

      router.push({
        pathname: '/capture/review',
        params: {
          photoUri: photo.uri,
          latitude: location.latitude?.toString(),
          longitude: location.longitude?.toString(),
          accuracy: location.accuracy?.toString(),
        },
      });
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
        <Text style={styles.title}>Sem camera nao tem caca.</Text>
        <Text style={styles.body}>
          Libera a camera para fotografar o santinho jogado na rua.
        </Text>
        <PrimaryActionButton label="Liberar camera" onPress={requestPermission} />
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
    left: spacing.lg,
    position: 'absolute',
    right: spacing.lg,
  },
  permission: {
    backgroundColor: colors.asphalt,
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  title: {
    color: colors.alert,
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  body: {
    color: colors.paper,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 23,
  },
});
