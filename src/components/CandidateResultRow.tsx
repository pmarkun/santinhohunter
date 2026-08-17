import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Image, StyleSheet, Text, View } from 'react-native';

import { officeLabels } from '@/data/offices';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { Candidate } from '@/types/domain';

type CandidateResultRowProps = {
  candidate: Candidate;
  hint?: string;
};

export function CandidateResultRow({ candidate, hint }: CandidateResultRowProps) {
  return (
    <View style={styles.row}>
      {candidate.photoUrl ? (
        <Image source={{ uri: candidate.photoUrl }} style={styles.photo} />
      ) : (
        <View style={styles.photoFallback}>
          <MaterialCommunityIcons color={colors.muted} name="account" size={34} />
        </View>
      )}
      <View style={styles.body}>
        <Text style={styles.name}>{candidate.ballotName}</Text>
        <Text style={styles.meta}>
          {candidate.number} / {candidate.party}
        </Text>
        <Text numberOfLines={1} style={styles.office}>
          {officeLabels[candidate.office]}
        </Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 104,
    paddingVertical: spacing.sm,
  },
  photo: {
    backgroundColor: '#EFEFEF',
    height: 88,
    width: 76,
  },
  photoFallback: {
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    height: 88,
    justifyContent: 'center',
    width: 76,
  },
  body: {
    flex: 1,
    gap: 1,
  },
  name: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 21,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  meta: {
    color: colors.asphalt,
    fontSize: 13,
    fontWeight: '700',
  },
  office: {
    color: colors.steel,
    fontFamily: fontFamilies.display,
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  hint: {
    color: colors.muted,
    fontSize: 12,
    fontStyle: 'italic',
    marginTop: 2,
  },
});
