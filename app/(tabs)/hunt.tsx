import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { findCandidateById } from '@/services/candidateService';
import { getMockCaptures } from '@/services/rankingService';
import { formatRelativeTime } from '@/services/timeService';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import { type } from '@/theme/typography';

export default function HuntScreen() {
  const latestSantinhos = useMemo(() => {
    const captures = getMockCaptures('SP');
    const countsByCandidate = captures.reduce<Record<string, number>>((acc, capture) => {
      if (capture.selectedCandidateId) {
        acc[capture.selectedCandidateId] = (acc[capture.selectedCandidateId] ?? 0) + 1;
      }

      return acc;
    }, {});

    return captures
      .filter((capture) => capture.status === 'confirmed' && capture.selectedCandidateId)
      .slice(0, 3)
      .map((capture) => {
        const candidate = findCandidateById(capture.selectedCandidateId ?? '');

        return candidate
          ? {
              capture,
              candidate,
              total: countsByCandidate[candidate.id] ?? 0,
            }
          : null;
      })
      .filter((item): item is NonNullable<typeof item> => item !== null);
  }, []);

  return (
    <AppScreen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Eleição Geral 2026 / SP</Text>
        <Text style={styles.title}>Caçadores de Santinhos</Text>
        <Text style={styles.body}>
          Toda eleição é a mesma coisa. Milhares de papéis espalhados pela cidade,
          sujando as ruas em busca de votos.
        </Text>
        <Text style={styles.body}>
          Junte-se aos Caçadores de Santinhos e ajude a denunciar!
        </Text>
      </View>

      <PrimaryActionButton
        label="Capturar"
        onPress={() => router.push('/capture/camera')}
      />

      <View style={styles.latest}>
        <Text style={styles.sectionTitle}>Últimos Santinhos encontrados</Text>
        <View style={styles.latestList}>
          {latestSantinhos.map(({ capture, candidate, total }) => (
            <View key={capture.id} style={styles.santinhoRow}>
              <View style={styles.thumb}>
                <Text style={styles.thumbText}>IMG</Text>
              </View>
              <View style={styles.santinhoBody}>
                <Text style={styles.santinhoName}>
                  {candidate.ballotName} - {candidate.party}
                </Text>
                <Text style={styles.santinhoTime}>
                  {formatRelativeTime(capture.capturedAt)}
                </Text>
              </View>
              <View style={styles.totalBadge}>
                <Text style={styles.totalValue}>{total}</Text>
                <Text style={styles.totalLabel}>total</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      <PrimaryActionButton
        label="Ver o Ranking"
        onPress={() => router.push('/(tabs)/ranking')}
        variant="red"
      />

      <Pressable
        accessibilityRole="button"
        onPress={() => router.push('/(tabs)/settings')}
        style={({ pressed }) => [styles.aboutButton, pressed && styles.pressed]}
      >
        <Text style={styles.aboutText}>sobre o projeto</Text>
      </Pressable>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.md,
  },
  kicker: {
    color: colors.alert,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.paper,
    fontSize: type.title,
    fontWeight: '900',
    lineHeight: 39,
    textTransform: 'uppercase',
  },
  body: {
    color: colors.paper,
    fontSize: type.body,
    fontWeight: '700',
    lineHeight: 24,
  },
  latest: {
    gap: spacing.md,
  },
  sectionTitle: {
    color: colors.alert,
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  latestList: {
    gap: spacing.md,
  },
  santinhoRow: {
    alignItems: 'center',
    backgroundColor: colors.paper,
    borderColor: colors.asphalt,
    borderRadius: radii.sm,
    borderWidth: 3,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  thumb: {
    alignItems: 'center',
    aspectRatio: 1,
    backgroundColor: colors.steel,
    borderColor: colors.alert,
    borderRadius: radii.sm,
    borderWidth: 2,
    justifyContent: 'center',
    width: 62,
  },
  thumbText: {
    color: colors.alert,
    fontSize: 13,
    fontWeight: '900',
  },
  santinhoBody: {
    flex: 1,
    gap: spacing.xs,
  },
  santinhoName: {
    color: colors.asphalt,
    fontSize: 16,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  santinhoTime: {
    color: colors.steel,
    fontSize: 13,
    fontWeight: '800',
  },
  totalBadge: {
    alignItems: 'center',
    backgroundColor: colors.alert,
    borderColor: colors.asphalt,
    borderRadius: radii.sm,
    borderWidth: 2,
    minWidth: 58,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  totalValue: {
    color: colors.asphalt,
    fontSize: 24,
    fontWeight: '900',
    lineHeight: 28,
  },
  totalLabel: {
    color: colors.asphalt,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  aboutButton: {
    alignItems: 'center',
    borderColor: colors.paper,
    borderRadius: radii.sm,
    borderWidth: 2,
    padding: spacing.md,
  },
  aboutText: {
    color: colors.paper,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  pressed: {
    opacity: 0.72,
  },
});
