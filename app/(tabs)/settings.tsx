import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';

export default function SettingsScreen() {
  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Ajustes</Text>
        <Text style={styles.title}>SP na mira</Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Politica de uso</Text>
        <Text style={styles.panelBody}>
          Este app registra lixo eleitoral em espaco publico. A camera serve para o
          flagra, a localizacao serve para o mapa aproximado, e o reconhecimento compara
          santinhos com fotos oficiais de candidatos.
        </Text>
      </View>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Sem login no MVP</Text>
        <Text style={styles.panelBody}>
          Menos cadastro, mais rua. Capturas ficam locais ate sincronizar.
        </Text>
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
  panel: {
    backgroundColor: colors.steel,
    borderColor: colors.alert,
    borderWidth: 2,
    gap: spacing.sm,
    padding: spacing.lg,
  },
  panelTitle: {
    color: colors.alert,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  panelBody: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 22,
  },
});
