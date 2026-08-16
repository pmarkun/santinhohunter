import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { BottomActionBar } from '@/components/BottomActionBar';
import { MobileScreen } from '@/components/MobileScreen';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';

export default function CaptureSuccessScreen() {
  const { syncStatus } = useLocalSearchParams<{ syncStatus?: string }>();
  const synced = syncStatus === 'synced';

  return (
    <MobileScreen
      bottom={
        <BottomActionBar
          label="Caçar outro"
          onPress={() => router.replace('/capture/camera')}
          secondary={[
            { label: 'Ver ranking', onPress: () => router.replace('/(tabs)/ranking') },
            { label: 'Ver histórico', onPress: () => router.replace('/(tabs)/history') },
          ]}
        />
      }
    >
      <View style={styles.content}>
        <View style={[styles.icon, synced ? styles.syncedIcon : styles.localIcon]}>
          <MaterialCommunityIcons
            color={colors.asphalt}
            name={synced ? 'check-bold' : 'cellphone-check'}
            size={54}
          />
        </View>
        <Text style={styles.title}>{synced ? 'Flagra enviado.' : 'Salvo no aparelho.'}</Text>
        <Text style={styles.body}>
          {synced
            ? 'Mais um santinho entrou para o ranking da sujeira.'
            : 'A evidência está segura. O app tenta enviar quando a internet voltar.'}
        </Text>
      </View>
    </MobileScreen>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    gap: spacing.lg,
    justifyContent: 'center',
  },
  icon: {
    alignItems: 'center',
    height: 104,
    justifyContent: 'center',
    width: 104,
  },
  syncedIcon: {
    backgroundColor: colors.green,
  },
  localIcon: {
    backgroundColor: colors.alert,
  },
  title: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 49,
    textTransform: 'uppercase',
  },
  body: {
    color: colors.steel,
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 25,
    maxWidth: 420,
  },
});
