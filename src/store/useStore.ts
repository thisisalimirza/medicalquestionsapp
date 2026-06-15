import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { DEFAULT_BUCKETS } from '../data/defaultBuckets';
import { runEnrichment } from '../lib/enrichment';
import { applyReview, createReview, isDue } from '../lib/scheduling';
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
  /** (Re)run AI research for a capture. */
  enrich: (captureId: string) => void;
  /** Record a spaced-repetition review outcome. */
  reviewCapture: (captureId: string, result: 'again' | 'good' | 'easy') => void;

  // Buckets
  addBucket: (input: { label: string; reaction: string; emoji: string; color: string; priority: Priority }) => void;
  updateBucket: (bucketId: string, patch: Partial<Bucket>) => void;
  deleteBucket: (bucketId: string) => void;

  // Courses
  addCourse: (input: { name: string; color: string }) => Course;

  // Demo / onboarding
  seedDemo: () => void;
  clearAll: () => void;
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
        // Fire-and-forget: research starts in the background immediately.
        get().enrich(capture.id);
        return capture;
      },

      enrich: (captureId) => {
        const capture = get().captures.find((c) => c.id === captureId);
        if (!capture) return;
        set((s) => ({
          captures: s.captures.map((c) =>
            c.id === captureId ? { ...c, enrichmentStatus: 'queued' } : c
          ),
        }));
        runEnrichment(capture.text)
          .then((enrichment) =>
            set((s) => ({
              captures: s.captures.map((c) =>
                c.id === captureId
                  ? { ...c, enrichment, enrichmentStatus: 'done', updatedAt: Date.now() }
                  : c
              ),
            }))
          )
          .catch(() =>
            set((s) => ({
              captures: s.captures.map((c) =>
                c.id === captureId ? { ...c, enrichmentStatus: 'failed' } : c
              ),
            }))
          );
      },

      setBucket: (captureId, bucketId) =>
        set((s) => {
          const bucket = s.buckets.find((b) => b.id === bucketId);
          return {
            captures: s.captures.map((c) =>
              c.id === captureId
                ? {
                    ...c,
                    bucketId,
                    // Sorting schedules the first resurface, seeded by priority.
                    review: bucket ? createReview(bucket.priority) : undefined,
                    updatedAt: Date.now(),
                    syncState: 'local',
                  }
                : c
            ),
          };
        }),

      reviewCapture: (captureId, result) =>
        set((s) => ({
          captures: s.captures.map((c) =>
            c.id === captureId && c.review
              ? { ...c, review: applyReview(c.review, result), updatedAt: Date.now() }
              : c
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

      seedDemo: () => {
        const now = Date.now();
        const samples: { text: string; bucketId: string | null }[] = [
          { text: "Wernicke's encephalopathy triad — what are the three?", bucketId: 'forgot' },
          { text: 'Why does aortic stenosis cause a crescendo-decrescendo murmur?', bucketId: 'fuzzy' },
          { text: 'Difference between type I and type II hypersensitivity', bucketId: 'new' },
          { text: 'Mechanism of beta-lactam antibiotics', bucketId: 'got' },
          { text: 'That enzyme in the urea cycle the prof mentioned — ornithine transcarbamylase?', bucketId: null },
        ];
        const captures: Capture[] = samples.map((sample, i) => {
          const bucket = get().buckets.find((b) => b.id === sample.bucketId);
          return {
            id: id(),
            text: sample.text,
            bucketId: sample.bucketId,
            courseId: null,
            tags: [],
            createdAt: now - i * 60000,
            updatedAt: now - i * 60000,
            syncState: 'local',
            enrichmentStatus: 'queued',
            // Make the first two due right now so Resurface is explorable.
            review: bucket ? { ...createReview(bucket.priority, now), dueAt: i < 2 ? now - 1000 : now + createReview(bucket.priority, now).intervalDays * 86400000 } : undefined,
          };
        });
        set((s) => ({ captures: [...captures, ...s.captures] }));
        captures.forEach((c) => get().enrich(c.id));
      },

      clearAll: () => set({ captures: [] }),
    }),
    {
      name: 'mmq-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

// Selectors
export const selectUnsorted = (s: State) => s.captures.filter((c) => c.bucketId === null);
export const selectDue = (s: State) =>
  s.captures
    .filter((c) => isDue(c.review))
    .sort((a, b) => (a.review!.dueAt - b.review!.dueAt));
export const selectCaptureById = (id: string) => (s: State) =>
  s.captures.find((c) => c.id === id);
export const selectBucketById = (id: string | null) => (s: State) =>
  s.buckets.find((b) => b.id === id);
export const selectSortedBuckets = (s: State) =>
  [...s.buckets].sort((a, b) => a.order - b.order);
