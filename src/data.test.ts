// Sanity checks on the game data: catches typos in ids when adding drinks, toppings or shop items.
import {describe, expect, it} from 'vitest';
import {EVENTS, FEATURES, LEVELS, RECIPES, REGULARS, STAFF, SUGARS, SUPPLY, TEAS, TOPS, UPGRADES} from './data';

const teaIds = TEAS.map(t => t.id), topIds = TOPS.map(t => t.id);

describe('data', () => {
  it('ids are unique', () => {
    for (const list of [TEAS, TOPS, SUPPLY, RECIPES, UPGRADES, STAFF, REGULARS]) {
      const ids = list.map(x => x.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });
  it('every tea and topping can be restocked at the market', () => {
    for (const id of [...teaIds, ...topIds]) expect(SUPPLY.some(s => s.id === id)).toBe(true);
  });
  it('recipes unlock real menu items', () => {
    for (const r of RECIPES) expect(r.kind === 'tea' ? teaIds : topIds).toContain(r.id);
  });
  it("regulars' favourite drinks use real items and valid choices", () => {
    for (const r of REGULARS) {
      expect(teaIds).toContain(r.fav.tea);
      r.fav.tops.forEach(t => expect(topIds).toContain(t));
      expect(SUGARS).toContain(r.fav.sugar);
      expect([0, 1, 2]).toContain(r.fav.ice);
    }
  });
  it('levels start at 0 and go up', () => {
    expect(LEVELS[0]).toBe(0);
    LEVELS.slice(1).forEach((x, i) => expect(x).toBeGreaterThan(LEVELS[i]));
  });
  it('events have a positive weight; features unlock on day 2 or later', () => {
    Object.values(EVENTS).forEach(e => expect(e.w).toBeGreaterThan(0));
    Object.values(FEATURES).forEach(d => expect(d).toBeGreaterThanOrEqual(2));
  });
});
