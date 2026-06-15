import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BucketPill } from '../src/components/BucketPill';
import { BUCKET_COLOR_CHOICES, BUCKET_EMOJI_CHOICES } from '../src/data/defaultBuckets';
import { haptic } from '../src/lib/haptics';
import { useStore } from '../src/store/useStore';
import { colors, radius, spacing, type } from '../src/theme';
import type { Priority } from '../src/types';

const PRIORITIES: { id: Priority; label: string; hint: string }[] = [
  { id: 'highest', label: 'Highest', hint: 'Resurface very soon' },
  { id: 'high', label: 'High', hint: 'Resurface soon' },
  { id: 'medium', label: 'Medium', hint: 'Resurface later' },
  { id: 'low', label: 'Low', hint: 'Rarely / archive' },
];

export default function BucketEditor() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const existing = useStore((s) => s.buckets.find((b) => b.id === id));
  const addBucket = useStore((s) => s.addBucket);
  const updateBucket = useStore((s) => s.updateBucket);
  const deleteBucket = useStore((s) => s.deleteBucket);

  const [label, setLabel] = useState(existing?.label ?? '');
  const [reaction, setReaction] = useState(existing?.reaction ?? '');
  const [emoji, setEmoji] = useState(existing?.emoji ?? BUCKET_EMOJI_CHOICES[0]);
  const [color, setColor] = useState(existing?.color ?? BUCKET_COLOR_CHOICES[0]);
  const [priority, setPriority] = useState<Priority>(existing?.priority ?? 'high');

  const canSave = label.trim().length > 0;

  function onSave() {
    if (!canSave) return;
    haptic.success();
    if (existing) {
      updateBucket(existing.id, { label: label.trim(), reaction: reaction.trim(), emoji, color, priority });
    } else {
      addBucket({ label: label.trim(), reaction: reaction.trim() || 'Custom reaction', emoji, color, priority });
    }
    router.back();
  }

  function onDelete() {
    if (!existing) return;
    haptic.bump();
    deleteBucket(existing.id);
    router.back();
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={{ padding: spacing.lg, paddingTop: insets.top + spacing.md, gap: spacing.lg, paddingBottom: spacing.xxxl }}
    >
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Ionicons name="close" size={28} color={colors.ink} />
        </Pressable>
        <Text style={styles.title}>{existing ? 'Edit bucket' : 'New bucket'}</Text>
        <View style={{ width: 28 }} />
      </View>

      {/* Live preview */}
      <View style={styles.previewWrap}>
        <BucketPill
          bucket={{ id: 'preview', label: label || 'Bucket name', reaction: reaction || 'Your reaction', emoji, color, priority, isDefault: false, order: 0 }}
          onPress={() => {}}
          variant="full"
        />
      </View>

      <Field label="Name">
        <TextInput
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Ask a resident"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />
      </Field>

      <Field label="Gut reaction (subtitle)">
        <TextInput
          value={reaction}
          onChangeText={setReaction}
          placeholder="e.g. Need a human to explain this"
          placeholderTextColor={colors.inkFaint}
          style={styles.input}
        />
      </Field>

      <Field label="Emoji">
        <View style={styles.choiceWrap}>
          {BUCKET_EMOJI_CHOICES.map((e) => (
            <Pressable
              key={e}
              onPress={() => { haptic.select(); setEmoji(e); }}
              style={[styles.emojiChoice, emoji === e && styles.emojiChoiceActive]}
            >
              <Text style={styles.emojiChoiceText}>{e}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Color">
        <View style={styles.choiceWrap}>
          {BUCKET_COLOR_CHOICES.map((c) => (
            <Pressable key={c} onPress={() => { haptic.select(); setColor(c); }}>
              <View style={[styles.colorChoice, { backgroundColor: c }, color === c && styles.colorChoiceActive]} />
            </Pressable>
          ))}
        </View>
      </Field>

      <Field label="Resurface priority">
        <View style={{ gap: spacing.sm }}>
          {PRIORITIES.map((p) => (
            <Pressable
              key={p.id}
              onPress={() => { haptic.select(); setPriority(p.id); }}
              style={[styles.priorityRow, priority === p.id && styles.priorityRowActive]}
            >
              <Ionicons
                name={priority === p.id ? 'radio-button-on' : 'radio-button-off'}
                size={20}
                color={priority === p.id ? colors.primary : colors.inkFaint}
              />
              <Text style={styles.priorityLabel}>{p.label}</Text>
              <Text style={styles.priorityHint}>{p.hint}</Text>
            </Pressable>
          ))}
        </View>
      </Field>

      <Pressable onPress={onSave} disabled={!canSave} style={[styles.saveBtn, !canSave && styles.saveBtnOff]}>
        <Text style={styles.saveText}>{existing ? 'Save changes' : 'Create bucket'}</Text>
      </Pressable>

      {existing && !existing.isDefault && (
        <Pressable onPress={onDelete} style={styles.deleteBtn}>
          <Text style={styles.deleteText}>Delete bucket</Text>
        </Pressable>
      )}
      {existing?.isDefault && (
        <Text style={styles.defaultNote}>This is a default bucket — it can be edited but not deleted.</Text>
      )}
    </ScrollView>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { ...type.heading, color: colors.ink },

  previewWrap: { alignItems: 'flex-start' },

  fieldLabel: { ...type.label, color: colors.inkSoft },
  input: {
    ...type.body,
    color: colors.ink,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
  },

  choiceWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  emojiChoice: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  emojiChoiceActive: { borderColor: colors.primary },
  emojiChoiceText: { fontSize: 24 },
  colorChoice: { width: 46, height: 46, borderRadius: radius.md, borderWidth: 3, borderColor: 'transparent' },
  colorChoiceActive: { borderColor: colors.ink },

  priorityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  priorityRowActive: { borderColor: colors.primary },
  priorityLabel: { ...type.label, color: colors.ink },
  priorityHint: { ...type.caption, color: colors.inkFaint, marginLeft: 'auto' },

  saveBtn: {
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnOff: { backgroundColor: colors.borderStrong },
  saveText: { ...type.heading, color: colors.onPrimary },
  deleteBtn: { alignItems: 'center', padding: spacing.md },
  deleteText: { ...type.label, color: colors.danger },
  defaultNote: { ...type.caption, color: colors.inkFaint, textAlign: 'center' },
});
