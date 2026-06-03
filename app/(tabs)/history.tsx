import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { EmptyState } from '@/components/EmptyState';
import { getStoredCaptures } from '@/services/captureStorage';
import { syncPendingCaptures } from '@/services/syncService';
import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';
import type { SantinhoCapture } from '@/types/domain';

export default function HistoryScreen() {
  const [captures, setCaptures] = useState<SantinhoCapture[]>([]);

  useFocusEffect(
    useCallback(() => {
      let active = true;

      syncPendingCaptures().then(() => getStoredCaptures()).then((items) => {
        if (active) {
          setCaptures(items);
        }
      });

      return () => {
        active = false;
      };
    }, []),
  );

  return (
    <AppScreen>
      <View>
        <Text style={styles.kicker}>Seus flagrantes</Text>
        <Text style={styles.title}>Historico local</Text>
      </View>

      {captures.length === 0 ? (
        <EmptyState
          body="Quando voce capturar um santinho, ele aparece aqui com status de sincronizacao."
          title="Nenhum flagra ainda"
        />
      ) : (
        captures.map((capture) => (
          <View key={capture.id} style={styles.item}>
            <Image source={{ uri: capture.photoUri }} style={styles.image} />
            <View style={styles.itemBody}>
              <Text style={styles.itemTitle}>Santinho registrado</Text>
              <Text style={styles.itemMeta}>{new Date(capture.capturedAt).toLocaleString()}</Text>
              <Text style={styles.sync}>{syncStatusLabel(capture.syncStatus)}</Text>
            </View>
          </View>
        ))
      )}
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
  item: {
    backgroundColor: colors.card,
    borderColor: colors.line,
    borderRadius: radii.sm,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.md,
  },
  image: {
    backgroundColor: colors.newsprint,
    borderRadius: radii.sm,
    height: 84,
    width: 84,
  },
  itemBody: {
    flex: 1,
  },
  itemTitle: {
    color: colors.asphalt,
    fontSize: 17,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  itemMeta: {
    color: colors.steel,
    fontSize: 13,
    fontWeight: '700',
  },
  sync: {
    color: colors.red,
    fontSize: 12,
    fontWeight: '900',
    marginTop: spacing.sm,
    textTransform: 'uppercase',
  },
});

function syncStatusLabel(status: SantinhoCapture['syncStatus']): string {
  const labels: Record<SantinhoCapture['syncStatus'], string> = {
    local_only: 'local',
    pending_sync: 'pendente',
    syncing: 'sincronizando',
    synced: 'sincronizado',
    sync_failed: 'falhou',
  };

  return labels[status];
}
