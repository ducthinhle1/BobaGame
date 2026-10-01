import {tick} from './audio';
import {$,OUT,top} from './core';
import {blit,inEll,px} from './draw';

// Title screen art: a cat-eared boba cup with Bơ napping beside it, gently animated while the title is shown.
let raf = 0;

function draw(c: CanvasRenderingContext2D, t: number) {
  const Wt = 96, Ht = 60;
  // soft sky, a few sparkles, the counter
  [['#FFE6C8', 0, 18], ['#FFD8BE', 18, 30], ['#FFC9BB', 30, 40], ['#FBB9C0', 40, 46]].forEach(([col, a, b]) => px(c, 0, a as number, Wt, (b as number) - (a as number), col as string));
  for (let i = 0; i < 6; i++) { const on = Math.sin(t * 2 + i * 1.7) > .3; if (on) { const x = (i * 17 + 7) % Wt, y = 4 + (i * 11) % 22; px(c, x, y, 1, 1, '#FFFFFF'); px(c, x - 1, y, 1, 1, '#FFF3CF'); px(c, x + 1, y, 1, 1, '#FFF3CF'); px(c, x, y - 1, 1, 1, '#FFF3CF'); px(c, x, y + 1, 1, 1, '#FFF3CF'); } }
  px(c, 0, 46, Wt, 14, '#CF915F'); px(c, 0, 46, Wt, 2, '#EDB888'); px(c, 0, 48, Wt, 1, '#A76C44');
  for (let x = 6; x < Wt; x += 16) { px(c, x, 53, 2, 1, '#E8A87A'); px(c, x - 1, 54, 1, 1, '#E8A87A'); px(c, x + 2, 54, 1, 1, '#E8A87A'); }
  // the cup: cat ears on the lid, a little face, pearls bobbing at the bottom, a pink straw
  const cx = 30, top = 12, bob = Math.round(Math.sin(t * 1.6) * .6);
  const sw = Math.round(Math.sin(t * 1.2));
  px(c, cx + 9 + sw, top - 9, 2, 12, '#F58DA6'); px(c, cx + 9 + sw, top - 9, 2, 1, '#D96A86');
  const ear = (ex: number) => (x: number, y: number) => y > 0 && y < 5 && Math.abs(x - ex) <= y * .55;
  blit(c, cx - 2, top - 5, 26, 6, ear(5), '#FFF4EA', OUT); blit(c, cx - 2, top - 5, 26, 6, ear(19), '#FFF4EA', OUT);
  px(c, cx + 2, top - 2, 1, 1, '#F7A8BC'); px(c, cx + 16, top - 2, 1, 1, '#F7A8BC');
  px(c, cx - 2, top, 26, 3, OUT); px(c, cx - 1, top, 24, 2, '#FFF4EA');
  blit(c, cx, top + 3, 22, 31, (x, y) => Math.abs(x - 10.5) <= 10 - y * .09, (x, y) => y < 3 ? '#F4E3D0' : x < 3 ? '#E0B48E' : '#D6A47A', OUT);
  for (let i = 0; i < 9; i++) { const px0 = cx + 3 + (i % 5) * 3 + (i > 4 ? 1 : 0), py0 = top + 26 + (i > 4 ? -3 : 0) + (i % 2 ? bob : 0); px(c, px0, py0, 2, 2, '#3B2A2D'); px(c, px0, py0, 1, 1, '#6E5A66'); }
  const blink = (t % 4) < .15;
  if (blink) { px(c, cx + 6, top + 11, 2, 1, OUT); px(c, cx + 13, top + 11, 2, 1, OUT); }
  else { px(c, cx + 6, top + 10, 2, 2, OUT); px(c, cx + 13, top + 10, 2, 2, OUT); px(c, cx + 6, top + 10, 1, 1, '#FFFFFF'); px(c, cx + 13, top + 10, 1, 1, '#FFFFFF'); }
  px(c, cx + 10, top + 13, 1, 1, '#E8788F'); px(c, cx + 9, top + 14, 1, 1, OUT); px(c, cx + 11, top + 14, 1, 1, OUT);
  px(c, cx + 4, top + 13, 2, 1, '#F7A8BC'); px(c, cx + 15, top + 13, 2, 1, '#F7A8BC');
  px(c, cx + 1, top + 6, 1, 16, 'rgba(255,255,255,.45)');
  // Bơ asleep on the counter, breathing, with a drifting z
  const bx = 62, by = 37, br = Math.sin(t * 1.6) > 0 ? 0 : 1;
  blit(c, bx, by, 16, 9, (x, y) => inEll(x, y, 9, 5.3, 6.6, 3.4 - br * .3) && y > 1.5, (x, y) => ((x + Math.floor(y / 2)) % 4 === 0 && y > 3) ? '#E08A34' : '#F4AA55', OUT);
  blit(c, bx, by, 16, 9, (x, y) => inEll(x, y, 4, 4, 3.4, 3), '#F4AA55', OUT);
  px(c, bx + 1, by, 1, 2, '#F4AA55'); px(c, bx + 1, by - 1, 1, 1, OUT); px(c, bx + 5, by, 1, 2, '#F4AA55'); px(c, bx + 5, by - 1, 1, 1, OUT);
  px(c, bx + 2, by + 4, 2, 1, OUT); px(c, bx + 5, by + 4, 1, 1, OUT); px(c, bx + 3, by + 5, 1, 1, '#E8788F');
  px(c, bx + 11, by + 7, 4, 1, '#E08A34'); px(c, bx + 14, by + 6, 1, 1, '#E08A34');
  const zp = (t * .5) % 1; c.globalAlpha = 1 - zp;
  px(c, bx + 7, by - 3 - zp * 8, 3, 1, '#8A6A78'); px(c, bx + 8, by - 2 - zp * 8, 1, 1, '#8A6A78'); px(c, bx + 7, by - 1 - zp * 8, 3, 1, '#8A6A78');
  c.globalAlpha = 1;
  // a heart floating up from the cup now and then
  const hp = (t * .35) % 1; if (hp < .8) { c.globalAlpha = 1 - hp / .8; const hx = cx + 24, hy = Math.round(top + 4 - hp * 14);
    px(c, hx, hy, 1, 1, '#F2708F'); px(c, hx + 2, hy, 1, 1, '#F2708F'); px(c, hx, hy + 1, 3, 1, '#F2708F'); px(c, hx + 1, hy + 2, 1, 1, '#F2708F'); c.globalAlpha = 1; }
}

export function startTitleArt() {
  const cv = document.getElementById('title-art') as HTMLCanvasElement; if (!cv) return;
  const c = cv.getContext('2d');
  cancelAnimationFrame(raf);
  const tick = (ts: number) => { if ($('#start').hidden) return; draw(c, ts / 1000); raf = requestAnimationFrame(tick); };
  raf = requestAnimationFrame(tick);
}
