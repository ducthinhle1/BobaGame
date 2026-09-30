// Prices, tips, daily goals and levels.
import type {Order} from '../types';

export interface PriceList { tea(id: string): {price: number}; top(id: string): {price: number} }

/** Price of one cup (in k). `mul` is the day's price multiplier (e.g. holidays). */
export function cupPrice(order: Order, list: PriceList, mul = 1): number {
  const base = list.tea(order.tea).price + order.tops.reduce((s, t) => s + list.top(t).price, 0);
  return Math.round(base * mul);
}

export interface TipInput {
  typeTip: number;       // customer type's tip factor
  patience: number;      // 0..1, how much patience was left
  streak: number;        // perfect cups in a row, including this one
  quality: number;       // ingredient quality multiplier (1 = good)
  tipJar: boolean;       // "Hũ tip" upgrade
  boost?: number;        // day event × season
  close?: number;        // bonus for close friends
}

/** Streaks of 3+ perfect cups add 50% to tips. */
export const comboOf = (streak: number): number => (streak >= 3 ? 1.5 : 1);

/** Tip for one perfect cup. Always at least 1k. */
export function cupTip(t: TipInput): number {
  const raw = (6 * t.typeTip * t.patience * comboOf(t.streak) + 1) * t.quality * (t.tipJar ? 1.25 : 1) * (t.boost ?? 1) * (t.close ?? 1);
  return Math.max(1, Math.round(raw));
}

/** Tip for a delivered bag: paid per perfect cup inside, 0 when none were perfect. */
export function bagTip(t: TipInput, perfectCups: number): number {
  if (perfectCups <= 0) return 0;
  const raw = (5 * t.typeTip * t.patience * comboOf(t.streak) + 1) * perfectCups * t.quality * (t.tipJar ? 1.25 : 1) * (t.boost ?? 1);
  return Math.max(1, Math.round(raw));
}

/** Revenue target for a day. */
export const goalFor = (day: number): number => 400 + 110 * (day - 1);

/** Level for an XP total, given the XP needed for each level (starting at 0). */
export function levelOf(xp: number, levels: readonly number[]): number {
  return levels.filter(t => xp >= t).length;
}

/** Progress (0..1) towards the next level; 1 at max level. */
export function levelProgress(xp: number, levels: readonly number[]): number {
  const l = levelOf(xp, levels);
  if (l >= levels.length) return 1;
  return (xp - levels[l - 1]) / (levels[l] - levels[l - 1]);
}

export type Mood = 'happy' | 'okay' | 'upset' | 'furious';

/** Face shown for how much patience is left (0..1). */
export function moodOf(patience: number): Mood {
  return patience > 0.5 ? 'happy' : patience > 0.25 ? 'okay' : patience > 0.1 ? 'upset' : 'furious';
}
