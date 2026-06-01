import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import type { RankingEntry } from '@/types/domain';

type RankingRowProps = {
  entry: RankingEntry;
  position: number;
};

export function RankingRow({ entry, position }: RankingRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.position}>{position}</Text>
      <View style={styles.body}>
        <Text style={styles.name}>{entry.candidate.ballotName}</Text>
        <Text style={styles.meta}>
          {entry.candidate.number} / {entry.candidate.party}
        </Text>
      </View>
      <View style={styles.countBox}>
        <Text style={styles.count}>{entry.count}</Text>
        <Text style={styles.countLabel}>lixos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.asphalt,
    borderRadius: radii.sm,
    borderWidth: 3,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  position: {
    color: colors.red,
    fontSize: 28,
    fontWeight: '900',
    minWidth: 38,
  },
  body: {
    flex: 1,
  },
  name: {
    color: colors.asphalt,
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  meta: {
    color: colors.steel,
    fontSize: 13,
    fontWeight: '700',
  },
  countBox: {
    alignItems: 'center',
    backgroundColor: colors.alert,
    borderColor: colors.asphalt,
    borderRadius: radii.sm,
    borderWidth: 2,
    minWidth: 70,
    padding: spacing.sm,
  },
  count: {
    color: colors.asphalt,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  countLabel: {
    color: colors.asphalt,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
