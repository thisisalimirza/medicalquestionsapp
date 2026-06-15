import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { haptic } from '../../src/lib/haptics';
import { useDue, useSortedBuckets, useStore } from '../../src/store/useStore';
import { colors, radius, shadow, spacing, type } from '../../src/theme';

/**
 * Spaced-repetition review. Shows the fragment first ("do you remember now?"),
 * reveals the research on tap, then a quick self-rating reschedules the item.
 */
export default function ResurfaceScreen() {
  const insets = useSafeAreaInsets();
  const due = useDue();
  const buckets = useSortedBuckets();
  const reviewCapture = useStore((s) => s.reviewCapture);
  const [revealed, setRevealed] = useState(false);

  const current = due[0];

  function rate(result: 'again' | 'good' | 'easy') {
    if (!current) return;
    haptic.success();
    reviewCapture(current.id, result);
    setRevealed(false);
  }

  if (!current) {
    return (
      <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
        <Text style={styles.title}>Resurface</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emoji}>🌱</Text>
          <Text style={styles.headline}>Nothing due right now</Text>
          <Text style={styles.body}>
            Sorted captures come back here on a gentle schedule — sooner for things
            you forgot, later for things you’ve got down.
          </Text>
        </View>
      </View>
    );
  }

  const bucket = buckets.find((b) => b.id === current.bucketId);
  const e = current.enrichment;

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Resurface</Text>
        <Text style={styles.count}>{due.length} due</Text>
      </View>

      <Animated.View key={current.id} entering={FadeIn} style={styles.card}>
        {bucket && (
          <Text style={[styles.bucketTag, { color: bucket.color }]}>
            {bucket.emoji} {bucket.label}
          </Text>
        )}
        <Text style={styles.fragment}>{current.text}</Text>

        {!revealed ? (
          <Pressable
            style={styles.reveal}
            onPress={() => {
              haptic.tap();
              setRevealed(true);
            }}
          >
            <Text style={styles.revealText}>Do you remember? Tap to check</Text>
          </Pressable>
        ) : (
          <Animated.View entering={FadeIn} style={styles.answer}>
            {e ? (
              <>
                <Text style={styles.answerTitle}>{e.title}</Text>
                <Text style={styles.answerBody}>{e.summary}</Text>
                <Pressable
                  onPress={() => router.push({ pathname: '/capture/[id]', params: { id: current.id } })}
                >
                  <Text style={styles.more}>See full research →</Text>
                </Pressable>
              </>
            ) : (
              <Text style={styles.answerBody}>No research attached yet.</Text>
            )}
          </Animated.View>
        )}
      </Animated.View>

      {revealed && (
        <Animated.View entering={FadeIn} style={styles.rateRow}>
          <RateBtn label="Still fuzzy" color={colors.copper} onPress={() => rate('again')} />
          <RateBtn label="Got it now" color={colors.primary} onPress={() => rate('good')} />
          <RateBtn label="Nailed it" color={colors.success} onPress={() => rate('easy')} />
        </Animated.View>
      )}
    </View>
  );
}

function RateBtn({ label, color, onPress }: { label: string; color: string; onPress: () => void }) {
  return (
    <Pressable style={[styles.rateBtn, { borderColor: color }]} onPress={onPress}>
      <Text style={[styles.rateText, { color }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background, paddingHorizontal: spacing.lg },
  headerRow: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  title: { ...type.display, color: colors.ink },
  count: { ...type.label, color: colors.copper },

  card: {
    marginTop: spacing.xl,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    gap: spacing.md,
    minHeight: 260,
    ...shadow.card,
  },
  bucketTag: { ...type.label },
  fragment: { ...type.title, color: colors.ink },

  reveal: {
    marginTop: 'auto',
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  revealText: { ...type.label, color: colors.primary },

  answer: { marginTop: spacing.md, gap: spacing.sm },
  answerTitle: { ...type.heading, color: colors.ink },
  answerBody: { ...type.body, color: colors.inkSoft, lineHeight: 22 },
  more: { ...type.label, color: colors.primary, marginTop: spacing.xs },

  rateRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  rateBtn: {
    flex: 1,
    borderWidth: 2,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  rateText: { ...type.label },

  emptyCard: {
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
