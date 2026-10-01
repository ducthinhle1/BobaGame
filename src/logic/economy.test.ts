import {describe, expect, it} from 'vitest';
import {bagTip, comboOf, cozyBonus, cozyPoints, cupPrice, cupTip, goalFor, levelOf, levelProgress, moodOf} from './economy';
import {LEVELS, TEAS, TOPS} from '../data';

const list = {tea: (id: string) => TEAS.find(t => t.id === id)!, top: (id: string) => TOPS.find(t => t.id === id)!};
const base = {typeTip: 1, patience: 1, streak: 1, quality: 1, tipJar: false};

describe('cupPrice', () => {
  it('adds tea and toppings', () => {
    expect(cupPrice({tea: 'taro', sugar: 50, ice: 1, tops: ['pearl']}, list)).toBe(35);
    expect(cupPrice({tea: 'black', sugar: 0, ice: 0, tops: []}, list)).toBe(25);
  });
  it('applies the day multiplier and rounds', () => {
    expect(cupPrice({tea: 'black', sugar: 0, ice: 0, tops: []}, list, 1.1)).toBe(28);
  });
});

describe('tips', () => {
  it('full patience, no bonuses: 6 × 1 × 1 + 1 = 7k', () => {
    expect(cupTip(base)).toBe(7);
  });
  it('streak of 3+ adds 50% to the patience part', () => {
    expect(comboOf(2)).toBe(1);
    expect(comboOf(3)).toBe(1.5);
    expect(cupTip({...base, streak: 3})).toBe(10);
  });
  it('never drops below 1k', () => {
    expect(cupTip({...base, patience: 0, quality: 0.5})).toBe(1);
  });
  it('the tip jar adds 25%', () => {
    expect(cupTip({...base, tipJar: true})).toBe(9);
  });
  it('bags pay per perfect cup and nothing when none were perfect', () => {
    expect(bagTip(base, 2)).toBe(12);
    expect(bagTip(base, 0)).toBe(0);
  });
});

describe('progress', () => {
  it('goal grows by 110k a day', () => {
    expect(goalFor(1)).toBe(400);
    expect(goalFor(3)).toBe(620);
  });
  it('levels', () => {
    expect(levelOf(0, LEVELS)).toBe(1);
    expect(levelOf(LEVELS[1], LEVELS)).toBe(2);
    expect(levelProgress(LEVELS[1] / 2, LEVELS)).toBeCloseTo(0.5);
    expect(levelProgress(1e9, LEVELS)).toBe(1);
  });
  it('mood follows patience', () => {
    expect([0.9, 0.4, 0.2, 0.05].map(moodOf)).toEqual(['happy', 'okay', 'upset', 'furious']);
  });
});

describe('coziness', () => {
  const decor = [{id: 'a', cozy: 2}, {id: 'b', cozy: 3}];
  it('adds up owned decorations only', () => {
    expect(cozyPoints([], decor)).toBe(0);
    expect(cozyPoints(['b'], decor)).toBe(3);
    expect(cozyPoints(['a', 'b', 'zzz'], decor)).toBe(5);
  });
  it('1% tips and 0.5% patience per point', () => {
    expect(cozyBonus(0)).toEqual({tip: 1, patience: 1});
    expect(cozyBonus(10).tip).toBeCloseTo(1.1);
    expect(cozyBonus(10).patience).toBeCloseTo(1.05);
  });
});
