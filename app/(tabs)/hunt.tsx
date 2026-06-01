import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { PrimaryActionButton } from '@/components/PrimaryActionButton';
import { TrashCounter } from '@/components/TrashCounter';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { type } from '@/theme/typography';

export default function HuntScreen() {
  return (
    <AppScreen>
      <View style={styles.hero}>
        <Text style={styles.kicker}>Eleicao Geral 2026 / SP</Text>
        <Text style={styles.title}>Cace santinho jogado na rua.</Text>
        <Text style={styles.body}>
          Foto, hora, local e candidato. Mais um flagra para o ranking da sujeira.
        </Text>
      </View>

      <PrimaryActionButton
        label="Cacar santinho"
        onPress={() => router.push('/capture/camera')}
      />

      <TrashCounter count={3} label="lixos eleitorais flagrados em SP" />

      <View style={styles.notice}>
        <Text style={styles.noticeTitle}>Sem login. Sem enrolacao.</Text>
        <Text style={styles.noticeBody}>
          A politica de uso fica aberta para leitura. O app registra lixo eleitoral, nao
          persegue pessoa.
        </Text>
      </View>
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  hero: {
    gap: spacing.sm,
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
    lineHeight: 38,
    textTransform: 'uppercase',
  },
  body: {
    color: colors.muted,
    fontSize: type.body,
    fontWeight: '700',
    lineHeight: 23,
  },
  notice: {
    backgroundColor: colors.steel,
    borderColor: colors.alert,
    borderWidth: 2,
    padding: spacing.lg,
  },
  noticeTitle: {
    color: colors.alert,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  noticeBody: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
