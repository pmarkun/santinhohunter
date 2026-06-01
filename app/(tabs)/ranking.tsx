import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { RankingRow } from '@/components/RankingRow';
import { officeLabels, rankingOffices } from '@/data/offices';
import { buildRanking, getMockCaptures } from '@/services/rankingService';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import type { Office } from '@/types/domain';

export default function RankingScreen() {
  const [office, setOffice] = useState<Office>('governor');
  const captures = useMemo(() => getMockCaptures('SP'), []);
  const ranking = useMemo(() => buildRanking({ uf: 'SP', office, captures }), [captures, office]);

  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Ranking publico / SP</Text>
        <Text style={styles.title}>A pilha da sujeira</Text>
      </View>

      <View style={styles.tabs}>
        {rankingOffices.map((item) => (
          <Pressable
            accessibilityRole="button"
            key={item}
            onPress={() => setOffice(item)}
            style={[styles.tab, office === item && styles.activeTab]}
          >
            <Text style={[styles.tabText, office === item && styles.activeTabText]}>
              {officeLabels[item]}
            </Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.list}>
        {ranking.length === 0 ? (
          <EmptyState
            body="Ainda nao apareceu lixo eleitoral para esse cargo. A rua esta quieta, por enquanto."
            title="Nada na pilha"
          />
        ) : (
          ranking.map((entry, index) => (
            <RankingRow entry={entry} key={entry.candidate.id} position={index + 1} />
          ))
        )}
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.alert,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.paper,
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  tabs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tab: {
    backgroundColor: colors.steel,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 2,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeTab: {
    backgroundColor: colors.alert,
    borderColor: colors.paper,
  },
  tabText: {
    color: colors.paper,
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  activeTabText: {
    color: colors.asphalt,
  },
  list: {
    gap: spacing.md,
  },
});
