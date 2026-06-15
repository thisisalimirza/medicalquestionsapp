import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BucketPill } from '../../src/components/BucketPill';
import { haptic } from '../../src/lib/haptics';
import { useSortedBuckets, useStore, useUnsortedCount } from '../../src/store/useStore';
import { colors, radius, shadow, spacing, type } from '../../src/theme';
import type { Capture } from '../../src/types';

export default function CaptureScreen() {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [text, setText] = useState('');
  const [justCaptured, setJustCaptured] = useState<Capture | null>(null);

  const addCapture = useStore((s) => s.addCapture);
  const setBucket = useStore((s) => s.setBucket);
  const buckets = useSortedBuckets();
  const unsortedCount = useUnsortedCount();

  const canSave = text.trim().length > 0;

  function onCapture() {
    if (!canSave) return;
    haptic.success();
    const c = addCapture({ text });
    setText('');
    setJustCaptured(c);
    inputRef.current?.focus();
  }

  function onQuickSort(bucketId: string) {
    if (!justCaptured) return;
    haptic.bump();
    setBucket(justCaptured.id, bucketId);
    setJustCaptured(null);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + spacing.lg }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text style={styles.greeting}>Heard something?</Text>
          <Text style={styles.sub}>Drop it here — research it later.</Text>
        </View>

        {/* The capture field */}
        <View style={styles.inputCard}>
          <TextInput
            ref={inputRef}
            value={text}
            onChangeText={setText}
            placeholder="e.g. Wernicke's encephalopathy triad…"
            placeholderTextColor={colors.inkFaint}
            style={styles.input}
            multiline
            autoFocus
            returnKeyType="done"
            blurOnSubmit
            onSubmitEditing={onCapture}
          />
          <View style={styles.inputRow}>
            <Pressable
              style={styles.iconBtn}
              onPress={() => {
                haptic.tap();
                // Voice-to-text lands with the native speech module (M1.x).
                inputRef.current?.focus();
              }}
            >
              <Ionicons name="mic-outline" size={22} color={colors.primary} />
            </Pressable>
            <Pressable style={styles.iconBtn} onPress={() => haptic.tap()}>
              <Ionicons name="camera-outline" size={22} color={colors.primary} />
            </Pressable>
            <View style={styles.flex} />
            <Pressable
              onPress={onCapture}
              disabled={!canSave}
              style={[styles.captureBtn, !canSave && styles.captureBtnOff]}
            >
              <Ionicons name="arrow-up" size={22} color={colors.onAccent} />
              <Text style={styles.captureLabel}>Capture</Text>
            </Pressable>
          </View>
        </View>

        {/* Inline quick-sort for the item we just captured */}
        {justCaptured && (
          <Animated.View
            entering={FadeInDown.springify().damping(16)}
            exiting={FadeOut}
            style={styles.sortCard}
          >
            <Text style={styles.sortPrompt}>Gut reaction?</Text>
            <Text style={styles.sortHint} numberOfLines={2}>
              “{justCaptured.text}”
            </Text>
            <View style={styles.bucketWrap}>
              {buckets.slice(0, 6).map((b) => (
                <BucketPill key={b.id} bucket={b} onPress={() => onQuickSort(b.id)} />
              ))}
            </View>
            <Pressable onPress={() => setJustCaptured(null)} style={styles.skip}>
              <Text style={styles.skipText}>Skip — sort later</Text>
            </Pressable>
          </Animated.View>
        )}

        {/* Backlog nudge → batch sort game */}
        {unsortedCount > 0 && !justCaptured && (
          <Animated.View entering={FadeIn}>
            <Pressable
              style={styles.backlog}
              onPress={() => {
                haptic.tap();
                router.push('/sort');
              }}
            >
              <View style={styles.backlogBadge}>
                <Text style={styles.backlogCount}>{unsortedCount}</Text>
              </View>
              <View style={styles.flex}>
                <Text style={styles.backlogTitle}>Sort your captures</Text>
                <Text style={styles.backlogSub}>Swipe through them — takes a minute</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.inkFaint} />
            </Pressable>
          </Animated.View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  content: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxxl },
  header: { gap: spacing.xs },
  greeting: { ...type.display, color: colors.ink },
  sub: { ...type.body, color: colors.inkSoft },

  inputCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  input: {
    ...type.title,
    fontWeight: '500',
    color: colors.ink,
    minHeight: 92,
    textAlignVertical: 'top',
  },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceMuted,
  },
  captureBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    height: 44,
    borderRadius: radius.pill,
    ...shadow.float,
  },
  captureBtnOff: { backgroundColor: colors.borderStrong, shadowOpacity: 0 },
  captureLabel: { ...type.label, color: colors.onAccent },

  sortCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadow.card,
  },
  sortPrompt: { ...type.heading, color: colors.ink },
  sortHint: { ...type.body, color: colors.inkSoft, fontStyle: 'italic' },
  bucketWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  skip: { paddingVertical: spacing.xs },
  skipText: { ...type.label, color: colors.inkFaint },

  backlog: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  backlogBadge: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backlogCount: { ...type.heading, color: colors.onPrimary },
  backlogTitle: { ...type.label, color: colors.ink },
  backlogSub: { ...type.caption, color: colors.inkSoft },
});
