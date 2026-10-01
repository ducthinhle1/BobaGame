import type {VisitorCat} from '../types';
import {VISITORS} from '../data';
import {track} from './analytics';
import {audio,meow} from './audio';
import {$,OUT,W,g,persist,pick,placeAtLeast,save} from './core';
import {blit,inEll,px} from './draw';
import {sparkle} from './fx';
import {updateHud} from './orders';
import {hint} from './serve';
import {S} from './state';

type Visit = {v: VisitorCat; x: number; state: 'in' | 'sit' | 'out'; t: number; known: boolean; done: boolean};
let visit: Visit | null = null;
const SIT_X = 44, Y = 44;

export function knowsCat(id: string) { return (save.cats || []).includes(id); }
export function resetVisitor() { visit = null; }

/** pick who comes today: a cat from a place you've reached, preferring ones you haven't met */
function pickVisitor(): VisitorCat | null {
  const ok = VISITORS.filter(c => !c.streak && placeAtLeast(c.place));
  if (!ok.length) return null;
  const fresh = ok.filter(c => !knowsCat(c.id));
  return pick(fresh.length ? fresh : ok);
}

export function updateVisitor(dt: number) {
  if (!S || S.phase !== 'open') return;
  if (!visit) {
    if (S.visitDone || S.visitAt < 0 || S.time < S.visitAt) return;
    const v = pickVisitor(); S.visitDone = true; if (!v) return;
    visit = {v, x: -16, state: 'in', t: 0, known: knowsCat(v.id), done: false};
    meow(1.1, .03);
    return;
  }
  if (visit.state === 'in') { visit.x += 12 * dt; if (visit.x >= SIT_X) { visit.x = SIT_X; visit.state = 'sit'; visit.t = 18; meow(1.15, .035); } }
  else if (visit.state === 'sit') { visit.t -= dt; if (visit.t <= 0) visit.state = 'out'; }
  else { visit.x += 14 * dt; if (visit.x > W + 20) visit = null; }
}

export function visitorAt(x: number, y: number) {
  return !!visit && !visit.done && x >= visit.x - 3 && x <= visit.x + 16 && y >= Y - 10 && y <= Y + 12;
}

export function befriendVisitor() {
  if (!visit || visit.done) return;
  const {v} = visit; visit.done = true; audio();
  if (!knowsCat(v.id)) {
    save.cats = [...(save.cats || []), v.id]; persist();
    hint(`Làm quen với bé ${v.name}! +1 ấm cúng. Xem trong Sổ mèo (tab Sổ sách ở chợ).`);
    track('cat', {cat: v.id, day: save.day});
  } else {
    S.cash += 10; S.tips += 10; updateHud();
    hint(`Bé ${v.name} ghé chơi, khách vui lây: +10k.`);
  }
  meow(1.2, .05); meow(1.35, .04, .4); sparkle(visit.x + 8, Y);
  if (visit.state === 'sit') visit.t = Math.min(visit.t, 2.5);
}

