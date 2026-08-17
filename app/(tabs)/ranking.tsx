import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompactTopBar } from '@/components/CompactTopBar';
import { RankingRow } from '@/components/RankingRow';
import { UfPickerModal } from '@/components/UfPickerModal';
import { officeLabels, rankingOffices } from '@/data/offices';
import { fetchPublicRanking } from '@/services/rankingService';
import { syncPendingCaptures } from '@/services/syncService';
import { getStoredUf, saveStoredUf } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { Office, RankingEntry, Uf } from '@/types/domain';

export default function RankingScreen() {
  const [office, setOffice] = useState<Office>('federal_deputy');
  const [uf, setUf] = useState<Uf>('SP');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [ufPickerVisible, setUfPickerVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadRanking = useCallback(async (nextUf: Uf, nextOffice: Office) => {
    setLoading(true);
    await syncPendingCaptures();
    setRanking(await fetchPublicRanking({ uf: nextUf, office: nextOffice }));
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      getStoredUf().then(async (storedUf) => {
        if (!active) return;
        setUf(storedUf);
        await loadRanking(storedUf, office);
      });
      return () => {
        active = false;
      };
    }, [loadRanking, office]),
  );

  const total = useMemo(() => ranking.reduce((sum, entry) => sum + entry.count, 0), [ranking]);

  async function selectUf(nextUf: Uf) {
    setUfPickerVisible(false);
    setUf(nextUf);
    await saveStoredUf(nextUf);
    await loadRanking(nextUf, office);
  }

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <CompactTopBar
          onPressUf={() => setUfPickerVisible(true)}
          title="Ranking da sujeira"
          uf={uf}
        />

        <ScrollView
          contentContainerStyle={styles.officeContent}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.officeScroll}
        >
          {rankingOffices.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => setOffice(item)}
              style={[styles.officeButton, office === item && styles.activeOfficeButton]}
            >
              <Text style={[styles.officeLabel, office === item && styles.activeOfficeLabel]}>
                {officeLabels[item]}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.totalBlock}>
          <Text style={styles.total}>{total}</Text>
          <Text style={styles.totalLabel}>Santinhos encontrados</Text>
        </View>

        <FlatList
          contentContainerStyle={ranking.length === 0 ? styles.emptyList : styles.list}
          data={ranking}
          keyExtractor={(entry) => entry.candidate.id}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {loading ? 'Atualizando a pilha...' : 'Nada na pilha para esse cargo.'}
            </Text>
          }
          renderItem={({ item, index }) => (
            <RankingRow entry={item} position={index + 1} />
          )}
        />
      </SafeAreaView>
      <UfPickerModal
        activeUf={uf}
        onClose={() => setUfPickerVisible(false)}
        onSelect={selectUf}
        visible={ufPickerVisible}
      />
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  officeScroll: { borderBottomColor: colors.line, borderBottomWidth: 1, flexGrow: 0 },
  officeContent: { paddingHorizontal: spacing.lg },
  officeButton: {
    borderBottomColor: 'transparent',
    borderBottomWidth: 3,
    justifyContent: 'center',
    minHeight: 58,
    paddingHorizontal: spacing.md,
  },
  activeOfficeButton: { borderBottomColor: colors.asphalt },
  officeLabel: {
    color: colors.muted,
    fontFamily: fontFamilies.display,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  activeOfficeLabel: { color: colors.asphalt },
  totalBlock: {
    alignItems: 'center',
    borderBottomColor: colors.asphalt,
    borderBottomWidth: 2,
    flexDirection: 'row',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    minHeight: 90,
  },
  total: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 55,
    fontWeight: '900',
    lineHeight: 58,
  },
  totalLabel: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 19,
    fontWeight: '900',
    lineHeight: 20,
    maxWidth: 150,
    textTransform: 'uppercase',
  },
  list: { paddingHorizontal: spacing.lg },
  emptyList: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  emptyText: { color: colors.muted, fontSize: 15, fontWeight: '700', textAlign: 'center' },
});
