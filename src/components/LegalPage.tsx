import { StyleSheet, Text, View } from 'react-native';

import { AppScreen } from '@/components/AppScreen';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/layout';

type LegalPageProps = {
  kicker: string;
  title: string;
  updatedAt?: string;
  sections: {
    title: string;
    body: string;
  }[];
};

export function LegalPage({ kicker, title, updatedAt, sections }: LegalPageProps) {
  return (
    <AppScreen>
      <View style={styles.header}>
        <Text style={styles.kicker}>{kicker}</Text>
        <Text style={styles.title}>{title}</Text>
        {updatedAt ? <Text style={styles.updated}>Atualizado em {updatedAt}</Text> : null}
      </View>

      {sections.map((section) => (
        <View key={section.title} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          <Text style={styles.body}>{section.body}</Text>
        </View>
      ))}
    </AppScreen>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.sm,
  },
  kicker: {
    color: colors.red,
    fontSize: 13,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  title: {
    color: colors.asphalt,
    fontSize: 34,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  updated: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '800',
  },
  section: {
    borderTopColor: colors.line,
    borderTopWidth: 1,
    gap: spacing.sm,
    paddingTop: spacing.lg,
  },
  sectionTitle: {
    color: colors.asphalt,
    fontSize: 18,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  body: {
    color: colors.steel,
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 24,
  },
});
