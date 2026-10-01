import {describe, expect, it} from 'vitest';
import {dayKey, giftIndex, nextStreak} from './streak';

describe('login streak', () => {
  const d = (s: string) => new Date(s + 'T10:00:00');
  it('starts at 1', () => expect(nextStreak(undefined, d('2026-10-01'))).toBe(1));
  it('no second gift on the same day', () => expect(nextStreak({last: '2026-10-01', streak: 3}, d('2026-10-01'))).toBeNull());
  it('grows on the next day, also across months', () => {
    expect(nextStreak({last: '2026-10-01', streak: 3}, d('2026-10-02'))).toBe(4);
    expect(nextStreak({last: '2026-09-30', streak: 6}, d('2026-10-01'))).toBe(7);
  });
  it('resets after a missed day', () => expect(nextStreak({last: '2026-10-01', streak: 5}, d('2026-10-03'))).toBe(1));
  it('cycles gifts every 7 days', () => {
    expect([1, 7, 8, 14].map(giftIndex)).toEqual([0, 6, 0, 6]);
    expect(dayKey(d('2026-01-05'))).toBe('2026-01-05');
  });
});
