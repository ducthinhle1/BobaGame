// Achievements: long-term goals measured from lifetime stats. Pure data + checks (no DOM).

export interface PlayStats {
  served: number; perfect: number; bestStreak: number; days: number; cleanDays: number;
  place: number; cats: number; maxHearts: number; wallet: number;
}

export interface Achievement {
  id: string; name: string; desc: string;
  stat: keyof PlayStats; target: number;
  reward: {money?: number; decor?: string};
}

export const ACHIEVEMENTS: Achievement[] = [
  {id: 'first', name: 'Ly đầu tiên', desc: 'Phục vụ ly trà sữa đầu tiên', stat: 'served', target: 1, reward: {money: 20}},
  {id: 'serve100', name: 'Trăm ly', desc: 'Phục vụ tổng cộng 100 ly', stat: 'served', target: 100, reward: {money: 100}},
  {id: 'serve500', name: 'Năm trăm ly', desc: 'Phục vụ tổng cộng 500 ly', stat: 'served', target: 500, reward: {decor: 'trophy'}},
  {id: 'perfect50', name: 'Tay pha khéo', desc: 'Pha 50 ly hoàn hảo', stat: 'perfect', target: 50, reward: {money: 80}},
  {id: 'streak10', name: 'Không trượt phát nào', desc: 'Đạt chuỗi 10 ly hoàn hảo liên tiếp', stat: 'bestStreak', target: 10, reward: {money: 60}},
  {id: 'streak25', name: 'Bậc thầy trà sữa', desc: 'Đạt chuỗi 25 ly hoàn hảo liên tiếp', stat: 'bestStreak', target: 25, reward: {decor: 'neon'}},
  {id: 'clean', name: 'Không ai phải chờ', desc: 'Một ngày bán từ 15 ly mà không khách nào bỏ về', stat: 'cleanDays', target: 1, reward: {money: 80}},
  {id: 'week', name: 'Một tuần mở tiệm', desc: 'Mở tiệm 7 ngày', stat: 'days', target: 7, reward: {money: 100}},
  {id: 'kiosk', name: 'Ra chợ', desc: 'Chuyển lên Ki-ốt góc chợ', stat: 'place', target: 1, reward: {money: 50}},
  {id: 'shop', name: 'Tiệm của riêng mình', desc: 'Mở Tiệm Mèo Trân Châu', stat: 'place', target: 2, reward: {decor: 'cushion'}},
  {id: 'cats4', name: 'Bạn của mèo', desc: 'Làm quen 4 bé mèo', stat: 'cats', target: 4, reward: {money: 80}},
  {id: 'cats7', name: 'Đủ bộ mèo', desc: 'Làm quen cả 7 bé mèo', stat: 'cats', target: 7, reward: {money: 200}},
  {id: 'friend', name: 'Khách ruột', desc: 'Thân 5 ♥ với một khách quen', stat: 'maxHearts', target: 5, reward: {money: 100}},
  {id: 'rich', name: 'Hũ tiết kiệm đầy', desc: 'Có 5.000k tiền tiết kiệm', stat: 'wallet', target: 5000, reward: {money: 150}},
];

/** progress 0..1 for one achievement */
export function progress(a: Achievement, s: PlayStats): number {
  return Math.min(1, s[a.stat] / a.target);
}

/** achievements reached now that weren't before */
export function newlyDone(s: PlayStats, done: readonly string[]): Achievement[] {
  return ACHIEVEMENTS.filter(a => !done.includes(a.id) && s[a.stat] >= a.target);
}
