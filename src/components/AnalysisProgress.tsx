import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { getAnalysisStatus, type AnalysisMode } from '@/services/analysisStatus';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';

type AnalysisProgressProps = {
  mode: AnalysisMode;
  uf: string;
};

export function AnalysisProgress({ mode, uf }: AnalysisProgressProps) {
  const [elapsedMs, setElapsedMs] = useState(0);
  const progress = useSharedValue(0.12);

  useEffect(() => {
    progress.value = 0.12;
    progress.value = withTiming(0.9, {
      duration: mode === 'matching' ? 12000 : 5000,
      easing: Easing.out(Easing.cubic),
    });

    const startedAt = Date.now();
    const interval = setInterval(() => setElapsedMs(Date.now() - startedAt), 500);
    return () => clearInterval(interval);
  }, [mode, progress]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${Math.round(progress.value * 100)}%`,
  }));

  return (
    <View accessibilityLiveRegion="polite" style={styles.wrap}>
      <View style={styles.track}>
        <Animated.View style={[styles.fill, animatedStyle]} />
      </View>
      <Text style={styles.label}>{getAnalysisStatus(mode, elapsedMs, uf)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.sm, minHeight: 90, justifyContent: 'center' },
  track: {
    backgroundColor: '#E6E6E1',
    height: 8,
    overflow: 'hidden',
    width: '100%',
  },
  fill: { backgroundColor: colors.alert, height: '100%' },
  label: { color: colors.steel, fontSize: 15, fontWeight: '700', lineHeight: 21 },
});
