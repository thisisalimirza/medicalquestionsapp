import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BucketPill } from '../../src/components/BucketPill';
import { haptic } from '../../src/lib/haptics';
import { selectCaptureById, selectSortedBuckets, useStore } from '../../src/store/useStore';
import { colors, radius, shadow, spacing, type } from '../../src/theme';
import type { Enrichment } from '../../src/types';

export default function CaptureDetail() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const capture = useStore(selectCaptureById(id));
  const buckets = useStore(selectSortedBuckets);
  const setBucket = useStore((s) => s.setBucket);
  const enrich = useStore((s) => s.enrich);
  const deleteCapture = useStore((s) => s.deleteCapture);

  if (!capture) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.missing}>This capture was deleted.</Text>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.link}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const bucket = buckets.find((b) => b.id === capture.bucketId);
  const e = capture.enrichment;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.lg, paddingBottom: spacing.xxxl }}
    >
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="chevron-back" size={28} color={colors.ink} />
        </Pressable>
        <Pressable
          hitSlop={12}
          onPress={() => {
            haptic.bump();
            deleteCapture(capture.id);
            router.back();
          }}
        >
          <Ionicons name="trash-outline" size={22} color={colors.danger} />
        </Pressable>
      </View>

      {/* The captured fragment */}
      <View style={styles.fragmentCard}>
        <Text style={styles.fragmentKicker}>You captured</Text>
        <Text style={styles.fragment}>{capture.text}</Text>
      </View>

      {/* Bucket */}
      <View style={{ gap: spacing.sm }}>
        <Text style={styles.sectionLabel}>Reaction</Text>
        <View style={styles.bucketWrap}>
          {buckets.map((b) => (
            <BucketPill
              key={b.id}
              bucket={b}
              onPress={() => {
                haptic.select();
                setBucket(capture.id, b.id);
              }}
            />
          ))}
        </View>
        {!bucket && <Text style={styles.hint}>Not sorted yet — tap a reaction above.</Text>}
      </View>

      {/* Research */}
      <View style={{ gap: spacing.sm }}>
        <View style={styles.researchHeader}>
          <Text style={styles.sectionLabel}>AI research</Text>
          {capture.enrichmentStatus === 'queued' && (
            <Text style={styles.statusPill}>⏳ Researching…</Text>
          )}
          {capture.enrichmentStatus === 'done' && e && <ConfidenceBadge level={e.confidence} />}
        </View>

        {e ? (
          <View style={styles.researchCard}>
            <Text style={styles.researchTitle}>{e.title}</Text>
            <Block label="Summary" body={e.summary} />
            <Block label="Why it matters" body={e.clinicalRelevance} />

            <Text style={styles.blockLabel}>What we'll cover</Text>
            {e.keyFacts.map((f) => (
              <View key={f} style={styles.factRow}>
                <View style={styles.factDot} />
                <Text style={styles.factText}>{f}</Text>
              </View>
            ))}

            {e.suggestedTags.length > 0 && (
              <View style={styles.tagWrap}>
                {e.suggestedTags.map((t) => (
                  <View key={t} style={styles.tag}>
                    <Text style={styles.tagText}>#{t}</Text>
                  </View>
                ))}
              </View>
            )}

            {e.source === 'placeholder' && (
              <Text style={styles.placeholderNote}>
                Preview — full Claude-powered research lands once the backend is connected.
              </Text>
            )}
          </View>
        ) : (
          <View style={styles.researchCard}>
            <Text style={styles.hint}>No research yet.</Text>
          </View>
        )}

        <Pressable
          style={styles.rerun}
          onPress={() => {
            haptic.tap();
            enrich(capture.id);
          }}
        >
          <Ionicons name="refresh" size={18} color={colors.primary} />
          <Text style={styles.rerunText}>Re-run research</Text>
        </Pressable>
      </View>

      {capture.review && (
        <Text style={styles.reviewNote}>
          Next resurface {fmtDue(capture.review.dueAt)}.
        </Text>
      )}

      <Text style={styles.disclaimer}>
        Study aid, not medical advice. Always verify against primary sources.
      </Text>
    </ScrollView>
  );
}

function Block({ label, body }: { label: string; body: string }) {
  return (
    <View style={{ gap: 2 }}>
      <Text style={styles.blockLabel}>{label}</Text>
      <Text style={styles.blockBody}>{body}</Text>
    </View>
  );
}

function ConfidenceBadge({ level }: { level: Enrichment['confidence'] }) {
  const color = level === 'high' ? colors.success : level === 'medium' ? colors.copper : colors.inkFaint;
  return (
    <View style={[styles.confBadge, { borderColor: color }]}>
      <Text style={[styles.confText, { color }]}>{level} confidence</Text>
    </View>
  );
}

function fmtDue(ts: number): string {
  const days = Math.round((ts - Date.now()) / (24 * 60 * 60 * 1000));
  if (days <= 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  center: { alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  missing: { ...type.body, color: colors.inkSoft },
  link: { ...type.label, color: colors.primary },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },

  fragmentCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.xs,
    ...shadow.card,
  },
  fragmentKicker: { ...type.caption, color: colors.inkFaint, textTransform: 'uppercase' },
  fragment: { ...type.title, color: colors.ink },

  sectionLabel: { ...type.label, color: colors.inkSoft },
  bucketWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  hint: { ...type.caption, color: colors.inkFaint },

  researchHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusPill: { ...type.caption, color: colors.copper },
  researchCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  researchTitle: { ...type.heading, color: colors.ink },
  blockLabel: { ...type.caption, color: colors.inkFaint, textTransform: 'uppercase' },
  blockBody: { ...type.body, color: colors.ink, lineHeight: 22 },

  factRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  factDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  factText: { ...type.body, color: colors.inkSoft },

  tagWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  tag: { backgroundColor: colors.surfaceMuted, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  tagText: { ...type.caption, color: colors.primary },

  placeholderNote: { ...type.caption, color: colors.inkFaint, fontStyle: 'italic' },

  confBadge: { borderWidth: 1, borderRadius: radius.pill, paddingHorizontal: spacing.sm, paddingVertical: 2 },
  confText: { ...type.caption, textTransform: 'capitalize' },

  rerun: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, alignSelf: 'flex-start', paddingVertical: spacing.sm },
  rerunText: { ...type.label, color: colors.primary },

  reviewNote: { ...type.caption, color: colors.inkSoft },
  disclaimer: { ...type.caption, color: colors.inkFaint, textAlign: 'center' },
});
