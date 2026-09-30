import {describe, expect, it} from 'vitest';
import {addBatch, count, nextQuality, takeServing} from './stock';
import type {Batch} from '../types';

describe('stock batches', () => {
  it('serves the oldest batch first, then moves to the next', () => {
    const s: Batch[] = [];
    addBatch(s, 2, 'weak');
    addBatch(s, 8, 'perfect');
    expect(count(s)).toBe(10);
    expect(takeServing(s)).toBe('weak');
    expect(takeServing(s)).toBe('weak');
    expect(nextQuality(s)).toBe('perfect');
    expect(count(s)).toBe(8);
  });
  it('ignores empty batches', () => {
    const s: Batch[] = [];
    addBatch(s, 0, 'good');
    expect(s).toHaveLength(0);
    expect(nextQuality(s)).toBeUndefined();
  });
  it('refuses to serve from empty stock', () => {
    expect(() => takeServing([])).toThrow();
  });
});
