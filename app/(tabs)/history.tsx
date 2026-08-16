import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { CompactTopBar } from '@/components/CompactTopBar';
import { getStoredCaptures } from '@/services/captureStorage';
import { syncCapture, syncPendingCaptures } from '@/services/syncService';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';
import { fontFamilies } from '@/theme/typography';
import type { SantinhoCapture } from '@/types/domain';

export default function HistoryScreen() {
  const [captures, setCaptures] = useState<SantinhoCapture[]>([]);

  const loadCaptures = useCallback(async () => {
    await syncPendingCaptures();
    setCaptures(await getStoredCaptures());
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadCaptures();
    }, [loadCaptures]),
  );

  async function retry(capture: SantinhoCapture) {
    await syncCapture(capture);
    setCaptures(await getStoredCaptures());
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <CompactTopBar title="Meus flagrantes" />
      <FlatList
        contentContainerStyle={captures.length === 0 ? styles.emptyList : styles.list}
        data={captures}
        keyExtractor={(capture) => capture.id}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons color={colors.muted} name="camera-off-outline" size={44} />
            <Text style={styles.emptyTitle}>Nenhum flagra ainda</Text>
            <Text style={styles.emptyBody}>As evidências aparecem aqui assim que você fotografa.</Text>
          </View>
        }
        renderItem={({ item }) => <HistoryRow capture={item} onRetry={() => retry(item)} />}
      />
    </SafeAreaView>
  );
}

function HistoryRow({ capture, onRetry }: { capture: SantinhoCapture; onRetry: () => void }) {
  const candidates = capture.identifiedCandidateSnapshots ?? [];
  const title =
    candidates.length === 1
      ? candidates[0]?.ballotName
      : candidates.length > 1
        ? `${candidates.length} envolvidos identificados`
        : 'Santinho registrado';
  const status = syncStatus(capture.syncStatus);

  return (
    <View style={styles.row}>
      <Image source={{ uri: capture.photoUri }} style={styles.photo} />
      <View style={styles.body}>
        <Text numberOfLines={1} style={styles.name}>{title}</Text>
        <Text numberOfLines={1} style={styles.meta}>
          {capture.city ?? capture.uf} · {new Date(capture.capturedAt).toLocaleString()}
        </Text>
        <View style={styles.statusRow}>
          <MaterialCommunityIcons color={status.color} name={status.icon} size={17} />
          <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
        </View>
      </View>
      {capture.syncStatus === 'sync_failed' ? (
        <Pressable accessibilityLabel="Tentar enviar novamente" accessibilityRole="button" onPress={onRetry} style={styles.retry}>
          <MaterialCommunityIcons color={colors.asphalt} name="refresh" size={23} />
        </Pressable>
      ) : null}
    </View>
  );
}

function syncStatus(status: SantinhoCapture['syncStatus']): {
  color: string;
  icon: 'cellphone' | 'clock-outline' | 'cloud-upload-outline' | 'cloud-check-outline' | 'alert-circle-outline';
  label: string;
} {
  const states = {
    local_only: { color: colors.muted, icon: 'cellphone' as const, label: 'No aparelho' },
    pending_sync: { color: colors.muted, icon: 'clock-outline' as const, label: 'Pendente' },
    syncing: { color: colors.ink, icon: 'cloud-upload-outline' as const, label: 'Enviando' },
    synced: { color: colors.green, icon: 'cloud-check-outline' as const, label: 'Sincronizado' },
    sync_failed: { color: colors.red, icon: 'alert-circle-outline' as const, label: 'Falhou · tente novamente' },
  };
  return states[status];
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.paper, flex: 1 },
  list: { paddingHorizontal: spacing.lg },
  row: {
    alignItems: 'center',
    borderBottomColor: colors.line,
    borderBottomWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    minHeight: 108,
    paddingVertical: spacing.md,
  },
  photo: { backgroundColor: '#EFEFEF', height: 82, width: 72 },
  body: { flex: 1 },
  name: {
    color: colors.asphalt,
    fontFamily: fontFamilies.display,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  meta: { color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 2 },
  statusRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  statusText: { fontFamily: fontFamilies.display, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  retry: { alignItems: 'center', borderColor: colors.asphalt, borderWidth: 1, height: 44, justifyContent: 'center', width: 44 },
  emptyList: { flexGrow: 1, padding: spacing.xl },
  emptyState: { flex: 1, gap: spacing.md, justifyContent: 'center' },
  emptyTitle: { color: colors.asphalt, fontFamily: fontFamilies.display, fontSize: 31, fontWeight: '900', textTransform: 'uppercase' },
  emptyBody: { color: colors.muted, fontSize: 15, fontWeight: '600', lineHeight: 21 },
});
