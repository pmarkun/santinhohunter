import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';

type BottomAction = {
  label: string;
  onPress: () => void;
};

type BottomActionBarProps = {
  disabled?: boolean;
  label: string;
  onPress: () => void;
  secondary?: BottomAction[];
};

export function BottomActionBar({
  disabled = false,
  label,
  onPress,
  secondary = [],
}: BottomActionBarProps) {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.wrap}>
        <Pressable
          accessibilityRole="button"
          disabled={disabled}
          onPress={onPress}
          style={({ pressed }) => [
            styles.primary,
            disabled && styles.disabled,
            pressed && styles.pressed,
          ]}
        >
          <Text style={styles.primaryLabel}>{label}</Text>
        </Pressable>
        {secondary.length > 0 ? (
          <View style={styles.secondaryRow}>
            {secondary.map((action, index) => (
              <Pressable
                accessibilityRole="button"
                key={action.label}
                onPress={action.onPress}
                style={({ pressed }) => [
                  styles.secondary,
                  index > 0 && styles.secondaryBorder,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.secondaryLabel}>{action.label}</Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    borderTopColor: colors.line,
    borderTopWidth: 1,
  },
  wrap: {
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
  },
  primary: {
    alignItems: 'center',
    backgroundColor: colors.alert,
    justifyContent: 'center',
    minHeight: 56,
    paddingHorizontal: spacing.lg,
  },
  primaryLabel: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 21,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  secondaryRow: {
    flexDirection: 'row',
    minHeight: 42,
  },
  secondary: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  secondaryBorder: {
    borderLeftColor: colors.line,
    borderLeftWidth: 1,
  },
  secondaryLabel: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.65,
  },
});
