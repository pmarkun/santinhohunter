import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import { type } from '@/theme/typography';

type TrashCounterProps = {
  count: number;
  label: string;
};

export function TrashCounter({ count, label }: TrashCounterProps) {
  const scale = useSharedValue(0.96);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 12, stiffness: 180 });
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrap, animatedStyle]}>
      <View style={styles.stamp}>
        <Text style={styles.count}>{count}</Text>
        <Text style={styles.label}>{label}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
    padding: spacing.md,
  },
  stamp: {
    borderColor: colors.alert,
    borderRadius: radii.sm,
    borderStyle: 'dashed',
    borderWidth: 2,
    padding: spacing.lg,
  },
  count: {
    color: colors.asphalt,
    fontSize: type.counter,
    fontWeight: '900',
    lineHeight: 58,
  },
  label: {
    color: colors.steel,
    fontSize: type.body,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
