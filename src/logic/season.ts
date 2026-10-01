// Real-calendar seasons: each brings a limited-time drink and its own shop decorations.
export type SeasonId = 'he' | 'trungthu' | 'halloween' | 'noel' | 'tet';

/** [season, from month/day, to month/day] — inclusive, by the player's local date */
const RANGES: [SeasonId, number, number, number, number][] = [
  ['tet', 1, 20, 2, 20],
  ['he', 6, 1, 8, 31],
  ['trungthu', 9, 12, 10, 12],
  ['halloween', 10, 20, 11, 2],
  ['noel', 12, 15, 12, 31],
];

export function seasonOf(d: Date): SeasonId | null {
  const v = (d.getMonth() + 1) * 100 + d.getDate();
  for (const [id, m1, d1, m2, d2] of RANGES) if (v >= m1 * 100 + d1 && v <= m2 * 100 + d2) return id;
  return null;
}

/** e.g. "halloween-2026": used so each season's welcome gift is given once per year */
export function seasonKey(id: SeasonId, d: Date): string {
  return `${id}-${d.getFullYear()}`;
}
