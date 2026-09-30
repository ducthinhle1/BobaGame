// Checking a finished cup against what the customer ordered.
import type {Cup, Order} from '../types';

export interface Match { tea: boolean; sugar: boolean; ice: boolean; tops: boolean }

/** Which parts of the cup already match the order (drives the green highlights). */
export function matchParts(cup: Cup, order: Order): Match {
  return {
    tea: cup.tea === order.tea,
    sugar: cup.sugar === order.sugar,
    ice: cup.ice === order.ice,
    // an untouched cup doesn't "match" a no-topping order yet
    tops: cup.tops.length === order.tops.length && order.tops.every(t => cup.tops.includes(t)) && (cup.tea !== null || cup.tops.length > 0),
  };
}

/** True when the cup can be served to this order as-is. */
export function isReady(cup: Cup, order: Order): boolean {
  const m = matchParts(cup, order);
  return cup.tea !== null && m.tea && m.sugar && m.ice && m.tops;
}

/** How many things are wrong: each wrong base step counts once, each extra or missing topping counts once. */
export function countErrors(cup: Cup, order: Order): number {
  let err = 0;
  if (cup.tea !== order.tea) err++;
  if (cup.sugar !== order.sugar) err++;
  if (cup.ice !== order.ice) err++;
  for (const t of cup.tops) if (!order.tops.includes(t)) err++;
  for (const t of order.tops) if (!cup.tops.includes(t)) err++;
  return err;
}

export type Verdict = 'perfect' | 'close' | 'wrong';

/** Perfect earns a tip; one mistake is still accepted by easy-going customers (no tip); strict ones refuse it. */
export function judge(errors: number, strict: boolean): Verdict {
  if (errors === 0) return 'perfect';
  if (errors === 1 && !strict) return 'close';
  return 'wrong';
}