/** a visitor cat in its own colours: walking, or sitting with a ? (new) or ♥ (friend) above it */
export function drawCatSprite(c, x: number, y: number, v: VisitorCat, step: number, t: number) {
  const F = v.fur, D = v.dark;
  for (let i = 0; i < 5; i++) px(c, x - 1 - Math.round(i * .4), y + 4 - i + Math.round(Math.sin(t * 3 + i * .6) * .6), 1, 1, D);
  px(c, x, y + 3, 9, 4, F); px(c, x + 1, y + 3, 7, 1, D);
  if (v.patch) { px(c, x + 2, y + 4, 3, 2, v.patch); px(c, x + 9, y, 2, 2, v.patch); }
  if (v.id === 'muop' || v.id === 'hoangtu') for (let k = 1; k < 8; k += 3) px(c, x + k, y + 4, 1, 2, D);
  px(c, x + 1, y + 7, 1, 2 + step, F); px(c, x + 3, y + 7, 1, 3 - step, F); px(c, x + 6, y + 7, 1, 2 + step, F); px(c, x + 8, y + 7, 1, 3 - step, F);
  px(c, x + 8, y, 5, 5, F); px(c, x + 8, y - 1, 1, 1, F); px(c, x + 12, y - 1, 1, 1, F); px(c, x + 9, y, 1, 1, '#F7A8BC');
  px(c, x + 10, y + 1, 1, 2, v.eye); px(c, x + 12, y + 1, 1, 2, v.eye); px(c, x + 11, y + 3, 1, 1, '#E8788F');
  if (v.id === 'hoangtu') { px(c, x + 8, y - 3, 5, 2, '#F2C94C'); px(c, x + 8, y - 4, 1, 1, '#F2C94C'); px(c, x + 10, y - 4, 1, 1, '#F2C94C'); px(c, x + 12, y - 4, 1, 1, '#F2C94C'); }
}
export function drawVisitor(t: number) {
  if (!visit) return;
  const step = visit.state === 'sit' ? 0 : Math.floor(t * 6) % 2, x = Math.round(visit.x);
  drawCatSprite(g, x, Y, visit.v, step, t);
  if (visit.state === 'sit' && !visit.done) {
    const by = Y - 10 + Math.round(Math.sin(t * 3)), bx = x + 7;
    px(g, bx - 1, by - 1, 7, 7, OUT); px(g, bx, by, 5, 5, '#FFF8F2');
    if (visit.known) { px(g, bx + 1, by + 1, 1, 1, '#E0557A'); px(g, bx + 3, by + 1, 1, 1, '#E0557A'); px(g, bx + 1, by + 2, 3, 1, '#E0557A'); px(g, bx + 2, by + 3, 1, 1, '#E0557A'); }
    else { px(g, bx + 1, by, 3, 1, '#E0557A'); px(g, bx + 3, by + 1, 1, 1, '#E0557A'); px(g, bx + 2, by + 2, 1, 1, '#E0557A'); px(g, bx + 2, by + 4, 1, 1, '#E0557A'); }
  }
}

/** 16×16 album portrait; unmet cats are a silhouette */
const faceCache: Record<string, string> = {};
export function catFaceURL(v: VisitorCat, met: boolean) {
  const key = v.id + (met ? 1 : 0); if (faceCache[key]) return faceCache[key];
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; const c = cv.getContext('2d');
  const F = met ? v.fur : '#D8C4D6', O = met ? OUT : '#B8A8BC';
  const ear = (cx: number) => (x: number, y: number) => y > 2 && y < 7 && Math.abs(x - cx) <= (y - 2) * .6;
  blit(c, 0, 0, 16, 16, ear(4.5), F, O); blit(c, 0, 0, 16, 16, ear(11.5), met && v.patch ? v.patch : F, O);
  blit(c, 0, 0, 16, 16, (x, y) => inEll(x, y, 8, 10, 6.4, 5), F, O);
  if (met) {
    if (v.patch) px(c, 3, 9, 3, 3, v.patch);
    if (v.id === 'muop' || v.id === 'hoangtu') { px(c, 7, 6, 1, 2, v.dark); px(c, 9, 6, 1, 2, v.dark); }
    px(c, 5, 9, 1, 2, v.eye); px(c, 10, 9, 1, 2, v.eye); px(c, 7, 11, 2, 1, '#E8788F');
    if (v.id === 'hoangtu') { px(c, 5, 1, 6, 2, '#F2C94C'); px(c, 5, 0, 1, 1, '#F2C94C'); px(c, 8, 0, 1, 1, '#F2C94C'); px(c, 10, 0, 1, 1, '#F2C94C'); }
  } else { px(c, 7, 8, 2, 1, '#FFF8F2'); px(c, 8, 9, 1, 1, '#FFF8F2'); px(c, 8, 11, 1, 1, '#FFF8F2'); }
  return faceCache[key] = cv.toDataURL();
}

/** the album in the market's Sổ sách tab */
export function renderCatAlbum() {
  const met = VISITORS.filter(v => knowsCat(v.id)).length;
  $('#m-catsum').textContent = `· ${met}/${VISITORS.length} bé${met ? ` (+${met} ấm cúng)` : ''}`;
  const where: Record<string, string> = {cart: 'Hay lui tới xe đẩy', kiosk: 'Hay ghé ki-ốt góc chợ', shop: 'Chỉ ghé tiệm lớn'};
  $('#m-cats').innerHTML = VISITORS.map(v => {
    const k = knowsCat(v.id);
    const hint2 = v.streak ? 'Quà khi mở game 7 ngày liền' : where[v.place];
    return `<div class="catcard${k ? ' met' : ''}"><img src="${catFaceURL(v, k)}" alt=""><div><b>${k ? v.name : '???'}</b><small>${k ? v.bio : hint2}</small></div></div>`;
  }).join('');
}
