import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';

type CompactTopBarProps = {
  onPressUf?: () => void;
  title: string;
  uf?: string;
};

export function CompactTopBar({ onPressUf, title, uf }: CompactTopBarProps) {
  return (
    <View style={styles.wrap}>
      <Text numberOfLines={2} style={styles.title}>
        {title}
      </Text>
      {uf ? (
        <Pressable
          accessibilityLabel={`Trocar UF. Atual: ${uf}`}
          accessibilityRole="button"
          onPress={onPressUf}
          style={({ pressed }) => [styles.ufButton, pressed && styles.pressed]}
        >
          <Text style={styles.uf}>{uf}</Text>
          <MaterialCommunityIcons color={colors.asphalt} name="chevron-down" size={22} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderBottomColor: colors.asphalt,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 58,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  title: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 21,
    fontWeight: '900',
    lineHeight: 21,
    maxWidth: '72%',
    textTransform: 'uppercase',
  },
  ufButton: {
    alignItems: 'center',
    flexDirection: 'row',
    minHeight: 48,
    paddingLeft: spacing.md,
  },
  uf: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 22,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.6,
  },
});
