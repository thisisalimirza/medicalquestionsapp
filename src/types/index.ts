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
}

export interface Course {
  id: string;
  name: string;
  color: string;
}
