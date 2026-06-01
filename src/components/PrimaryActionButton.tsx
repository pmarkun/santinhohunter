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
      <Text
        style={[
          styles.label,
          variant === 'paper' && styles.darkLabel,
          variant === 'red' && styles.lightLabel,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    borderRadius: radii.md,
    minHeight: 52,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  alert: {
    backgroundColor: colors.alert,
  },
  red: {
    backgroundColor: colors.asphalt,
  },
  paper: {
    backgroundColor: 'transparent',
    borderColor: colors.line,
    borderWidth: 1,
  },
  label: {
    color: colors.asphalt,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  darkLabel: {
    color: colors.asphalt,
  },
  lightLabel: {
    color: colors.paper,
  },
  pressed: {
    opacity: 0.7,
  },
});
