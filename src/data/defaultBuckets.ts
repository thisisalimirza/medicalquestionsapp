import { palette } from '../theme';
import type { Bucket } from '../types';

/**
 * The four default reaction buckets. These ship out of the box; students can
 * rename/recolor them and add their own, but cannot delete these four.
 *
 * "Forgot it" is highest priority: forgetting something previously learned is
 * the strongest signal of a decaying memory worth rescuing.
 */
export const DEFAULT_BUCKETS: Bucket[] = [
  {
    id: 'forgot',
    label: 'Forgot it',
    reaction: "I knew this… and blanked",
    emoji: '😩',
    color: palette.copper,
    priority: 'highest',
    isDefault: true,
    order: 0,
  },
  {
    id: 'new',
    label: 'New to me',
    reaction: "Never knew that at all",
    emoji: '🤯',
    color: palette.balticBlue,
    priority: 'high',
    isDefault: true,
    order: 1,
  },
  {
    id: 'fuzzy',
    label: 'Fuzzy',
    reaction: "Vaguely remember, not well enough",
    emoji: '🤔',
    color: palette.sandyBrown,
    priority: 'medium',
    isDefault: true,
    order: 2,
  },
  {
    id: 'got',
    label: 'Got it',
    reaction: "Solid — just confirming",
    emoji: '✅',
    color: '#3C8C6E',
    priority: 'low',
    isDefault: true,
    order: 3,
  },
];

/** Palette colors offered when creating a custom bucket. */
export const BUCKET_COLOR_CHOICES = [
  palette.balticBlue,
  palette.sandyBrown,
  palette.copper,
  palette.deepWalnut,
  '#3C8C6E',
  '#7B5EA7',
  '#C0492F',
  '#2A8C8A',
];

export const BUCKET_EMOJI_CHOICES = [
  '😩', '🤯', '🤔', '✅', '🔥', '⭐️', '❓', '🩺', '💊', '🧠', '📌', '⚡️',
];
