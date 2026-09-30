// Brewed tea and cooked pearls are kept as batches, each with its own quality; the oldest batch is served first.
import type {Batch, Quality} from '../types';

export function count(batches: Batch[]): number {
  return batches.reduce((sum, b) => sum + b.n, 0);
}

/** Quality of the next serving, or undefined when empty. */
export function nextQuality(batches: Batch[]): Quality | undefined {
  return batches[0]?.q;
}

export function addBatch(batches: Batch[], n: number, q: Quality): void {
  if (n > 0) batches.push({n, q});
}

/** Takes one serving from the oldest batch and returns its quality. Throws when empty: check count() first. */
export function takeServing(batches: Batch[]): Quality {
  const b = batches[0];
  if (!b) throw new Error('takeServing: out of stock');
  b.n--;
  if (b.n <= 0) batches.shift();
  return b.q;
}
