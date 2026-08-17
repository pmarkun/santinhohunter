import type { PropsWithChildren, ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';

type MobileScreenProps = PropsWithChildren<{
  bottom?: ReactNode;
  compact?: boolean;
  top?: ReactNode;
}>;

export function MobileScreen({ bottom, children, compact = false, top }: MobileScreenProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      {top}
      <View style={[styles.content, compact && styles.compactContent]}>{children}</View>
      {bottom}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: colors.paper,
    flex: 1,
  },
  content: {
    flex: 1,
    gap: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
  compactContent: {
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
});
