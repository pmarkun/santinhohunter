import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { getStoredUf, saveStoredUf, ufs } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import type { Uf } from '@/types/domain';

export default function SettingsScreen() {
  const [uf, setUf] = useState<Uf>('SP');

  useEffect(() => {
    getStoredUf().then(setUf);
  }, []);

  async function selectUf(nextUf: Uf) {
    setUf(nextUf);
    await saveStoredUf(nextUf);
  }

  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Ajustes</Text>
        <Text style={styles.title}>{uf} na mira</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>UF ativa</Text>
        <View style={styles.ufGrid}>
          {ufs.map((item) => (
            <Pressable
              accessibilityRole="button"
              key={item}
              onPress={() => selectUf(item)}
              style={[styles.ufButton, uf === item && styles.ufButtonActive]}
            >
              <Text style={[styles.ufText, uf === item && styles.ufTextActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Política de uso</Text>
        <Text style={styles.panelBody}>
          Este app registra lixo eleitoral em espaço público. A câmera serve para o
          flagra, a localização serve para o mapa aproximado, e o reconhecimento compara
          santinhos com fotos oficiais de candidatos.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Sem login no MVP</Text>
        <Text style={styles.panelBody}>
          Menos cadastro, mais rua. Capturas ficam locais até sincronizar.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Sobre os dados</Text>
        <Text style={styles.panelBody}>
          A base pública atual é fixture de teste com Pedro da IA e Marina Bragante em São
          Paulo 2024. Depois entra a importação do TSE para a eleição geral de 2026.
        </Text>
      </View>
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
  panel: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: 8,
    borderWidth: 1,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  panelTitle: {
    color: colors.asphalt,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  panelBody: {
    color: colors.steel,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
  ufGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  ufButton: {
    alignItems: 'center',
    backgroundColor: colors.newsprint,
    borderColor: colors.line,
    borderRadius: 6,
    borderWidth: 1,
    minWidth: 46,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  ufButtonActive: {
    backgroundColor: colors.alert,
    borderColor: colors.asphalt,
  },
  ufText: {
    color: colors.asphalt,
    fontSize: 13,
    fontWeight: '900',
  },
  ufTextActive: {
    color: colors.asphalt,
  },
});
