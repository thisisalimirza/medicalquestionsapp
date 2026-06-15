import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSortedBuckets, useStore } from '../../src/store/useStore';
import { colors, radius, spacing, type } from '../../src/theme';
import type { Bucket, Capture } from '../../src/types';

const FILTER_ALL = 'all';
const FILTER_UNSORTED = 'unsorted';

export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const captures = useStore((s) => s.captures);
  const buckets = useSortedBuckets();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<string>(FILTER_ALL);

  const bucketById = useMemo(
    () => Object.fromEntries(buckets.map((b) => [b.id, b])) as Record<string, Bucket>,
    [buckets]
  );

  const data = useMemo(() => {
    const q = query.trim().toLowerCase();
    return captures.filter((c) => {
      if (filter === FILTER_UNSORTED && c.bucketId !== null) return false;
      if (filter !== FILTER_ALL && filter !== FILTER_UNSORTED && c.bucketId !== filter) return false;
      if (q && !c.text.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [captures, query, filter]);

  const filters = [
    { id: FILTER_ALL, label: 'All' },
    { id: FILTER_UNSORTED, label: 'Needs sorting' },
    ...buckets.map((b) => ({ id: b.id, label: `${b.emoji} ${b.label}` })),
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + spacing.md }]}>
      <Text style={styles.title}>Library</Text>

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.inkFaint} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search captures…"
          placeholderTextColor={colors.inkFaint}
          style={styles.searchInput}
        />
      </View>

      <FlatList
        horizontal
        data={filters}
        keyExtractor={(f) => f.id}
        showsHorizontalScrollIndicator={false}
        style={styles.filterBar}
        contentContainerStyle={{ gap: spacing.sm, paddingHorizontal: spacing.lg }}
        renderItem={({ item }) => {
          const active = filter === item.id;
          return (
            <Pressable
              onPress={() => setFilter(item.id)}
              style={[styles.filterChip, active && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, active && styles.filterTextActive]}>
                {item.label}
              </Text>
            </Pressable>
          );
        }}
      />

      <FlatList
        data={data}
        keyExtractor={(c) => c.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🗂️</Text>
            <Text style={styles.emptyText}>Nothing here yet.</Text>
          </View>
        }
        renderItem={({ item }) => <CaptureRow capture={item} bucket={bucketById[item.bucketId ?? '']} />}
      />
    </View>
  );
}

function CaptureRow({ capture, bucket }: { capture: Capture; bucket?: Bucket }) {
  const enrich = capture.enrichmentStatus;
  return (
    <Pressable
      style={styles.row}
      onPress={() => router.push({ pathname: '/capture/[id]', params: { id: capture.id } })}
    >
      <View style={[styles.stripe, { backgroundColor: bucket?.color ?? colors.borderStrong }]} />
      <View style={styles.flex}>
        <Text style={styles.rowText} numberOfLines={3}>
          {capture.text}
        </Text>
        <View style={styles.rowMeta}>
          {bucket ? (
            <Text style={[styles.rowBucket, { color: bucket.color }]}>
              {bucket.emoji} {bucket.label}
            </Text>
          ) : (
            <Text style={styles.rowUnsorted}>Needs sorting</Text>
          )}
          <Text style={styles.rowDot}>·</Text>
          <Text style={styles.rowEnrich}>
            {enrich === 'done' ? '✨ Researched' : enrich === 'queued' ? '⏳ Researching…' : 'No research yet'}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  title: { ...type.display, color: colors.ink, paddingHorizontal: spacing.lg },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { ...type.body, flex: 1, color: colors.ink },
  filterBar: { maxHeight: 40, flexGrow: 0 },
  filterChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  filterText: { ...type.caption, color: colors.inkSoft },
  filterTextActive: { color: colors.onPrimary },

  list: { padding: spacing.lg, gap: spacing.md },
  row: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  stripe: { width: 5 },
  rowText: { ...type.body, color: colors.ink, padding: spacing.md, paddingBottom: spacing.xs },
  rowMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  rowBucket: { ...type.caption },
  rowUnsorted: { ...type.caption, color: colors.inkFaint },
  rowDot: { color: colors.inkFaint },
  rowEnrich: { ...type.caption, color: colors.inkSoft },

  empty: { alignItems: 'center', paddingTop: spacing.xxxl, gap: spacing.sm },
  emptyEmoji: { fontSize: 48 },
  emptyText: { ...type.body, color: colors.inkSoft },
});
