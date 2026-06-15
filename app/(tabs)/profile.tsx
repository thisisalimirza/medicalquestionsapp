import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '../../src/lib/haptics';
import { useSortedBuckets, useStore, useUnsortedCount } from '../../src/store/useStore';
import { colors, radius, spacing, type } from '../../src/theme';

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const captures = useStore((s) => s.captures);
  const buckets = useSortedBuckets();
  const unsorted = useUnsortedCount();
  const seedDemo = useStore((s) => s.seedDemo);
  const clearAll = useStore((s) => s.clearAll);

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.lg }}
    >
      <Text style={styles.title}>Profile</Text>

      {/* Stats */}
      <View style={styles.statRow}>
        <Stat value={captures.length} label="Captures" />
        <Stat value={captures.length - unsorted} label="Sorted" />
        <Stat value={unsorted} label="To sort" />
      </View>

      {/* Buckets manager */}
      <Section title="Reaction buckets">
        {buckets.map((b) => (
          <Pressable
            key={b.id}
            style={styles.bucketRow}
            onPress={() => {
              haptic.tap();
              router.push({ pathname: '/bucket-editor', params: { id: b.id } });
            }}
          >
            <Text style={styles.bucketEmoji}>{b.emoji}</Text>
            <View style={styles.flex}>
              <Text style={styles.bucketLabel}>{b.label}</Text>
              <Text style={styles.bucketReaction}>{b.reaction}</Text>
            </View>
            <View style={[styles.priorityDot, { backgroundColor: b.color }]} />
            <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
          </Pressable>
        ))}
        <Pressable
          style={styles.addBucket}
          onPress={() => {
            haptic.tap();
            router.push('/bucket-editor');
          }}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
          <Text style={styles.addBucketText}>Add a custom bucket</Text>
        </Pressable>
      </Section>

      {/* Export */}
      <Section title="Export">
        <Pressable style={styles.linkRow} onPress={() => haptic.tap()}>
          <Ionicons name="layers-outline" size={20} color={colors.copper} />
          <View style={styles.flex}>
            <Text style={styles.linkLabel}>Export to Anki</Text>
            <Text style={styles.linkSub}>AI-built atomic cards · coming after research pipeline</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.inkFaint} />
        </Pressable>
      </Section>

      {/* Try it out */}
      <Section title="Try it out">
        <Pressable
          style={styles.linkRow}
          onPress={() => {
            haptic.success();
            seedDemo();
          }}
        >
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
          <View style={styles.flex}>
            <Text style={styles.linkLabel}>Load sample captures</Text>
            <Text style={styles.linkSub}>Fills the app so you can explore every screen</Text>
          </View>
        </Pressable>
        <Pressable style={[styles.linkRow, styles.linkRowTop]} onPress={() => { haptic.bump(); clearAll(); }}>
          <Ionicons name="trash-outline" size={20} color={colors.danger} />
          <Text style={[styles.linkLabel, { color: colors.danger }]}>Clear all captures</Text>
        </Pressable>
      </Section>

      <Text style={styles.disclaimer}>
        MyMedQuestions is a study aid, not medical advice. AI-generated research is
        a starting point — always verify against your own sources.
      </Text>
    </ScrollView>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.sectionCard}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  title: { ...type.display, color: colors.ink },

  statRow: { flexDirection: 'row', gap: spacing.md },
  stat: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { ...type.display, color: colors.primary },
  statLabel: { ...type.caption, color: colors.inkSoft },

  sectionTitle: { ...type.label, color: colors.inkSoft, paddingHorizontal: spacing.xs },
  sectionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },

  bucketRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bucketEmoji: { fontSize: 24 },
  bucketLabel: { ...type.label, color: colors.ink },
  bucketReaction: { ...type.caption, color: colors.inkSoft },
  priorityDot: { width: 12, height: 12, borderRadius: 6 },
  addBucket: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
  addBucketText: { ...type.label, color: colors.primary },

  linkRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  linkRowTop: { borderTopWidth: 1, borderTopColor: colors.border },
  linkLabel: { ...type.label, color: colors.ink },
  linkSub: { ...type.caption, color: colors.inkSoft },

  disclaimer: { ...type.caption, color: colors.inkFaint, textAlign: 'center', lineHeight: 18 },
});
