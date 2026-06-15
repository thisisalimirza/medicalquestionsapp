/** Resurface priority drives the spaced-repetition initial interval. */
export type Priority = 'highest' | 'high' | 'medium' | 'low';

export interface Bucket {
  id: string;
  label: string;
  /** Short gut-reaction subtitle shown on the sort cards. */
  reaction: string;
  emoji: string;
  /** Hex color, drawn from the brand palette. */
  color: string;
  priority: Priority;
  /** Default buckets can be edited but not deleted. */
  isDefault: boolean;
  /** Manual ordering for the sort grid. */
  order: number;
}

export type SyncState = 'local' | 'syncing' | 'synced';
export type EnrichmentStatus = 'idle' | 'queued' | 'done' | 'failed';

/**
 * Structured AI research attached to a capture. Shape is final — the only thing
 * that changes when the real backend lands is who fills it in (Claude vs. the
 * local placeholder generator).
 */
export interface Enrichment {
  title: string;
  summary: string;
  clinicalRelevance: string;
  keyFacts: string[];
  suggestedTags: string[];
  confidence: 'high' | 'medium' | 'low';
  /** 'placeholder' until the Claude backend replaces it with real research. */
  source: 'placeholder' | 'claude';
  createdAt: number;
}

/** Spaced-repetition scheduling state for a sorted capture. */
export interface Review {
  dueAt: number;
  intervalDays: number;
  ease: number;
  lastResult?: 'again' | 'good' | 'easy';
  reps: number;
}

export interface Capture {
  id: string;
  text: string;
  /** Bucket id, or null if not yet sorted. */
  bucketId: string | null;
  courseId: string | null;
  tags: string[];
  imageUri?: string;
  audioUri?: string;
  createdAt: number;
  updatedAt: number;
  syncState: SyncState;
  enrichmentStatus: EnrichmentStatus;
  enrichment?: Enrichment;
  review?: Review;
}

export interface Course {
  id: string;
  name: string;
  color: string;
}
