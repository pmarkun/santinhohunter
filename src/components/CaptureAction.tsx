import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';

type CaptureActionProps = {
  compact?: boolean;
  onPress: () => void;
};

export function CaptureAction({ compact = false, onPress }: CaptureActionProps) {
  return (
    <Pressable
      accessibilityLabel="Abrir câmera"
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        compact && styles.compactButton,
        pressed && styles.pressed,
      ]}
    >
      <MaterialCommunityIcons color={colors.asphalt} name="camera" size={compact ? 54 : 68} />
      <Text style={[styles.label, compact && styles.compactLabel]}>Abrir câmera</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    backgroundColor: colors.alert,
    borderRadius: radii.sm,
    flex: 1,
    justifyContent: 'center',
    minHeight: 178,
    padding: spacing.lg,
  },
  compactButton: {
    minHeight: 136,
  },
  label: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 32,
    fontWeight: '900',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
  compactLabel: {
    fontSize: 28,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.99 }],
  },
});
