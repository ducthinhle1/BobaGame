// Consecutive-day login streak, based on the player's local calendar dates (YYYY-MM-DD).

/** Local date as YYYY-MM-DD. */
export function dayKey(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/**
 * What happens when the player opens the game on `today`.
 * Returns null if today's gift was already handed out, otherwise the new streak
 * (yesterday → +1, any longer gap → back to 1).
 */
export function nextStreak(last: {last: string; streak: number} | undefined, today: Date): number | null {
  const key = dayKey(today);
  if (last && last.last === key) return null;
  const y = new Date(today); y.setDate(y.getDate() - 1);
  return last && last.last === dayKey(y) ? last.streak + 1 : 1;
}

/** Which gift of the 7-day cycle (0..6) a streak gets. */
export const giftIndex = (streak: number): number => (streak - 1) % 7;
