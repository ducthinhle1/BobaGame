import {QUAL,TYPES} from '../data';
import {countErrors,judge} from '../logic/cup';
import {bagTip,cupTip} from '../logic/economy';
import {beep,meow,sfx} from './audio';
import {$,SLOTS,W,has,orderPrice,save,sealNeeded,tea,useGear} from './core';
import {befriend,friendOf,leave,tipBoost} from './customers';
import {coins,liftCup,puff,shake,sparkle} from './fx';
import {renderTickets,updateHud} from './orders';
import {checkQuests} from './quests';
import {S,cup,emptyCup,setCup} from './state';
import {cupChanged} from './station';

/* ---------- serving ---------- */
export function serve(slot){
  if(S.phase!=='open')return;
  const c=S.slots[slot];if(!c||c.state!=='wait')return;
  const o=c.order,T=TYPES[c.type],qty=o.qty||1;
  if(c.bagT>0)return;
  if(qty>1&&c.bagged>=qty){bagUp(slot);return}
  if(!cup.tea){hint(qty>1?`Đơn này cần ${qty} ly giống nhau: pha từng ly rồi cho vào túi.`:'Hãy rót trà trước đã.');sfx.nope();return}
  // sealing is part of serving: one tap seals (uses a film) and hands the cup over
  if(!cup.sealed){if(!useGear('film'))return;cup.sealed=true;if(sealNeeded())beep(140,.06,'square',.04)}
  if(!useGear('straw'))return;
  const err=countErrors(cup,o),verdict=judge(err,T.strict);
  const price=Math.round(orderPrice(o)*T.pay);
  liftCup();
  const carry={color:tea(cup.tea).color,pearls:cup.tops.includes('pearl'),foam:cup.tops.includes('foam')};
  if(qty>1){
    const qmc=QUAL[cup.teaQ||'good'].mul*(cup.tops.includes('pearl')?QUAL[cup.pearlQ||'good'].mul:1);
    if(verdict!=='wrong'){
      c.bagged++;S.focus=c.id;S.focusManual=true;if(c.bagged<qty)S.repeat={cid:c.id,tea:cup.tea,sugar:cup.sugar,ice:cup.ice,tops:[...cup.tops]};if(verdict==='perfect'){c.perfectCups++;c.qmSum+=qmc;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak)}else S.streak=0;
      floatText(slot,`${c.bagged}/${qty} ly`,'good');sfx.ok();beep(420,.12,'triangle',.04,260,.08);
      if(c.bagged<qty)hint(`Đã cho vào túi ${c.bagged}/${qty}. Bấm “Pha y chang” để rót ly tiếp theo.`);
      else bagUp(slot); // last cup in: the bag closes and goes out by itself
    }else{
      S.streak=0;c.pat=Math.max(1,c.pat-c.maxPat*.2);floatText(slot,'Sai món','bad');sfx.fail();shake();
      hint(T.strict?'Khách khó tính muốn đúng từng chi tiết. Ly này phải bỏ.':`Ly này sai ${err} chỗ nên phải bỏ. Pha lại ly khác nhé.`);
    }
    setCup(emptyCup());cupChanged();renderTickets();updateHud();checkQuests();return;
  }
  if(verdict==='perfect'){
    S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);
    const qm=QUAL[cup.teaQ||'good'].mul*(cup.tops.includes('pearl')?QUAL[cup.pearlQ||'good'].mul:1);
    const close=c.friend&&friendOf(c.friend).hearts>=3?1.5:1;
    const tip=cupTip({typeTip:T.tip,patience:c.pat/c.maxPat,streak:S.streak,quality:qm,tipJar:has('tipjar'),boost:tipBoost(),close});
    save.xp+=5;
    S.cash+=price+tip;S.tips+=tip;S.perfect++;S.served++;
    leave(c,'love');c.carry=carry;floatText(slot,`+${price+tip}k`,'good');sfx.win();
    sparkle(c.x,44);coins(c.x,Math.min(7,Math.ceil(tip/3)));
    if([3,5,10,15,20].includes(S.streak))floatText(slot,`Chuỗi ×${S.streak}!`,'streak');
    if(c.type==='cat')meow(1.35,.06,.2);
    if(c.friend)setTimeout(()=>befriend(c),500);
    if(c.type==='reviewer'){S.cash+=150;save.xp+=40;setTimeout(()=>{floatText(slot,'Review 5 sao!','streak');hint('Reviewer khen tiệm hết lời! Thưởng +150k và +40 XP.')},700);updateHud()}
    hint((S.streak>=3?`Hoàn hảo! Chuỗi ×${S.streak}, tip +50%.`:c.type==='cat'?'Bé mèo ưng lắm. Trả gấp đôi!':'Ly hoàn hảo!')+(qm>1?' Nguyên liệu ngon, tip nhiều hơn.':qm<1?' Khách thấy vị chưa chuẩn, tip ít.':''));
  }else if(verdict==='close'){
    S.cash+=price;S.served++;S.streak=0;save.xp+=2;
    leave(c,'ok');c.carry=carry;floatText(slot,`+${price}k`);sfx.ok();hint('Gần đúng. Sai một chỗ nên không có tip.');
  }else{
    S.streak=0;S.missed++;leave(c,'angry');floatText(slot,'Từ chối','bad');checkQuests();sfx.fail();puff(c.x,40);shake();
    hint(T.strict?'Khách khó tính muốn đúng từng chi tiết.':`Sai ${err} chỗ. Khách bỏ đi rồi.`);
  }
  if(verdict!=='wrong'){if(carry.pearls)S.q.pearl++;S.q.tea[cup.tea]=(S.q.tea[cup.tea]||0)+1;if(c.type==='cat')S.q.cat++;if(verdict==='perfect'&&c.type==='picky')S.q.picky++}
  setCup(emptyCup());cupChanged();updateHud();checkQuests();
}
export function bagUp(slot){
  const c=S.slots[slot];if(!c||c.bagT>0)return;
  if(!useGear('bag'))return;
  // closing a bag takes a moment but doesn't block the counter: keep making the next drink meanwhile
  c.bagT=.45;beep(300,.2,'triangle',.04,200);beep(500,.08,'square',.025,null,.3);hint('Đủ ly rồi, đang đóng túi giao cho khách…');renderTickets();
}
export function finishBag(slot){
  const c=S.slots[slot];if(!c||c.state!=='wait')return;
  const o=c.order,T=TYPES[c.type],qty=o.qty,allPerfect=c.perfectCups===qty;
  const price=Math.round(orderPrice(o)*T.pay*qty),qmAvg=c.perfectCups?c.qmSum/c.perfectCups:1;
  const tip=bagTip({typeTip:T.tip,patience:c.pat/c.maxPat,streak:S.streak,quality:qmAvg,tipJar:has('tipjar'),boost:tipBoost()},c.perfectCups);
  save.xp+=3*c.perfectCups+2;
  S.cash+=price+tip;S.tips+=tip;S.perfect+=c.perfectCups;S.served+=qty;
  leave(c,allPerfect?'love':'ok');c.carry={bag:true};
  floatText(slot,`+${price+tip}k`,'good');sfx.win();sparkle(c.x,44);if(tip)coins(c.x,Math.min(7,Math.ceil(tip/3)));
  hint(c.type==='online'?`Shipper nhận túi ${qty} ly và chạy đi giao. +${price+tip}k!`:`Giao túi ${qty} ly cho khách. +${price+tip}k!`);
  if(o.tops.includes('pearl'))S.q.pearl+=qty;S.q.tea[o.tea]=(S.q.tea[o.tea]||0)+qty;if(allPerfect&&c.type==='picky')S.q.picky++;
  cup.level=cup.level;updateHud();checkQuests();
}
export function floatText(slot,text,cls=''){
  const el=document.createElement('span');el.className='float '+cls;el.textContent=text;
  el.style.left=(SLOTS[slot]/W*100)+'%';$('#floats').appendChild(el);setTimeout(()=>el.remove(),1200);
}
export let hintT=0;
export function hint(t,sticky?){$('#hint').textContent=t;hintT=t?(sticky?999:3.5):0}
export function tickHint(dt){if(hintT>0){hintT-=dt;if(hintT<=0)$('#hint').textContent=''}}
