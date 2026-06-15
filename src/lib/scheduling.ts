import type { Priority, Review } from '../types';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Initial review interval (in days) seeded by the bucket's priority. Things you
 * forgot come back soonest; things you've got down come back rarely.
 */
const INITIAL_INTERVAL: Record<Priority, number> = {
  highest: 1,
  high: 2,
  medium: 4,
  low: 9,
};

export function createReview(priority: Priority, now = Date.now()): Review {
  const intervalDays = INITIAL_INTERVAL[priority];
  return {
    intervalDays,
    dueAt: now + intervalDays * DAY,
    ease: 2.3,
    reps: 0,
  };
}

/**
 * Simplified SM-2-style update. `again` resets, `good` grows by ease, `easy`
 * grows faster and nudges ease up.
 */
export function applyReview(
  review: Review,
  result: 'again' | 'good' | 'easy',
  now = Date.now()
): Review {
  let { intervalDays, ease } = review;

  if (result === 'again') {
    intervalDays = 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (result === 'good') {
    intervalDays = Math.max(1, Math.round(intervalDays * ease));
  } else {
    ease = ease + 0.15;
    intervalDays = Math.max(2, Math.round(intervalDays * ease * 1.3));
  }

  return {
    intervalDays,
    ease,
    dueAt: now + intervalDays * DAY,
    lastResult: result,
    reps: review.reps + 1,
  };
}

export function isDue(review: Review | undefined, now = Date.now()): boolean {
  return !!review && review.dueAt <= now;
}
