import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { detectCurrentUf } from '@/services/locationService';
import { ufs } from '@/services/ufService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { Uf } from '@/types/domain';

type UfPickerModalProps = {
  activeUf: Uf;
  onClose: () => void;
  onSelect: (uf: Uf) => void;
  visible: boolean;
};

export function UfPickerModal({ activeUf, onClose, onSelect, visible }: UfPickerModalProps) {
  const [detectingUf, setDetectingUf] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  async function selectCurrentUf() {
    setDetectingUf(true);
    setLocationError(null);
    try {
      onSelect(await detectCurrentUf());
    } catch (error) {
      setLocationError(
        error instanceof Error
          ? error.message
          : 'Não consegui identificar seu estado pela localização.',
      );
    } finally {
      setDetectingUf(false);
    }
  }

  return (
    <Modal animationType="slide" onRequestClose={onClose} presentationStyle="pageSheet" visible={visible}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Estado na mira</Text>
          <Pressable accessibilityLabel="Fechar" accessibilityRole="button" onPress={onClose} style={styles.close}>
            <MaterialCommunityIcons color={colors.asphalt} name="close" size={27} />
          </Pressable>
        </View>
        <Text style={styles.body}>
          O ranking, a busca e o reconhecimento sempre usam a UF escolhida.
        </Text>
        <Pressable
          accessibilityLabel="Usar minha localização para escolher a UF"
          accessibilityRole="button"
          disabled={detectingUf}
          onPress={selectCurrentUf}
          style={({ pressed }) => [
            styles.locationButton,
            pressed && styles.pressed,
            detectingUf && styles.disabled,
          ]}
        >
          {detectingUf ? (
            <ActivityIndicator color={colors.asphalt} />
          ) : (
            <MaterialCommunityIcons color={colors.asphalt} name="crosshairs-gps" size={21} />
          )}
          <Text style={styles.locationLabel}>
            {detectingUf ? 'Localizando...' : 'Usar minha localização'}
          </Text>
        </Pressable>
        {locationError ? <Text style={styles.locationError}>{locationError}</Text> : null}
        <ScrollView contentContainerStyle={styles.grid}>
          {ufs.map((uf) => (
            <Pressable
              accessibilityRole="button"
              key={uf}
              onPress={() => onSelect(uf)}
              style={[styles.ufButton, uf === activeUf && styles.activeUfButton]}
            >
              <Text style={styles.ufLabel}>{uf}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <Pressable
          accessibilityRole="button"
          onPress={() => {
            onClose();
            router.push('/(tabs)/settings');
          }}
          style={styles.settingsButton}
        >
          <MaterialCommunityIcons color={colors.asphalt} name="cog-outline" size={20} />
          <Text style={styles.settingsLabel}>Ajustes e políticas</Text>
        </Pressable>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1, padding: spacing.xl },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.asphalt,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
  },
  title: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 30,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  close: { alignItems: 'center', height: 48, justifyContent: 'center', width: 48 },
  body: { color: colors.steel, fontSize: 15, fontWeight: '600', lineHeight: 21, paddingVertical: spacing.lg },
  locationButton: {
    alignItems: 'center',
    backgroundColor: colors.alert,
    borderRadius: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  locationLabel: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 15,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  locationError: {
    color: colors.red,
    fontSize: 14,
    fontWeight: '700',
    paddingTop: spacing.sm,
  },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.6 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, paddingBottom: spacing.xl },
  ufButton: {
    alignItems: 'center',
    borderColor: colors.line,
    borderWidth: 1,
    height: 52,
    justifyContent: 'center',
    width: '22.5%',
  },
  activeUfButton: { backgroundColor: colors.alert, borderColor: colors.asphalt, borderWidth: 2 },
  ufLabel: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 18, fontWeight: '900' },
  settingsButton: {
    alignItems: 'center',
    borderTopColor: colors.asphalt,
    borderTopWidth: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    minHeight: 56,
  },
  settingsLabel: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 17, fontWeight: '900', textTransform: 'uppercase' },
});
