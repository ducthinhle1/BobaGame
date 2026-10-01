import type {PlayStats} from '../logic/achievements';
import {DECOR} from '../data';
import {ACHIEVEMENTS,newlyDone,progress} from '../logic/achievements';
import {track} from './analytics';
import {beep} from './audio';
import {$,persist,placeIndex,save} from './core';
import {S} from './state';

const emptyStats = () => ({served: 0, perfect: 0, bestStreak: 0, days: 0, cleanDays: 0});

/** lifetime numbers; during a shift today's numbers are counted in too */
export function statsNow(): PlayStats {
  const st = save.stats || emptyStats(), live = S && (S.phase === 'open' || S.phase === 'paused');
  const hearts = Object.values(save.friends || {}).reduce((m, f) => Math.max(m, f.hearts), 0);
  return {
    served: st.served + (live ? S.served : 0), perfect: st.perfect + (live ? S.perfect : 0),
    bestStreak: Math.max(st.bestStreak, live ? S.bestStreak : 0), days: st.days, cleanDays: st.cleanDays,
    place: placeIndex(), cats: (save.cats || []).length, maxHearts: hearts, wallet: save.wallet,
  };
}

/** adds a finished day to the lifetime stats (called once at closing time) */
export function recordDay() {
  const st = save.stats || emptyStats();
  st.served += S.served; st.perfect += S.perfect; st.bestStreak = Math.max(st.bestStreak, S.bestStreak); st.days++;
  if (S.served >= 15 && S.missed === 0) st.cleanDays++;
  save.stats = st;
}

/** hands out anything newly reached and shows a toast for each */
export function checkAchievements() {
  const got = newlyDone(statsNow(), save.achievements || []);
  if (!got.length) return;
  save.achievements = [...(save.achievements || []), ...got.map(a => a.id)];
  for (const a of got) {
    let rw = '';
    if (a.reward.money) { save.wallet += a.reward.money; rw = `+${a.reward.money}k`; }
    if (a.reward.decor) { save.decor = [...new Set([...(save.decor || []), a.reward.decor])]; rw = `tặng ${DECOR.find(d => d.id === a.reward.decor).name}`; }
    toast(`Thành tích: ${a.name}`, rw);
    track('achievement', {id: a.id, day: save.day});
  }
  persist();
}

const queue: [string, string][] = []; let busy = false;
function toast(title: string, sub: string) { queue.push([title, sub]); if (!busy) nextToast(); }
function nextToast() {
  const n = queue.shift(); if (!n) { busy = false; return; }
  busy = true; const el = $('#toast');
  el.innerHTML = `<b>🏆 ${n[0]}</b><span>${n[1]}</span>`; el.hidden = false; el.classList.remove('out');
  [784, 988, 1175].forEach((f, i) => beep(f, .12, 'triangle', .03, null, i * .08));
  setTimeout(() => { el.classList.add('out'); setTimeout(() => { el.hidden = true; nextToast(); }, 350); }, 2800);
}

/** the list in the market's Sổ sách tab */
export function renderAchievements() {
  const s = statsNow(), done = save.achievements || [];
  $('#m-achsum').textContent = `· ${done.length}/${ACHIEVEMENTS.length}`;
  const fmt = (n: number) => n >= 1000 ? n.toLocaleString('vi-VN') : String(n);
  $('#m-ach').innerHTML = ACHIEVEMENTS.map(a => {
    const ok = done.includes(a.id), p = progress(a, s);
    const rw = a.reward.money ? `+${a.reward.money}k` : `Món độc quyền: ${DECOR.find(d => d.id === a.reward.decor).name}`;
    return `<div class="ach${ok ? ' done' : ''}"><div class="ach-top"><b>${ok ? '✓ ' : ''}${a.name}</b><span>${rw}</span></div>
      <small>${a.desc}</small>${ok ? '' : `<div class="goal"><i style="width:${p * 100}%"></i></div><small class="ach-n">${fmt(Math.min(s[a.stat], a.target))} / ${fmt(a.target)}</small>`}</div>`;
  }).join('');
}
