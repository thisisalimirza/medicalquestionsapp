import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_BUCKETS } from '../data/defaultBuckets';
import type { Bucket, Capture, Course, Priority } from '../types';

/**
 * Single source of truth for the app, persisted locally (offline-first).
 *
 * This is intentionally behind a small action API so the persistence layer can
 * be swapped from AsyncStorage to SQLite later without touching the screens.
 */

function id() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

interface State {
  captures: Capture[];
  buckets: Bucket[];
  courses: Course[];

  // Capture lifecycle
  addCapture: (input: { text: string; bucketId?: string | null; courseId?: string | null; imageUri?: string }) => Capture;
  setBucket: (captureId: string, bucketId: string | null) => void;
  updateCapture: (captureId: string, patch: Partial<Capture>) => void;
  deleteCapture: (captureId: string) => void;

  // Buckets
  addBucket: (input: { label: string; reaction: string; emoji: string; color: string; priority: Priority }) => void;
  updateBucket: (bucketId: string, patch: Partial<Bucket>) => void;
  deleteBucket: (bucketId: string) => void;

  // Courses
  addCourse: (input: { name: string; color: string }) => Course;
}

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      captures: [],
      buckets: DEFAULT_BUCKETS,
      courses: [],

      addCapture: ({ text, bucketId = null, courseId = null, imageUri }) => {
        const now = Date.now();
        const capture: Capture = {
          id: id(),
          text: text.trim(),
          bucketId,
          courseId,
          tags: [],
          imageUri,
          createdAt: now,
          updatedAt: now,
          syncState: 'local',
          // Enrichment is queued the moment we capture; the backend pipeline
          // (M4) will pick it up when connectivity returns.
          enrichmentStatus: 'queued',
        };
        set((s) => ({ captures: [capture, ...s.captures] }));
        return capture;
      },

      setBucket: (captureId, bucketId) =>
        set((s) => ({
          captures: s.captures.map((c) =>
            c.id === captureId ? { ...c, bucketId, updatedAt: Date.now(), syncState: 'local' } : c
          ),
        })),

      updateCapture: (captureId, patch) =>
        set((s) => ({
          captures: s.captures.map((c) =>
            c.id === captureId ? { ...c, ...patch, updatedAt: Date.now() } : c
          ),
        })),

      deleteCapture: (captureId) =>
        set((s) => ({ captures: s.captures.filter((c) => c.id !== captureId) })),

      addBucket: ({ label, reaction, emoji, color, priority }) =>
        set((s) => ({
          buckets: [
            ...s.buckets,
            {
              id: id(),
              label,
              reaction,
              emoji,
              color,
              priority,
              isDefault: false,
              order: s.buckets.length,
            },
          ],
        })),

      updateBucket: (bucketId, patch) =>
        set((s) => ({
          buckets: s.buckets.map((b) => (b.id === bucketId ? { ...b, ...patch } : b)),
        })),

      deleteBucket: (bucketId) => {
        const bucket = get().buckets.find((b) => b.id === bucketId);
        if (!bucket || bucket.isDefault) return; // defaults are protected
        set((s) => ({
          buckets: s.buckets.filter((b) => b.id !== bucketId),
          // Orphaned captures fall back to "unsorted" so nothing is lost.
          captures: s.captures.map((c) =>
            c.bucketId === bucketId ? { ...c, bucketId: null } : c
          ),
        }));
      },

      addCourse: ({ name, color }) => {
        const course: Course = { id: id(), name, color };
        set((s) => ({ courses: [...s.courses, course] }));
        return course;
      },
    }),
    {
      name: 'mmq-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const selectUnsorted = (s: State) => s.captures.filter((c) => c.bucketId === null);
export const selectBucketById = (id: string | null) => (s: State) =>
  s.buckets.find((b) => b.id === id);
export const selectSortedBuckets = (s: State) =>
  [...s.buckets].sort((a, b) => a.order - b.order);
