import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { officeLabels } from '@/data/offices';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { RankingEntry } from '@/types/domain';

type RankingRowProps = {
  entry: RankingEntry;
  position: number;
};

export function RankingRow({ entry, position }: RankingRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.position}>{position}</Text>
      {entry.candidate.photoUrl ? (
        <Image source={{ uri: entry.candidate.photoUrl }} style={styles.photo} />
      ) : (
        <View style={styles.photoFallback}>
          <MaterialCommunityIcons color={colors.muted} name="account" size={31} />
        </View>
      )}
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>{entry.candidate.ballotName}</Text>
        <Text numberOfLines={1} style={styles.meta}>
          {entry.candidate.number} / {entry.candidate.party}
        </Text>
        <Text numberOfLines={1} style={styles.office}>{officeLabels[entry.candidate.office]}</Text>
      </View>
      <View style={styles.countBox}>
        <Text style={styles.count}>{entry.count}</Text>
        <Text style={styles.countLabel}>santinhos</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 108,
    paddingVertical: spacing.md,
  },
  position: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 38,
    fontWeight: '900',
    minWidth: 28,
  },
  photo: { backgroundColor: '#EFEFEF', height: 76, width: 66 },
  photoFallback: {
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    height: 76,
    justifyContent: 'center',
    width: 66,
  },
  body: { flex: 1 },
  name: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  meta: { color: colors.asphalt, fontSize: 12, fontWeight: '700' },
  office: {
    color: colors.muted,
    fontFamily: fontFamilies.display,
    fontSize: 12,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  countBox: { alignItems: 'flex-end' },
  count: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 34,
    fontWeight: '900',
    lineHeight: 35,
  },
  countLabel: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
});
