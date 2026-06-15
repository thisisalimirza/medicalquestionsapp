import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, type } from '../theme';
import type { Bucket } from '../types';

interface Props {
  bucket: Bucket;
  onPress: () => void;
  /** Compact = single-line chip; full = stacked with reaction subtitle. */
  variant?: 'compact' | 'full';
}

export function BucketPill({ bucket, onPress, variant = 'compact' }: Props) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        variant === 'full' && styles.full,
        { borderColor: bucket.color, backgroundColor: pressed ? bucket.color : colors.surface },
      ]}
    >
      {({ pressed }) => (
        <>
          <Text style={styles.emoji}>{bucket.emoji}</Text>
          <View style={{ flexShrink: 1 }}>
            <Text
              style={[styles.label, { color: pressed ? colors.onPrimary : bucket.color }]}
              numberOfLines={1}
            >
              {bucket.label}
            </Text>
            {variant === 'full' && (
              <Text
                style={[styles.reaction, { color: pressed ? colors.onPrimary : colors.inkSoft }]}
                numberOfLines={1}
              >
                {bucket.reaction}
              </Text>
            )}
          </View>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.pill,
    borderWidth: 2,
  },
  full: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  emoji: { fontSize: 20 },
  label: { ...type.label },
  reaction: { ...type.caption, marginTop: 2 },
});
