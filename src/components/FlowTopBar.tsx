import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';

type FlowTopBarProps = {
  onBack: () => void;
  status?: 'local' | 'synced';
  title: string;
};

export function FlowTopBar({ onBack, status, title }: FlowTopBarProps) {
  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityLabel="Voltar"
        accessibilityRole="button"
        onPress={onBack}
        style={({ pressed }) => [styles.back, pressed && styles.pressed]}
      >
        <MaterialCommunityIcons color={colors.asphalt} name="arrow-left" size={26} />
      </Pressable>
      <Text numberOfLines={1} style={styles.title}>
        {title}
      </Text>
      <View style={[styles.status, !status && styles.emptyStatus]}>
        {status ? (
          <>
            <MaterialCommunityIcons
              color={status === 'synced' ? colors.green : colors.muted}
              name={status === 'synced' ? 'cloud-check-outline' : 'cellphone'}
              size={18}
            />
            <Text style={styles.statusText}>{status === 'synced' ? 'Enviado' : 'No aparelho'}</Text>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    borderBottomColor: colors.asphalt,
    borderBottomWidth: 1,
    flexDirection: 'row',
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  back: {
    alignItems: 'center',
    height: 48,
    justifyContent: 'center',
    width: 48,
  },
  title: {
    color: colors.asphalt,
    flex: 1,
    fontFamily: fontFamilies.display,
    fontSize: 19,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  status: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-end',
    minWidth: 78,
  },
  statusText: {
    color: colors.muted,
    fontFamily: fontFamilies.display,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyStatus: {
    minWidth: 48,
  },
  pressed: {
    opacity: 0.55,
  },
});
