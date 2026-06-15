import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, spacing, type } from '../../src/theme';

/**
 * Resurface (spaced-repetition) — full engine lands in M5. For now this shows
 * the intended experience so the IA is real and navigable.
 */
export default function ResurfaceScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Resurface</Text>
      <View style={styles.card}>
        <Text style={styles.emoji}>🌱</Text>
        <Text style={styles.headline}>Nothing due today</Text>
        <Text style={styles.body}>
          Captures you sort will come back here on a gentle schedule — sooner for
          things you forgot, later for things you’ve got down. A quick “do you
          remember now?” keeps it sticking.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  title: { ...type.display, color: colors.ink },
  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emoji: { fontSize: 56 },
  headline: { ...type.title, color: colors.ink },
  body: { ...type.body, color: colors.inkSoft, textAlign: 'center', lineHeight: 22 },
});
