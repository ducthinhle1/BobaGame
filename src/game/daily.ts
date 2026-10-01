import {DAILY_GIFTS,TEAS} from '../data';
import {dayKey,giftIndex,nextStreak} from '../logic/streak';
import {track} from './analytics';
import {audio,meow,sfx} from './audio';
import {$,persist,save,unlocked} from './core';
import {mmsg,renderMarket} from './day';

let pending: number | null = null;

/** called when the market opens: shows the gift once per calendar day */
export function checkDaily() {
  const s = nextStreak(save.login, new Date());
  if (s === null) return;
  pending = s;
  const idx = giftIndex(s);
  $('#dl-streak').textContent = s > 1 ? `Chuỗi ${s} ngày liền 🔥` : 'Ngày đầu tiên';
  $('#dl-track').innerHTML = DAILY_GIFTS.map((gf, i) => `<div class="dl-day${i < idx ? ' got' : i === idx ? ' today' : ''}"><span>Ngày ${i + 1}</span><b>${gf.label}</b></div>`).join('');
  $('#dl-note').textContent = 'Quay lại ngày mai để chuỗi tiếp tục. Bỏ một ngày thì chuỗi bắt đầu lại.';
  $('#daily').hidden = false; $('#dl-ok').focus();
}

function claim() {
  if (pending === null) return;
  const s = pending, gift = DAILY_GIFTS[giftIndex(s)];
  pending = null;
  save.login = {last: dayKey(new Date()), streak: s};
  if (gift.money) save.wallet += gift.money;
  if (gift.teas) unlocked(TEAS).forEach(t => save.pantry[t.id] = (save.pantry[t.id] || 0) + gift.teas);
  if (gift.pantry) for (const k in gift.pantry) save.pantry[k] = (save.pantry[k] || 0) + gift.pantry[k];
  let msg = `Đã nhận quà: ${gift.label}.`;
  if (gift.cat) {
    if (!(save.cats || []).includes(gift.cat)) save.cats = [...(save.cats || []), gift.cat];
    else { save.wallet += 100; msg += ' Bé Hoàng Tử đã là bạn rồi nên tặng thêm 100k.'; }
  }
  persist(); track('daily', {streak: s});
  sfx.win(); meow(1.25, .04, .3);
  $('#daily').hidden = true; renderMarket(); mmsg(msg);
}
$('#dl-ok').addEventListener('click', () => { audio(); claim(); });
