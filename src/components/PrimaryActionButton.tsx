import { Pressable, StyleSheet, Text } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';

type PrimaryActionButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'alert' | 'red' | 'paper';
};

export function PrimaryActionButton({
  label,
  onPress,
  variant = 'alert',
}: PrimaryActionButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        styles[variant],
        pressed && styles.pressed,
      ]}
    >
      <Text style={[styles.label, variant === 'paper' && styles.darkLabel]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderColor: colors.asphalt,
    borderRadius: radii.sm,
    borderWidth: 3,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  alert: {
    backgroundColor: colors.alert,
  },
  red: {
    backgroundColor: colors.red,
  },
  paper: {
    backgroundColor: colors.paper,
  },
  label: {
    color: colors.asphalt,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  darkLabel: {
    color: colors.asphalt,
  },
  pressed: {
    opacity: 0.78,
    transform: [{ translateY: 2 }],
  },
});
