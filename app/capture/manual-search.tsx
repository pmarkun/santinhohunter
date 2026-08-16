import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { CandidateResultRow } from '@/components/CandidateResultRow';
import { FlowTopBar } from '@/components/FlowTopBar';
import { MobileScreen } from '@/components/MobileScreen';
import { officeLabels, rankingOffices } from '@/data/offices';
import { searchCandidatesByNumberFromApi } from '@/services/candidateService';
import { getCaptureDraft, selectCaptureDraftCandidate } from '@/services/captureDraft';
import { getStoredUf } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { Candidate, Office, Uf } from '@/types/domain';

export default function ManualSearchScreen() {
  const draft = getCaptureDraft();
  const [number, setNumber] = useState('');
  const [office, setOffice] = useState<Office | undefined>();
  const [uf, setUf] = useState<Uf>(draft?.location.uf ?? 'SP');
  const [results, setResults] = useState<Candidate[]>([]);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    if (!draft) {
      getStoredUf().then(setUf);
    }
  }, [draft]);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(async () => {
      const query = number.replace(/\D/g, '');
      if (!query) {
        setResults([]);
        setSearching(false);
        return;
      }

      setSearching(true);
      const candidates = await searchCandidatesByNumberFromApi({
        uf,
        number: query,
        ...(office ? { office } : {}),
      });
      if (active) {
        setResults(candidates);
        setSearching(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [number, office, uf]);

  function chooseCandidate(candidate: Candidate) {
    if (!selectCaptureDraftCandidate(candidate, 'manual_selection')) {
      router.replace('/capture/camera');
      return;
    }
    router.back();
  }

  return (
    <MobileScreen top={<FlowTopBar onBack={() => router.back()} title="Buscar por número" />}>
      <View style={styles.searchBlock}>
        <Text style={styles.title}>Qual número está no santinho?</Text>
        <TextInput
          accessibilityLabel="Número do candidato"
          autoFocus
          inputMode="numeric"
          keyboardType="number-pad"
          onChangeText={setNumber}
          placeholder="13, 5050, 13131..."
          placeholderTextColor={colors.muted}
          style={styles.input}
          value={number}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.officeContent}
        horizontal
        keyboardShouldPersistTaps="handled"
        showsHorizontalScrollIndicator={false}
        style={styles.officeScroll}
      >
        <OfficeButton active={!office} label="Todos" onPress={() => setOffice(undefined)} />
        {rankingOffices.map((item) => (
          <OfficeButton
            active={office === item}
            key={item}
            label={officeLabels[item]}
            onPress={() => setOffice(item)}
          />
        ))}
      </ScrollView>

      <FlatList
        contentContainerStyle={results.length === 0 ? styles.emptyList : styles.resultList}
        data={results}
        keyboardShouldPersistTaps="handled"
        keyExtractor={(candidate) => candidate.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {searching
              ? 'Procurando na base do TSE...'
              : number
                ? 'Nenhum candidato com esse número e cargo.'
                : 'Digite o número para procurar.'}
          </Text>
        }
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" onPress={() => chooseCandidate(item)}>
            <CandidateResultRow candidate={item} />
          </Pressable>
        )}
        style={styles.list}
      />
    </MobileScreen>
  );
}

function OfficeButton(props: { active: boolean; label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={props.onPress}
      style={[styles.officeButton, props.active && styles.activeOfficeButton]}
    >
      <Text style={[styles.officeLabel, props.active && styles.activeOfficeLabel]}>
        {props.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  searchBlock: {
    gap: spacing.sm,
  },
  title: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 26,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    borderBottomColor: colors.asphalt,
    borderBottomWidth: 2,
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 38,
    fontWeight: '900',
    minHeight: 62,
    paddingHorizontal: 0,
    paddingVertical: spacing.sm,
  },
  officeScroll: {
    flexGrow: 0,
    marginHorizontal: -spacing.xl,
  },
  officeContent: {
    gap: spacing.sm,
    paddingHorizontal: spacing.xl,
  },
  officeButton: {
    borderColor: colors.line,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 42,
    paddingHorizontal: spacing.md,
  },
  activeOfficeButton: {
    backgroundColor: colors.alert,
    borderColor: colors.asphalt,
  },
  officeLabel: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 14,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  activeOfficeLabel: {
    color: colors.asphalt,
  },
  list: {
    flex: 1,
    marginHorizontal: -spacing.xl,
  },
  resultList: {
    paddingHorizontal: spacing.xl,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
});
