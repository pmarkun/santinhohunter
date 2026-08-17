import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Image, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import { CaptureAction } from '@/components/CaptureAction';
import { CompactTopBar } from '@/components/CompactTopBar';
import { MobileScreen } from '@/components/MobileScreen';
import { UfPickerModal } from '@/components/UfPickerModal';
import { fetchPublicRanking } from '@/services/rankingService';
import { syncPendingCaptures } from '@/services/syncService';
import { getStoredUf, saveStoredUf } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { RankingEntry, Uf } from '@/types/domain';

export default function HuntScreen() {
  const { height } = useWindowDimensions();
  const compact = height < 720;
  const [uf, setUf] = useState<Uf>('SP');
  const [ranking, setRanking] = useState<RankingEntry[]>([]);
  const [ufPickerVisible, setUfPickerVisible] = useState(false);

  useEffect(() => {
    let active = true;

    async function loadHome() {
      const storedUf = await getStoredUf();
      const [, entries] = await Promise.all([
        syncPendingCaptures(),
        fetchPublicRanking({ uf: storedUf, office: 'federal_deputy' }),
      ]);

      if (active) {
        setUf(storedUf);
        setRanking(entries);
      }
    }

    loadHome();
    return () => {
      active = false;
    };
  }, []);

  const leader = ranking[0];
  const total = useMemo(
    () => ranking.reduce((sum, entry) => sum + entry.count, 0),
    [ranking],
  );

  async function selectUf(nextUf: Uf) {
    setUfPickerVisible(false);
    setUf(nextUf);
    await saveStoredUf(nextUf);
    setRanking(await fetchPublicRanking({ uf: nextUf, office: 'federal_deputy' }));
  }

  return (
    <>
      <MobileScreen
        compact={compact}
        top={
          <CompactTopBar
            onPressUf={() => setUfPickerVisible(true)}
            title="Caçadores de Santinhos"
            uf={uf}
          />
        }
      >
      <View style={styles.intro}>
        <Text numberOfLines={2} style={[styles.title, compact && styles.compactTitle]}>
          Flagrar lixo eleitoral
        </Text>
        <Text numberOfLines={2} style={styles.body}>
          Fotografe santinhos jogados na rua e mande para o ranking da sujeira.
        </Text>
      </View>

      <CaptureAction compact={compact} onPress={() => router.push('/capture/camera')} />

      <View style={styles.stateLine}>
        <MaterialCommunityIcons color={colors.asphalt} name="map-marker" size={21} />
        <Text style={styles.stateText}>
          {total} {total === 1 ? 'flagrante' : 'flagrantes'} em {uf}
        </Text>
      </View>

      <View style={styles.ranking}>
        <View style={styles.rankingHeader}>
          <Text style={styles.sectionTitle}>Ranking em {uf}</Text>
          <Text onPress={() => router.push('/(tabs)/ranking')} style={styles.rankingLink}>
            Ver ranking
          </Text>
        </View>

        {leader ? (
          <View style={styles.leaderRow}>
            <Text style={styles.position}>1</Text>
            {leader.candidate.photoUrl ? (
              <Image source={{ uri: leader.candidate.photoUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarFallback}>
                <MaterialCommunityIcons color={colors.muted} name="account" size={30} />
              </View>
            )}
            <View style={styles.leaderBody}>
              <Text numberOfLines={1} style={styles.leaderName}>
                {leader.candidate.ballotName}
              </Text>
              <Text numberOfLines={1} style={styles.leaderMeta}>
                {leader.candidate.number} / {leader.candidate.party}
              </Text>
            </View>
            <View style={styles.countWrap}>
              <Text style={styles.count}>{leader.count}</Text>
              <Text style={styles.countLabel}>santinhos</Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyRow}>
            <Text style={styles.emptyText}>A rua ainda está quieta nesse ranking.</Text>
          </View>
        )}
      </View>
      </MobileScreen>
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
  intro: {
    gap: spacing.xs,
  },
  title: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 39,
    fontWeight: '900',
    lineHeight: 40,
    textTransform: 'uppercase',
  },
  compactTitle: {
    fontSize: 33,
    lineHeight: 34,
  },
  body: {
    color: colors.steel,
    fontFamily: fontFamilies.body,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 20,
  },
  stateLine: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    minHeight: 28,
  },
  stateText: {
    color: colors.asphalt,
    fontSize: 15,
    fontWeight: '700',
  },
  ranking: {
    borderTopColor: colors.asphalt,
    borderTopWidth: 1,
  },
  rankingHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    minHeight: 40,
  },
  sectionTitle: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  rankingLink: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  leaderRow: {
    alignItems: 'center',
    borderTopColor: colors.line,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 80,
    paddingVertical: spacing.sm,
  },
  position: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 36,
    fontWeight: '900',
  },
  avatar: {
    backgroundColor: colors.line,
    height: 58,
    width: 52,
  },
  avatarFallback: {
    alignItems: 'center',
    backgroundColor: '#EFEFEF',
    height: 58,
    justifyContent: 'center',
    width: 52,
  },
  leaderBody: {
    flex: 1,
  },
  leaderName: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 19,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  leaderMeta: {
    color: colors.steel,
    fontSize: 12,
    fontWeight: '700',
  },
  countWrap: {
    alignItems: 'flex-end',
  },
  count: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 30,
    fontWeight: '900',
    lineHeight: 31,
  },
  countLabel: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 11,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  emptyRow: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    justifyContent: 'center',
    minHeight: 70,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 14,
    fontWeight: '700',
  },
});
