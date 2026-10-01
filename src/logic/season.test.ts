import {describe, expect, it} from 'vitest';
import {seasonOf} from './season';

const d = (s: string) => new Date(s + 'T12:00:00');
describe('seasons', () => {
  it('finds each season by date', () => {
    expect(seasonOf(d('2026-07-04'))).toBe('he');
    expect(seasonOf(d('2026-10-01'))).toBe('trungthu');
    expect(seasonOf(d('2026-10-31'))).toBe('halloween');
    expect(seasonOf(d('2026-11-02'))).toBe('halloween');
    expect(seasonOf(d('2026-12-24'))).toBe('noel');
    expect(seasonOf(d('2027-02-01'))).toBe('tet');
  });
  it('edges and gaps', () => {
    expect(seasonOf(d('2026-09-12'))).toBe('trungthu');
    expect(seasonOf(d('2026-10-13'))).toBeNull();
    expect(seasonOf(d('2026-11-03'))).toBeNull();
    expect(seasonOf(d('2026-05-31'))).toBeNull();
  });
});
