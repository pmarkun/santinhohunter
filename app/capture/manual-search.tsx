import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { CandidateCard } from '@/components/CandidateCard';
import { EmptyState } from '@/components/EmptyState';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { officeLabels, rankingOffices } from '@/data/offices';
import { searchCandidatesByNumberFromApi } from '@/services/candidateService';
import { confirmLatestCaptureCandidate } from '@/services/captureStorage';
import { syncCapture } from '@/services/syncService';
import { getStoredUf } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import type { Candidate, Office, Uf } from '@/types/domain';

export default function ManualSearchScreen() {
  const [number, setNumber] = useState('');
  const [office, setOffice] = useState<Office | undefined>(undefined);
  const [uf, setUf] = useState<Uf>('SP');
  const [results, setResults] = useState<Candidate[]>([]);

  useEffect(() => {
    getStoredUf().then(setUf);
  }, []);

  useEffect(() => {
    let active = true;

    searchCandidatesByNumberFromApi({
      uf,
      number,
      ...(office ? { office } : {}),
    }).then((candidates) => {
      if (active) {
        setResults(candidates);
      }
    });

    return () => {
      active = false;
    };
  }, [number, office, uf]);

  async function confirmCandidate(
    candidateId: string,
    candidateNumber: string,
    candidateOffice: Office,
  ) {
    const confirmed = await confirmLatestCaptureCandidate({
      candidateId,
      candidateNumber,
      office: candidateOffice,
    });
    if (confirmed) {
      await syncCapture(confirmed);
    }
    router.replace('/(tabs)/history');
  }

  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Não bateu?</Text>
        <Text style={styles.title}>Busca pelo número</Text>
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
          <EmptyState body="Digite o número que aparece no santinho." title="Sem candidato ainda" />
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
        label="Voltar para a caça"
        onPress={() => router.replace('/(tabs)/hunt')}
        variant="paper"
      />
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  kicker: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.asphalt,
    fontSize: 32,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: radii.md,
    borderWidth: 1,
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
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  activeTab: {
    backgroundColor: colors.alert,
    borderColor: colors.alert,
  },
  tabText: {
    color: colors.asphalt,
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
