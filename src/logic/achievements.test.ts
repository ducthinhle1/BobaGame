import {describe, expect, it} from 'vitest';
import {ACHIEVEMENTS, newlyDone, progress, visibility, type PlayStats} from './achievements';
import {DECOR} from '../data';

const zero: PlayStats = {served: 0, perfect: 0, bestStreak: 0, days: 0, cleanDays: 0, place: 0, cats: 0, maxHearts: 0, wallet: 0,
  pets: 0, perfectDays: 0, maxDumps: 0, seasonal: 0, maxTips: 0, midnight: 0, royal: 0};

describe('achievements', () => {
  it('nothing at the start', () => expect(newlyDone(zero, [])).toEqual([]));
  it('first cup unlocks “Ly đầu tiên” once', () => {
    const s = {...zero, served: 1};
    expect(newlyDone(s, []).map(a => a.id)).toEqual(['first']);
    expect(newlyDone(s, ['first'])).toEqual([]);
  });
  it('a follow-up waits for its predecessor, and a chain can complete in one go', () => {
    expect(newlyDone({...zero, bestStreak: 50}, []).map(a => a.id)).toEqual(['streak10', 'streak25', 'streak50']);
    expect(newlyDone({...zero, served: 1000}, ['first', 'serve100']).map(a => a.id)).toEqual(['serve500', 'serve1000']);
  });
  it('visibility: open, hidden, locked, done', () => {
    const get = (id: string) => ACHIEVEMENTS.find(a => a.id === id)!;
    expect(visibility(get('serve100'), [])).toBe('open');
    expect(visibility(get('nightowl'), [])).toBe('hidden');
    expect(visibility(get('serve1000'), [])).toBe('locked');
    expect(visibility(get('serve1000'), ['serve500'])).toBe('open');
    expect(visibility(get('nightowl'), ['nightowl'])).toBe('done');
  });
  it('progress is capped at 1', () => {
    const a = ACHIEVEMENTS.find(x => x.id === 'serve100')!;
    expect(progress(a, {...zero, served: 50})).toBe(.5);
    expect(progress(a, {...zero, served: 300})).toBe(1);
  });
  it('ids unique; requires point to real ones; hidden ones have hints; decor rewards are achievement-only', () => {
    const ids = ACHIEVEMENTS.map(a => a.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const a of ACHIEVEMENTS) {
      if (a.requires) expect(ids).toContain(a.requires);
      if (a.hidden) expect(a.hint).toBeTruthy();
      if (a.reward.decor) expect(DECOR.find(x => x.id === a.reward.decor)?.exclusive).toBe(true);
    }
  });
});
