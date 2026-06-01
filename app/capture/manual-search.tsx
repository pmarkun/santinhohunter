import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { CandidateCard } from '@/components/CandidateCard';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { officeLabels, rankingOffices } from '@/data/offices';
import { searchCandidatesByNumber } from '@/services/candidateService';
import { confirmLatestCaptureCandidate } from '@/services/captureStorage';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import type { Office } from '@/types/domain';

export default function ManualSearchScreen() {
  const [number, setNumber] = useState('');
  const [office, setOffice] = useState<Office | undefined>(undefined);
  const results = useMemo(
    () => searchCandidatesByNumber({ uf: 'SP', number, ...(office ? { office } : {}) }),
    [number, office],
  );

  async function confirmCandidate(
    candidateId: string,
    candidateNumber: string,
    candidateOffice: Office,
  ) {
    await confirmLatestCaptureCandidate({
      candidateId,
      candidateNumber,
      office: candidateOffice,
    });
    router.replace('/(tabs)/history');
  }

  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Nao bateu?</Text>
        <Text style={styles.title}>Busca pelo numero</Text>
      </View>

      <TextInput
        accessibilityLabel="Numero do candidato"
        inputMode="numeric"
        keyboardType="number-pad"
        onChangeText={setNumber}
        placeholder="13, 5050, 13131..."
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={number}
      />

      <View style={styles.tabs}>
        <Pressable
          accessibilityRole="button"
          onPress={() => setOffice(undefined)}
          style={[styles.tab, !office && styles.activeTab]}
        >
          <Text style={[styles.tabText, !office && styles.activeTabText]}>Todos</Text>
        </Pressable>
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

      <View style={styles.results}>
        {results.length === 0 ? (
          <EmptyState
            body="Digite o numero que aparece no santinho. A base atual e fixture da eleicao anterior."
            title="Sem candidato ainda"
          />
        ) : (
          results.map((candidate) => (
            <Pressable
              accessibilityRole="button"
              key={candidate.id}
              onPress={() =>
                confirmCandidate(candidate.id, candidate.number, candidate.office)
              }
            >
              <CandidateCard candidate={candidate} />
            </Pressable>
          ))
        )}
      </View>

      <PrimaryActionButton
        label="Voltar para a caca"
        onPress={() => router.replace('/(tabs)/hunt')}
        variant="paper"
      />
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
  input: {
    backgroundColor: colors.paper,
    borderColor: colors.alert,
    borderRadius: radii.sm,
    borderWidth: 3,
    color: colors.asphalt,
    fontSize: 28,
    fontWeight: '900',
    padding: spacing.lg,
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
  results: {
    gap: spacing.md,
  },
});
