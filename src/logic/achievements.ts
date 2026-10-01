// Achievements ("Thành tựu"): long-term goals measured from lifetime stats. Pure data + checks (no DOM).
//  - hidden: shown as "???" with a vague hint until reached
//  - requires: a follow-up that only appears once the previous one is reached

export interface PlayStats {
  served: number; perfect: number; bestStreak: number; days: number; cleanDays: number;
  place: number; cats: number; maxHearts: number; wallet: number;
  pets: number; perfectDays: number; maxDumps: number; seasonal: number; maxTips: number; midnight: number; royal: number;
}

export interface Achievement {
  id: string; name: string; desc: string;
  stat: keyof PlayStats; target: number;
  reward: {money?: number; decor?: string};
  hidden?: boolean; hint?: string; requires?: string;
}

export const ACHIEVEMENTS: Achievement[] = [
  {id: 'first', name: 'Ly đầu tiên', desc: 'Phục vụ ly trà sữa đầu tiên', stat: 'served', target: 1, reward: {money: 20}},
  {id: 'serve100', name: 'Trăm ly', desc: 'Phục vụ tổng cộng 100 ly', stat: 'served', target: 100, reward: {money: 100}},
  {id: 'serve500', name: 'Năm trăm ly', desc: 'Phục vụ tổng cộng 500 ly', stat: 'served', target: 500, reward: {decor: 'trophy'}},
  {id: 'serve1000', name: 'Nghìn ly', desc: 'Phục vụ tổng cộng 1.000 ly', stat: 'served', target: 1000, reward: {money: 300}, requires: 'serve500'},
  {id: 'perfect50', name: 'Tay pha khéo', desc: 'Pha 50 ly hoàn hảo', stat: 'perfect', target: 50, reward: {money: 80}},
  {id: 'streak10', name: 'Không trượt phát nào', desc: 'Đạt chuỗi 10 ly hoàn hảo liên tiếp', stat: 'bestStreak', target: 10, reward: {money: 60}},
  {id: 'streak25', name: 'Bậc thầy trà sữa', desc: 'Đạt chuỗi 25 ly hoàn hảo liên tiếp', stat: 'bestStreak', target: 25, reward: {decor: 'neon'}, requires: 'streak10'},
  {id: 'streak50', name: 'Huyền thoại quầy pha', desc: 'Đạt chuỗi 50 ly hoàn hảo liên tiếp', stat: 'bestStreak', target: 50, reward: {money: 300}, requires: 'streak25'},
  {id: 'clean', name: 'Không ai phải chờ', desc: 'Một ngày bán từ 15 ly mà không khách nào bỏ về', stat: 'cleanDays', target: 1, reward: {money: 80}},
  {id: 'week', name: 'Một tuần mở tiệm', desc: 'Mở tiệm 7 ngày', stat: 'days', target: 7, reward: {money: 100}},
  {id: 'month', name: 'Tròn một tháng', desc: 'Mở tiệm 30 ngày', stat: 'days', target: 30, reward: {money: 300}, requires: 'week'},
  {id: 'kiosk', name: 'Ra chợ', desc: 'Chuyển lên Ki-ốt góc chợ', stat: 'place', target: 1, reward: {money: 50}},
  {id: 'shop', name: 'Tiệm của riêng mình', desc: 'Mở Tiệm Mèo Trân Châu', stat: 'place', target: 2, reward: {decor: 'cushion'}, requires: 'kiosk'},
  {id: 'cats4', name: 'Bạn của mèo', desc: 'Làm quen 4 bé mèo', stat: 'cats', target: 4, reward: {money: 80}},
  {id: 'cats7', name: 'Đủ bộ mèo', desc: 'Làm quen cả 7 bé mèo', stat: 'cats', target: 7, reward: {money: 200}, requires: 'cats4'},
  {id: 'friend', name: 'Khách ruột', desc: 'Thân 5 ♥ với một khách quen', stat: 'maxHearts', target: 5, reward: {money: 100}},
  {id: 'rich', name: 'Hũ tiết kiệm đầy', desc: 'Có 5.000k tiền tiết kiệm', stat: 'wallet', target: 5000, reward: {money: 150}},
  // hidden: found by playing
  {id: 'petlover', name: 'Người nghiện mèo', desc: 'Vuốt ve mèo của tiệm 50 lần', stat: 'pets', target: 50, reward: {money: 120}, hidden: true, hint: 'Mấy bé mèo của tiệm rất thích được cưng.'},
  {id: 'flawless', name: 'Một ngày hoàn hảo', desc: 'Một ngày bán từ 20 ly, ly nào cũng hoàn hảo, không ai bỏ về', stat: 'perfectDays', target: 1, reward: {money: 200}, hidden: true, hint: 'Không một sai sót nào, suốt cả ngày.'},
  {id: 'oops', name: 'Tay run quá', desc: 'Đổ 10 ly trong một ngày', stat: 'maxDumps', target: 10, reward: {money: 30}, hidden: true, hint: 'Ai cũng có ngày vụng về…'},
  {id: 'seasonal', name: 'Sành món mùa', desc: 'Bán 30 ly món theo mùa', stat: 'seasonal', target: 30, reward: {money: 150}, hidden: true, hint: 'Mỗi mùa có một món chỉ bán trong mùa đó.'},
  {id: 'bigtip', name: 'Mưa tip', desc: 'Nhận 300k tiền tip trong một ngày', stat: 'maxTips', target: 300, reward: {money: 100}, hidden: true, hint: 'Khách vui thì khách thưởng.'},
  {id: 'nightowl', name: 'Cú đêm', desc: 'Mở tiệm lúc nửa đêm (0h đến 4h sáng)', stat: 'midnight', target: 1, reward: {money: 50}, hidden: true, hint: 'Mèo thích thức khuya lắm.'},
  {id: 'royal', name: 'Diện kiến Hoàng Tử', desc: 'Làm quen bé mèo Hoàng Tử', stat: 'royal', target: 1, reward: {money: 100}, hidden: true, hint: 'Có một bé mèo đội vương miện chỉ ghé người chăm chỉ.'},
];

/** progress 0..1 for one achievement */
export function progress(a: Achievement, s: PlayStats): number {
  return Math.min(1, s[a.stat] / a.target);
}

/** achievements reached now that weren't before (a follow-up only counts once its predecessor is reached) */
export function newlyDone(s: PlayStats, done: readonly string[]): Achievement[] {
  const got = [...done], out: Achievement[] = [];
  // repeat so a chain can unlock several links at once (e.g. 500 and 1.000 cups on the same day)
  for (let changed = true; changed;) {
    changed = false;
    for (const a of ACHIEVEMENTS) {
      if (got.includes(a.id) || (a.requires && !got.includes(a.requires)) || s[a.stat] < a.target) continue;
      got.push(a.id); out.push(a); changed = true;
    }
  }
  return out;
}

export type Visibility = 'done' | 'open' | 'hidden' | 'locked';
/** how an achievement shows in the list: reached, in progress, a hidden "???" or a locked follow-up */
export function visibility(a: Achievement, done: readonly string[]): Visibility {
  if (done.includes(a.id)) return 'done';
  if (a.requires && !done.includes(a.requires)) return 'locked';
  return a.hidden ? 'hidden' : 'open';
}
