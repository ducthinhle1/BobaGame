import {describe, expect, it} from 'vitest';
import {ACHIEVEMENTS, newlyDone, progress, type PlayStats} from './achievements';
import {DECOR} from '../data';

const zero: PlayStats = {served: 0, perfect: 0, bestStreak: 0, days: 0, cleanDays: 0, place: 0, cats: 0, maxHearts: 0, wallet: 0};

describe('achievements', () => {
  it('nothing at the start', () => expect(newlyDone(zero, [])).toEqual([]));
  it('first cup unlocks “Ly đầu tiên” once', () => {
    const s = {...zero, served: 1};
    expect(newlyDone(s, []).map(a => a.id)).toEqual(['first']);
    expect(newlyDone(s, ['first'])).toEqual([]);
  });
  it('progress is capped at 1', () => {
    const a = ACHIEVEMENTS.find(x => x.id === 'serve100')!;
    expect(progress(a, {...zero, served: 50})).toBe(.5);
    expect(progress(a, {...zero, served: 300})).toBe(1);
  });
  it('ids are unique and decor rewards exist and are achievement-only', () => {
    expect(new Set(ACHIEVEMENTS.map(a => a.id)).size).toBe(ACHIEVEMENTS.length);
    for (const a of ACHIEVEMENTS) if (a.reward.decor) {
      const d = DECOR.find(x => x.id === a.reward.decor);
      expect(d).toBeDefined();
      expect(d!.exclusive).toBe(true);
    }
  });
});
