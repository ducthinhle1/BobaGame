import type {Achievement,PlayStats,Visibility} from '../logic/achievements';
import {DECOR,TEAS} from '../data';
import {ACHIEVEMENTS,newlyDone,progress,visibility} from '../logic/achievements';
import {track} from './analytics';
import {beep} from './audio';
import {$,persist,placeIndex,save} from './core';
import {S} from './state';

const emptyStats = (): NonNullable<typeof save.stats> => ({served: 0, perfect: 0, bestStreak: 0, days: 0, cleanDays: 0});
const seasonCups = () => S && S.q ? TEAS.filter(t => t.season).reduce((n, t) => n + (S.q.tea[t.id] || 0), 0) : 0;
const lateNight = () => new Date().getHours() < 4 ? 1 : 0;

/** lifetime numbers; during a shift today's numbers are counted in too */
export function statsNow(): PlayStats {
  const st = save.stats || emptyStats(), live = S && (S.phase === 'open' || S.phase === 'paused');
  const hearts = Object.values(save.friends || {}).reduce((m, f) => Math.max(m, f.hearts), 0);
  const L = (n: number) => live ? n : 0;
  return {
    served: st.served + L(S.served), perfect: st.perfect + L(S.perfect),
    bestStreak: Math.max(st.bestStreak, L(S.bestStreak)), days: st.days, cleanDays: st.cleanDays,
    place: placeIndex(), cats: (save.cats || []).length, maxHearts: hearts, wallet: save.wallet,
    pets: (st.pets || 0) + (S && S.q && S.phase !== 'closed' ? S.q.pet || 0 : 0),
    perfectDays: st.perfectDays || 0, maxDumps: Math.max(st.maxDumps || 0, L(S.dumped)),
    seasonal: (st.seasonal || 0) + L(seasonCups()), maxTips: Math.max(st.maxTips || 0, L(S.tips)),
    midnight: Math.max(st.midnight || 0, L(lateNight())),
    royal: (save.cats || []).includes('hoangtu') ? 1 : 0,
  };
}

/** adds a finished day to the lifetime stats (called once at closing time) */
export function recordDay() {
  const st = save.stats || emptyStats();
  st.served += S.served; st.perfect += S.perfect; st.bestStreak = Math.max(st.bestStreak, S.bestStreak); st.days++;
  if (S.served >= 15 && S.missed === 0) st.cleanDays++;
  if (S.served >= 20 && S.missed === 0 && S.perfect >= S.served) st.perfectDays = (st.perfectDays || 0) + 1;
  st.pets = (st.pets || 0) + (S.q.pet || 0);
  st.maxDumps = Math.max(st.maxDumps || 0, S.dumped);
  st.seasonal = (st.seasonal || 0) + seasonCups();
  st.maxTips = Math.max(st.maxTips || 0, S.tips);
  st.midnight = Math.max(st.midnight || 0, lateNight());
  save.stats = st;
}

/** hands out anything newly reached and shows a toast for each */
export function checkAchievements() {
  const got = newlyDone(statsNow(), save.achievements || []);
  if (!got.length) return;
  save.achSeen ??= (save.achievements || []).length;
  save.achievements = [...(save.achievements || []), ...got.map(a => a.id)];
  for (const a of got) {
    let rw = '';
    if (a.reward.money) { save.wallet += a.reward.money; rw = `+${a.reward.money}k`; }
    if (a.reward.decor) { save.decor = [...new Set([...(save.decor || []), a.reward.decor])]; rw = `tặng ${DECOR.find(d => d.id === a.reward.decor).name}`; }
    toast(`${a.hidden ? 'Thành tựu ẩn' : 'Thành tựu'}: ${a.name}`, rw);
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

/** the market's Thành tựu tab: a summary, then what's in progress, what's reached and the mysteries */
export function renderAchievements() {
  const s = statsNow(), done = save.achievements || [];
  const fmt = (n: number) => n >= 1000 ? n.toLocaleString('vi-VN') : String(n);
  const reward = (a: Achievement) => a.reward.money ? `+${a.reward.money}k` : `Món độc quyền: ${DECOR.find(d => d.id === a.reward.decor).name}`;
  const nameOf = (id: string) => ACHIEVEMENTS.find(a => a.id === id).name;
  const groups: Record<Visibility, Achievement[]> = {open: [], done: [], hidden: [], locked: []};
  for (const a of ACHIEVEMENTS) groups[visibility(a, done)].push(a);
  groups.open.sort((a, b) => progress(b, s) - progress(a, s));
  const fresh = new Set(done.slice(save.achSeen ?? done.length));

  const card = (a: Achievement, v: Visibility) => {
    if (v === 'hidden') return `<div class="ach secret"><div class="ach-top"><b>??? <em>Ẩn</em></b><span>${reward(a)}</span></div><small>${a.hint}</small></div>`;
    if (v === 'locked') return `<div class="ach locked"><div class="ach-top"><b>🔒 ${a.hidden ? '???' : a.name}</b><span>${reward(a)}</span></div><small>Mở sau khi đạt «${nameOf(a.requires)}»</small></div>`;
    const ok = v === 'done', p = progress(a, s);
    return `<div class="ach${ok ? ' done' : ''}${fresh.has(a.id) ? ' fresh' : ''}"><div class="ach-top"><b>${ok ? '✓ ' : ''}${a.name}${a.hidden ? ' <em>Ẩn</em>' : ''}${fresh.has(a.id) ? ' <em class="new">Mới</em>' : ''}</b><span>${reward(a)}</span></div>
      <small>${a.desc}</small>${ok ? '' : `<div class="goal"><i style="width:${p * 100}%"></i></div><small class="ach-n">${fmt(Math.min(s[a.stat], a.target))} / ${fmt(a.target)}</small>`}</div>`;
  };
  const sec = (title: string, v: Visibility[], note = '') => {
    const list = v.flatMap(k => groups[k].map(a => card(a, k)));
    return list.length ? `<h3 class="lab">${title} <span class="cozy">${list.length}</span></h3>${note}<div class="achlist">${list.join('')}</div>` : '';
  };
  const total = ACHIEVEMENTS.length, nHidden = ACHIEVEMENTS.filter(a => a.hidden).length, foundHidden = ACHIEVEMENTS.filter(a => a.hidden && done.includes(a.id)).length;
  const earned = ACHIEVEMENTS.filter(a => done.includes(a.id) && a.reward.money).reduce((n, a) => n + a.reward.money, 0);
  $('#m-achsum').innerHTML = `<div class="achbig"><b>${done.length}</b><span>/ ${total} thành tựu</span></div>
    <div class="goal"><i style="width:${done.length / total * 100}%"></i></div>
    <div class="achmeta"><span>🏆 Đã nhận ${fmt(earned)}k thưởng</span><span>✨ Ẩn: tìm được ${foundHidden}/${nHidden}</span></div>`;
  $('#m-ach').innerHTML =
    sec('Đang làm', ['open']) +
    sec('Bí ẩn', ['hidden', 'locked'], '<p class="qbonus">Thành tựu ẩn chỉ hiện tên khi bạn đạt được. Thành tựu có ổ khoá sẽ mở khi xong thành tựu trước nó.</p>') +
    sec('Đã đạt', ['done']);
}

/** called when the player opens the tab: everything reached so far counts as seen */
export function markAchievementsSeen() {
  const n = (save.achievements || []).length;
  if (save.achSeen !== n) { save.achSeen = n; persist(); }
}
/** true when something was reached since the tab was last opened */
export function hasUnseenAchievements() {
  return (save.achievements || []).length > (save.achSeen ?? (save.achievements || []).length);
}
