import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/colors';
import { radii, spacing } from '@/theme/layout';

type EmptyStateProps = {
  title: string;
  body: string;
};

export function EmptyState({ title, body }: EmptyStateProps) {
  return (
    <View style={styles.box}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.body}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    borderColor: colors.alert,
    borderRadius: radii.sm,
    borderStyle: 'dashed',
    borderWidth: 3,
    padding: spacing.lg,
  },
  title: {
    color: colors.alert,
    fontSize: 20,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  body: {
    color: colors.paper,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
});
