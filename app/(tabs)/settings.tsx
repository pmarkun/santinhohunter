import { MaterialCommunityIcons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompactTopBar } from '@/components/CompactTopBar';
import { UfPickerModal } from '@/components/UfPickerModal';
import { clearStoredCaptures } from '@/services/captureStorage';
import { getStoredUf, saveStoredUf } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { Uf } from '@/types/domain';

export default function SettingsScreen() {
  const [uf, setUf] = useState<Uf>('SP');
  const [ufPickerVisible, setUfPickerVisible] = useState(false);

  useEffect(() => {
    getStoredUf().then(setUf);
  }, []);

  async function selectUf(nextUf: Uf) {
    setUf(nextUf);
    setUfPickerVisible(false);
    await saveStoredUf(nextUf);
  }

  function confirmClearHistory() {
    Alert.alert(
      'Apagar histórico local?',
      'Isso remove as fotos e os registros guardados neste aparelho. O ranking público não é alterado.',
      [
        { style: 'cancel', text: 'Cancelar' },
        { onPress: clearStoredCaptures, style: 'destructive', text: 'Apagar' },
      ],
    );
  }

  return (
    <>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <CompactTopBar title="Ajustes" />
        <ScrollView contentContainerStyle={styles.content}>
          <Section title="Estado na mira">
            <Pressable accessibilityRole="button" onPress={() => setUfPickerVisible(true)} style={styles.ufRow}>
              <Text style={styles.uf}>{uf}</Text>
              <Text style={styles.changeLabel}>Trocar UF</Text>
              <MaterialCommunityIcons color={colors.asphalt} name="chevron-right" size={24} />
            </Pressable>
          </Section>

          <Section title="Permissões">
            <Text style={styles.body}>
              Câmera e localização são pedidas somente quando você abre um novo flagra.
            </Text>
          </Section>

          <Section title="Sobre os dados">
            <Text style={styles.body}>
              A busca e o reconhecimento usam candidaturas oficiais de 2026 importadas do TSE. A localização pública é aproximada.
            </Text>
          </Section>

          <Section title="Projeto e políticas">
            <LinkRow label="Sobre o projeto" route={'/sobre' as Href} />
            <LinkRow label="Política de privacidade" route={'/politica-de-privacidade' as Href} />
            <LinkRow label="Termos de uso" route={'/termos-de-uso' as Href} />
            <LinkRow label="Exclusão de dados" route={'/exclusao-de-dados' as Href} />
          </Section>

          <Pressable accessibilityRole="button" onPress={confirmClearHistory} style={styles.dangerButton}>
            <MaterialCommunityIcons color={colors.red} name="delete-outline" size={21} />
            <Text style={styles.dangerLabel}>Apagar histórico local</Text>
          </Pressable>
        </ScrollView>
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

function Section({ children, title }: { children: React.ReactNode; title: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function LinkRow({ label, route }: { label: string; route: Href }) {
  return (
    <Pressable accessibilityRole="button" onPress={() => router.push(route)} style={styles.linkRow}>
      <Text style={styles.linkLabel}>{label}</Text>
      <MaterialCommunityIcons color={colors.asphalt} name="chevron-right" size={22} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  content: { padding: spacing.xl },
  section: { borderBottomColor: colors.asphalt, borderBottomWidth: 1, paddingBottom: spacing.xl, paddingTop: spacing.lg },
  sectionTitle: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 21, fontWeight: '900', marginBottom: spacing.md, textTransform: 'uppercase' },
  body: { color: colors.steel, fontSize: 15, fontWeight: '600', lineHeight: 22 },
  ufRow: { alignItems: 'center', flexDirection: 'row', minHeight: 58 },
  uf: { color: colors.asphalt, flex: 1, fontFamily: fontFamilies.display, fontSize: 40, fontWeight: '900' },
  changeLabel: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 15, fontWeight: '900', textTransform: 'uppercase' },
  linkRow: { alignItems: 'center', borderTopColor: colors.line, borderTopWidth: 1, flexDirection: 'row', minHeight: 52 },
  linkLabel: { color: colors.asphalt, flex: 1, fontFamily: fontFamilies.display, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
  dangerButton: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, justifyContent: 'center', minHeight: 58, marginTop: spacing.xl },
  dangerLabel: { color: colors.red, fontFamily: fontFamilies.display, fontSize: 16, fontWeight: '900', textTransform: 'uppercase' },
});
