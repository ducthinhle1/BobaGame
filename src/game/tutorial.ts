import {TEAS} from '../data';
import {audio,sfx} from './audio';
import {$,OUT,persist,save,unlocked} from './core';
import {blit,inEll,px} from './draw';
import {ticketRefs} from './orders';
import {S,cup} from './state';

// First-day tutorial: Bơ the shop cat walks a new player through one full loop
// (market → prep → the first drink), highlighting the button to press at each step.
type Step = {phase: string; target?: string; text: string; done: () => boolean; next?: boolean};

// every tea you sell today has a batch (or nothing left in the pantry to brew)
const allTeas = () => unlocked(TEAS).filter(t => !t.season).every(t => (S.stock[t.id] || []).length > 0 || !(save.pantry[t.id] > 0));
const STEPS: Step[] = [
  {phase: 'market', target: '#m-need', next: true, done: () => false,
    text: 'Chào bạn! Mình là Bơ, mèo của tiệm. Sáng nào mình cũng đi chợ trước. Mục “Cần mua” cho biết món nào sắp thiếu.'},
  {phase: 'market', target: '#mgo', done: () => S.phase === 'prep',
    text: 'Nguyên liệu đầu tiên mình đã chuẩn bị sẵn rồi. Bấm “Đi chuẩn bị” để ra quầy nhé!'},
  {phase: 'prep', target: '#p-teas .btn:not([disabled])', done: allTeas,
    text: 'Pha mỗi loại trà một mẻ trước khi mở cửa. Bấm “Pha”, rồi làm theo chữ hiện trên màn hình. Mỗi loại trà có cách pha riêng.'},
  {phase: 'prep', target: '#p-pearl .btn', done: () => (S.stock.pearl || []).length > 0,
    text: 'Giỏi quá! Giờ nấu trân châu: khách rất mê trân châu đó.'},
  {phase: 'prep', target: '#popen', done: () => S.phase === 'open',
    text: 'Xong rồi! Bấm “Mở cửa tiệm” để đón khách.'},
  {phase: 'open', target: '#bubble', done: () => !!cup.tea,
    text: 'Khách nói món họ muốn ở bong bóng này. Bắt đầu bằng cách chọn đúng loại trà trên kệ.'},
  {phase: 'open', target: '.g-sugar', done: () => cup.sugar !== null,
    text: 'Phần làm đúng sẽ hóa xanh. Giờ chọn độ ngọt.'},
  {phase: 'open', target: '.g-ice', done: () => cup.ice !== null,
    text: 'Rồi chọn lượng đá.'},
  {phase: 'open', target: '.g-top', done: () => S.served > 0 || ticketRefs.some(r => r && r.ready),
    text: 'Khách có gọi topping thì thêm vào, không thì bỏ qua. Đủ hết là bong bóng xanh cả.'},
  {phase: 'open', target: '#serveBig', done: () => S.served > 0,
    text: 'Bấm nút lớn để phục vụ! Làm nhanh và đúng thì khách tip nhiều hơn.'},
  {phase: 'open', next: true, done: () => false,
    text: 'Tuyệt vời! Cứ thế phục vụ tới tối nhé. Đang bán mà hết trà thì chạm vào món đó để pha gấp. Chúc tiệm đông khách!'},
];

let step = -1, shownAt = 0;
export function tutorialActive() { return step >= 0; }

/** starts the tutorial for a brand-new game */
export function maybeStartTutorial() {
  if (step >= 0 || !S || S.phase !== 'market') return;
  if (save.tutDone || save.day !== 1 || save.xp > 0) return;
  step = 0; show();
}

function finish() {
  step = -1; save.tutDone = true; persist();
  $('#tut').hidden = true; clearHighlight();
}
function clearHighlight() { document.querySelectorAll('.tut-target').forEach(e => e.classList.remove('tut-target')); }

function show() {
  const s = STEPS[step]; clearHighlight();
  $('#tut-text').textContent = s.text;
  $('#tut-next').hidden = !s.next;
  $('#tut-next').textContent = step === STEPS.length - 1 ? 'Bắt đầu thôi!' : 'Tiếp';
  $('#tut-step').textContent = `${step + 1}/${STEPS.length}`;
  $('#tut').hidden = false; shownAt = performance.now();
  if (s.target) { const el = document.querySelector<HTMLElement>(s.target); if (el) { el.classList.add('tut-target'); el.scrollIntoView({block: 'center', behavior: 'smooth'}); } }
}

/** called every frame: moves on when the current step is done, keeps the highlight on the right element */
export function tutorialTick() {
  if (step < 0 || !S) return;
  const s = STEPS[step];
  const visible = S.phase === s.phase || (s.phase === 'open' && S.phase === 'paused');
  $('#tut').hidden = !visible || !$('#daily').hidden || !$('#opening').hidden;
  if (s.done()) { step++; if (step >= STEPS.length) finish(); else show(); return; }
  // elements get re-rendered (tiles, buttons): keep the highlight on
  if (visible && s.target && performance.now() - shownAt > 300) {
    const el = document.querySelector<HTMLElement>(s.target);
    if (el && !el.classList.contains('tut-target')) { clearHighlight(); el.classList.add('tut-target'); }
  }
}

$('#tut-next').addEventListener('click', () => { audio(); sfx.click(); step++; if (step >= STEPS.length) finish(); else show(); });
$('#tut-skip').addEventListener('click', () => { audio(); finish(); });

/** Bơ's face for the tutorial card */
export function boFace() {
  const cv = document.createElement('canvas'); cv.width = 16; cv.height = 16; const c = cv.getContext('2d');
  const ear = (cx: number) => (x: number, y: number) => y > 2 && y < 7 && Math.abs(x - cx) <= (y - 2) * .6;
  blit(c, 0, 0, 16, 16, ear(4.5), '#F4AA55', OUT); blit(c, 0, 0, 16, 16, ear(11.5), '#F4AA55', OUT);
  blit(c, 0, 0, 16, 16, (x, y) => inEll(x, y, 8, 10, 6.4, 5), (x, y) => (x + Math.floor(y / 2)) % 4 === 0 && y < 9 ? '#E08A34' : '#F4AA55', OUT);
  px(c, 5, 10, 2, 1, OUT); px(c, 9, 10, 2, 1, OUT); px(c, 7, 11, 2, 1, '#E8788F'); px(c, 3, 11, 1, 1, '#F7A8BC'); px(c, 12, 11, 1, 1, '#F7A8BC');
  return cv.toDataURL();
}
