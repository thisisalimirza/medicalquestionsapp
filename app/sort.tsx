import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Dimensions, Pressable, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BucketPill } from '../src/components/BucketPill';
import { haptic } from '../src/lib/haptics';
import { useSortedBuckets, useStore, useUnsorted } from '../src/store/useStore';
import { colors, radius, shadow, spacing, type } from '../src/theme';
import type { Bucket } from '../src/types';

const { width } = Dimensions.get('window');
const SWIPE_THRESHOLD = width * 0.28;

/** Map the first four buckets to swipe directions; the rest get tap pills. */
type Dir = 'left' | 'right' | 'up' | 'down';
const DIRS: Dir[] = ['left', 'up', 'right', 'down'];

export default function SortScreen() {
  const insets = useSafeAreaInsets();
  const unsorted = useUnsorted();
  const buckets = useSortedBuckets();
  const setBucket = useStore((s) => s.setBucket);

  // Snapshot the queue once so it doesn't reshuffle as we sort.
  const [queue] = useState(() => unsorted.map((c) => c.id));
  const [index, setIndex] = useState(0);

  const captureMap = useMemo(
    () => Object.fromEntries(unsorted.map((c) => [c.id, c])),
    [unsorted]
  );

  const dirBuckets: Partial<Record<Dir, Bucket>> = {};
  DIRS.forEach((d, i) => {
    if (buckets[i]) dirBuckets[d] = buckets[i];
  });
  const extraBuckets = buckets.slice(4);

  const tx = useSharedValue(0);
  const ty = useSharedValue(0);

  const current = queue[index];
  const next = queue[index + 1];
  const done = index >= queue.length;

  function commit(bucketId: string) {
    if (!current) return;
    setBucket(current, bucketId);
    haptic.success();
    tx.value = 0;
    ty.value = 0;
    setIndex((i) => i + 1);
  }

  function flick(dir: Dir) {
    const b = dirBuckets[dir];
    if (!b) return;
    const offX = dir === 'left' ? -width : dir === 'right' ? width : 0;
    const offY = dir === 'up' ? -width : dir === 'down' ? width : 0;
    tx.value = withTiming(offX, { duration: 180 });
    ty.value = withTiming(offY, { duration: 180 }, () => runOnJS(commit)(b.id));
  }

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      tx.value = e.translationX;
      ty.value = e.translationY;
    })
    .onEnd((e) => {
      const absX = Math.abs(e.translationX);
      const absY = Math.abs(e.translationY);
      if (Math.max(absX, absY) < SWIPE_THRESHOLD) {
        tx.value = withSpring(0);
        ty.value = withSpring(0);
        return;
      }
      let dir: Dir;
      if (absX > absY) dir = e.translationX > 0 ? 'right' : 'left';
      else dir = e.translationY > 0 ? 'down' : 'up';
      if (!dirBuckets[dir]) {
        tx.value = withSpring(0);
        ty.value = withSpring(0);
        return;
      }
      runOnJS(flick)(dir);
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: tx.value },
      { translateY: ty.value },
      { rotate: `${interpolate(tx.value, [-width, width], [-12, 12])}deg` },
    ],
  }));

  const nextCardStyle = useAnimatedStyle(() => {
    const progress = Math.min(Math.max(Math.abs(tx.value), Math.abs(ty.value)) / SWIPE_THRESHOLD, 1);
    return {
      transform: [{ scale: interpolate(progress, [0, 1], [0.92, 1]) }],
      opacity: interpolate(progress, [0, 1], [0.6, 1]),
    };
  });

  // Directional bucket-name hints that brighten as you drag toward them.
  // These four Hooks must be called unconditionally (Rules of Hooks), so they
  // live at the top level and are looked up by direction below.
  const leftHint = useAnimatedStyle(() => ({
    opacity: interpolate(Math.max(0, -tx.value), [0, SWIPE_THRESHOLD], [0.35, 1]),
  }));
  const rightHint = useAnimatedStyle(() => ({
    opacity: interpolate(Math.max(0, tx.value), [0, SWIPE_THRESHOLD], [0.35, 1]),
  }));
  const upHint = useAnimatedStyle(() => ({
    opacity: interpolate(Math.max(0, -ty.value), [0, SWIPE_THRESHOLD], [0.35, 1]),
  }));
  const downHint = useAnimatedStyle(() => ({
    opacity: interpolate(Math.max(0, ty.value), [0, SWIPE_THRESHOLD], [0.35, 1]),
  }));
  const hintStyles: Record<Dir, ReturnType<typeof useAnimatedStyle>> = {
    left: leftHint,
    right: rightHint,
    up: upHint,
    down: downHint,
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.ink} />
        </Pressable>
        <Text style={styles.progress}>
          {done ? 'All done' : `${index + 1} / ${queue.length}`}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      {done ? (
        <View style={styles.doneWrap}>
          <Text style={styles.doneEmoji}>🎉</Text>
          <Text style={styles.doneTitle}>Inbox zero</Text>
          <Text style={styles.doneSub}>Every capture sorted. Nice work.</Text>
          <Pressable style={styles.doneBtn} onPress={() => router.back()}>
            <Text style={styles.doneBtnText}>Done</Text>
          </Pressable>
        </View>
      ) : (
        <>
          {/* Directional hints */}
          <View style={styles.stage}>
            {DIRS.map((d) =>
              dirBuckets[d] ? (
                <Animated.View key={d} style={[styles.hint, styles[`hint_${d}`], hintStyles[d]]}>
                  <Text style={styles.hintEmoji}>{dirBuckets[d]!.emoji}</Text>
                  <Text style={[styles.hintLabel, { color: dirBuckets[d]!.color }]}>
                    {dirBuckets[d]!.label}
                  </Text>
                </Animated.View>
              ) : null
            )}

            {/* Next card peeking behind */}
            {next && (
              <Animated.View style={[styles.card, styles.cardBehind, nextCardStyle]}>
                <Text style={styles.cardText} numberOfLines={6}>
                  {captureMap[next]?.text}
                </Text>
              </Animated.View>
            )}

            {/* Active card */}
            {current && (
              <GestureDetector gesture={pan}>
                <Animated.View style={[styles.card, cardStyle]}>
                  <Text style={styles.cardKicker}>How did this feel?</Text>
                  <Text style={styles.cardText}>{captureMap[current]?.text}</Text>
                </Animated.View>
              </GestureDetector>
            )}
          </View>

          {/* Tap fallback + overflow buckets */}
          <View style={styles.tapRow}>
            {buckets.map((b) => (
              <BucketPill key={b.id} bucket={b} onPress={() => commit(b.id)} />
            ))}
          </View>
          {extraBuckets.length === 0 && (
            <Text style={styles.swipeHint}>Swipe the card · or tap a reaction</Text>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, paddingHorizontal: spacing.lg, backgroundColor: colors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  progress: { ...type.label, color: colors.inkSoft },

  stage: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  card: {
    position: 'absolute',
    width: width - spacing.lg * 4,
    minHeight: 220,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    padding: spacing.xl,
    justifyContent: 'center',
    gap: spacing.md,
    ...shadow.float,
  },
  cardBehind: { backgroundColor: colors.surfaceMuted },
  cardKicker: { ...type.caption, color: colors.inkFaint, textTransform: 'uppercase' },
  cardText: { ...type.title, color: colors.ink },

  hint: { position: 'absolute', alignItems: 'center', gap: 2 },
  hint_left: { left: 0 },
  hint_right: { right: 0 },
  hint_up: { top: spacing.md },
  hint_down: { bottom: spacing.md },
  hintEmoji: { fontSize: 26 },
  hintLabel: { ...type.label },

  tapRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.lg,
  },
  swipeHint: { ...type.caption, color: colors.inkFaint, textAlign: 'center', paddingBottom: spacing.lg },

  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  doneEmoji: { fontSize: 64 },
  doneTitle: { ...type.display, color: colors.ink },
  doneSub: { ...type.body, color: colors.inkSoft },
  doneBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xxl,
    paddingVertical: spacing.md,
    borderRadius: radius.pill,
  },
  doneBtnText: { ...type.label, color: colors.onPrimary },
});
