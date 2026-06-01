import { StyleSheet, Text, View } from 'react-native';

import { officeLabels } from '@/data/offices';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import type { Candidate } from '@/types/domain';

type CandidateCardProps = {
  candidate: Candidate;
};

export function CandidateCard({ candidate }: CandidateCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.numberBadge}>
        <Text style={styles.number}>{candidate.number}</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.name}>{candidate.ballotName}</Text>
        <Text style={styles.meta}>
          {candidate.party} / {officeLabels[candidate.office]}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.asphalt,
    borderRadius: radii.md,
    borderWidth: 3,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  numberBadge: {
    alignItems: 'center',
    backgroundColor: colors.alert,
    borderColor: colors.asphalt,
    borderRadius: radii.sm,
    borderWidth: 2,
    minWidth: 72,
    padding: spacing.sm,
  },
  number: {
    color: colors.asphalt,
    fontSize: 20,
    fontWeight: '900',
  },
  body: {
    flex: 1,
  },
  name: {
    color: colors.asphalt,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  meta: {
    color: colors.steel,
    fontSize: 13,
    fontWeight: '700',
  },
});
