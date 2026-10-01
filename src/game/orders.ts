import type {Customer} from '../types';
import {ICES,REGULARS,TYPES} from '../data';
import {matchParts} from '../logic/cup';
import {moodOf} from '../logic/economy';
import {audio,sfx} from './audio';
import {$,DAY_LEN,OUT,dayGoal,levelOf,orderPrice,save,sealNeeded,staffOn,stockN,takeServing,tea,top,useGear} from './core';
import {friendOf} from './customers';
import {MOODS,blit,faceURL,inEll,px} from './draw';
import {parts} from './fx';
import {hint,serve} from './serve';
import {S,cup} from './state';
import {cupChanged,syncAgain,syncBadges} from './station';

/* ---------- tickets ---------- */
/** the hidden order tickets, one per counter slot (null when empty); the counter UI reads its state from here */
export interface TicketRef{c:Customer;el:HTMLElement;bar:HTMLElement;fill:HTMLElement;face:HTMLImageElement;mood:string|null;ask:HTMLElement|null;tags:HTMLElement;sec:HTMLElement;tagKey:string;ready?:boolean}
export let ticketRefs:(TicketRef|null)[]=[];export const seenTickets=new Set();
export function serveLabel(c){const q=c.order.qty||1;if(q===1)return'Phục vụ';if(c.bagT>0)return'Đang đóng túi…';return c.bagged>=q?'Đóng túi & giao':`Cho vào túi ${c.bagged}/${q}`}
/* ---------- new bar: waiting-customer avatars and the order speech bubble ---------- */
export const picCache=new Map();
export function portraitURL(c){
  if(picCache.has(c.id))return picCache.get(c.id);
  const cv=document.createElement('canvas');cv.width=16;cv.height=16;const k=cv.getContext('2d'),L=c.look;
  if(c.type==='cat'){
    const ear=cx=>(x,y)=>y>1&&y<6&&Math.abs(x-cx)<=(y-1)*.6;
    blit(k,0,0,16,16,ear(4.5),L.fur,OUT);blit(k,0,0,16,16,ear(11.5),L.fur,OUT);
    blit(k,0,0,16,16,(x,y)=>inEll(x,y,8,9.5,6.2,5.2),L.fur,OUT);
    px(k,5,9,1,2,OUT);px(k,10,9,1,2,OUT);px(k,7,11,2,1,'#E88A8A');px(k,1,11,3,1,OUT);px(k,12,11,3,1,OUT);px(k,4,4,1,1,'#E88A8A');px(k,11,4,1,1,'#E88A8A');
  }else{
    blit(k,0,0,16,16,(x,y)=>y>12&&Math.abs(x-8)<=4.5+(y-12)*.6,L.shirt,OUT);
    if(L.style==='bun')blit(k,0,0,16,16,(x,y)=>inEll(x,y,8,1.8,2.6,2),L.hair,OUT);
    if(L.style==='long')blit(k,0,0,16,16,(x,y)=>y>4&&y<14&&x>2.5&&x<13.5,L.hair,OUT);
    blit(k,0,0,16,16,(x,y)=>inEll(x,y,8,7.5,4.8,4.6),(x,y)=>y<5.6||((L.style==='bob'||L.style==='long')&&(x<4.4||x>11.6)&&y<10.5)?L.hair:L.skin,OUT);
    if(c.type==='online'){blit(k,0,0,16,16,(x,y)=>inEll(x,y,8,7.5,5.4,5)&&y<6.8,'#F58DA6',OUT);px(k,3,6,10,1,'#3B2A2D')}
    else if(L.style==='cap'){px(k,3,3,10,2,L.cap||'#F58DA6');px(k,10,5,4,1,L.cap||'#F58DA6')}
    else if(L.style==='spiky')[[5,2],[8,1],[11,2]].forEach(([x,y])=>px(k,x,y,1,1,L.hair));
    px(k,6,8,1,1,OUT);px(k,10,8,1,1,OUT);px(k,7,10,3,1,'#C45A77');px(k,5,9,1,1,'#F7A8BC');px(k,11,9,1,1,'#F7A8BC');
    if(L.glasses||c.type==='picky'){px(k,5,7,3,1,OUT);px(k,9,7,3,1,OUT);px(k,5,9,3,1,OUT);px(k,9,9,3,1,OUT)}
    if(L.shades||c.type==='reviewer'){px(k,5,7,3,2,OUT);px(k,9,7,3,2,OUT);px(k,8,7,1,1,OUT)}
    if(c.type==='rush'){px(k,7,13,2,3,'#C94A4A')}
  }
  const u=cv.toDataURL();picCache.set(c.id,u);return u;
}
export function speech(c){
  const o=c.order,t=tea(o.tea),q=o.qty||1,ice=['không đá','ít đá','đá vừa'][o.ice];
  const tops=o.tops.length?`thêm <b data-f="tops">${o.tops.map(x=>top(x).name.toLowerCase()).join(' và ')}</b>`:'<b data-f="tops">không topping</b>';
  const parts=`<b class="tea" data-f="tea">${q>1?q+' ly ':''}${t.name}</b>, <b data-f="sugar">${o.sugar}% đường</b>, <b data-f="ice">${ice}</b>, ${tops}`;
  if(c.friend)return `Như mọi khi nha: ${parts}!`;
  return ({regular:`Cho em ${q>1?'':'1 ly '}${parts} nha!`,rush:`Nhanh giúp mình với: ${parts}!`,picky:`Làm đúng y chang nhé: ${parts}.`,
    cat:`Meo~ ${parts}. Meo!`,online:`Đơn MèoShip: ${parts}.`,reviewer:`Cho tôi thử ${parts}.`})[c.type]||`Cho em ${parts} nha!`;
}
export let counterKey='';
export function renderCounter(){
  const live=ticketRefs.filter(Boolean),b=$('#bubble');if(!b)return;
  const key=live.map(r=>r.c.id).join(',')+'|'+S.focus+'|'+live.map(r=>r.c.bagged).join(',')+'|'+(S.naJob?1:0)+'|'+S.phase;
  if(key===counterKey)return;counterKey=key;
  const r=live.find(x=>x.c.id===S.focus)||live[0];
  if(!r){b.innerHTML=`<div class="bub-empty">${S.phase==='open'?'Đang chờ khách ghé tiệm…':'Tiệm chưa mở cửa.'}</div>`;return}
  const chips=live.slice().sort((a,b2)=>a.c.no-b2.c.no).map(x=>`<button class="qav${x===r?' on':''}" type="button" data-cid="${x.c.id}" aria-label="Chọn khách số ${x.c.no}">
      <svg viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="17" class="qbg"/><circle cx="20" cy="20" r="17" class="qring" pathLength="100"/></svg>
      <img src="${portraitURL(x.c)}" alt=""><b>${x.c.no}</b></button>`).join('');
  const c=r.c,T=TYPES[c.type],o=c.order,q2=o.qty||1,label=c.friend?REGULARS.find(x=>x.id===c.friend).name+' '+'♥'.repeat(friendOf(c.friend).hearts):T.label;
  b.innerHTML=`<div class="bub-box" data-type="${c.type}">
      <div class="bub-meta"><span class="queue" id="queue">${chips}</span><span class="t-type ${c.friend?'friend':c.type}">${label}</span><span class="bub-price">${Math.round(orderPrice(o)*T.pay*q2)}k</span></div>
      <p class="bub-say">${speech(c)}</p>
      <div class="bub-foot">${q2>1?`<span class="bub-bag">Túi ${c.bagged}/${q2}</span>`:''}<img class="mood" alt="" width="18" height="18"><div class="pat"><i></i></div><span class="t-sec"></span>${staffOn('na')?'<span class="ask na"></span>':''}</div>
    </div>`;
}
$('#bubble').addEventListener('click',e=>{const a=(e.target as HTMLElement).closest<HTMLElement>('.qav');if(!a)return;audio();S.focus=+a.dataset.cid;S.focusManual=true;sfx.click();renderTickets()});
export function tickCounter(){
  if(!document.body.classList.contains('bar-new'))return;
  const live=ticketRefs.filter(Boolean);
  document.querySelectorAll<HTMLElement>('#queue .qav').forEach(a=>{const r=live.find(x=>x.c.id===+a.dataset.cid);if(!r)return;const f=Math.max(0,r.c.pat/r.c.maxPat);
    const ring=a.querySelector<SVGElement>('.qring');ring.style.strokeDashoffset=String(100-f*100);ring.style.stroke=f>.5?'#2F9A6C':f>.25?'#D98A1E':'#D9435C';a.classList.toggle('hot',f<.25)});
  const b=$('#bubble'),r=live.find(x=>x.c.id===S.focus)||live[0];if(!r||!b.querySelector<HTMLElement>('.bub-box'))return;
  const f=Math.max(0,r.c.pat/r.c.maxPat),o=r.c.order;
  const fill=b.querySelector<HTMLElement>('.pat i'),bar=b.querySelector<HTMLElement>('.pat');fill.style.width=f*100+'%';bar.classList.toggle('warn',f<.5&&f>=.25);bar.classList.toggle('bad',f<.25);
  const sec=Math.ceil(r.c.pat)+'s',se=b.querySelector<HTMLElement>('.t-sec');if(se.textContent!==sec)se.textContent=sec;
  const m=moodOf(f),mi=b.querySelector<HTMLImageElement>('.mood');if(mi.dataset.m!==m){mi.dataset.m=m;mi.src=faceURL(m)}
  const ok=matchParts(cup,o);
  b.querySelectorAll<HTMLElement>('[data-f]').forEach(el=>el.classList.toggle('ok',ok[el.dataset.f]));
  const ask=b.querySelector<HTMLElement>('.ask');if(ask){const lab=naLabel();if(ask.textContent!==lab)ask.textContent=lab;ask.classList.toggle('busy',!!S.naJob)}
}
export function syncFocus(){
  const el=$('#focus');if(!el)return;
  const r=ticketRefs.find(x=>x&&x.c.id===S.focus);
  if(!r||S.phase!=='open'){el.hidden=true;return}
  const o=r.c.order,t=tea(o.tea);
  el.hidden=false;
  el.innerHTML=`<b>Đang làm #${r.c.no}</b><span><i class="sw" style="background:${t.color}"></i>${t.short}${(o.qty||1)>1?' ×'+o.qty:''} · ${o.sugar}% đường · ${ICES[o.ice]}${o.tops.length?' · '+o.tops.map(x=>top(x).short).join(', '):''}</span>`;
}
// the big button serves: a ticket the finished cup matches (the chosen one first), else the chosen ticket
export function targetSlot(){
  const live=ticketRefs.map((r,i)=>r?{r,i}:null).filter(Boolean);if(!live.length)return -1;
  const full=x=>(x.r.c.order.qty||1)>1&&x.r.c.bagged>=x.r.c.order.qty,foc=live.find(x=>x.r.c.id===S.focus);
  if(cup.tea){const ready=live.filter(x=>x.r.ready&&!full(x));if(foc&&ready.includes(foc))return foc.i;if(ready.length){const part=ready.find(x=>x.r.c.bagged>0);if(part)return part.i;return ready.sort((a,b)=>a.r.c.pat-b.r.c.pat)[0].i}}
  if(foc)return foc.i;
  return live[0].i;
}
export function syncServeBtn(){
  const b=$<HTMLButtonElement>('#serveBig');if(!b||!S)return;
  const i=S.phase==='open'||S.phase==='paused'?targetSlot():-1,r=i>=0?ticketRefs[i]:null;
  let lab='Chờ khách',state='';
  if(r){const c=r.c,q=c.order.qty||1,full=q>1&&c.bagged>=q;
    const seal=sealNeeded()&&!!cup.tea&&!cup.sealed?'Dán nắp & ':'';
    lab=c.bagT>0?'Đang đóng túi…':full?`Đóng túi & giao #${c.no}`:q>1?`${seal}cho vào túi #${c.no} · ${c.bagged}/${q}`:`${seal}phục vụ #${c.no}`;
    lab=lab[0].toUpperCase()+lab.slice(1);
    state=full?'bag':r.ready?'ready':''}
  if($('#serveLab').textContent!==lab)$('#serveLab').textContent=lab;
  b.className='serveBig'+(state?' '+state:'');b.disabled=!r;
}
export function serveTarget(){audio();const i=targetSlot();if(i<0){hint('Chưa có khách nào chờ.');return}serve(i)}
$('#serveBig').addEventListener('click',serveTarget);
export function renderTickets(){
  const box=$('#tickets');box.innerHTML='';ticketRefs=[];
  for(let i=0;i<3;i++){
    const c=S.slots[i],el=document.createElement('div');
    if(!c||c.state!=='wait'){
      el.className='ticket empty';el.textContent=c?'Khách đang tới…':S.phase==='open'?'Chỗ trống':'—';box.appendChild(el);ticketRefs.push(null);continue;
    }
    const o=c.order,t=tea(o.tea),T=TYPES[c.type];
    el.className='ticket'+(seenTickets.has(c.id)?'':' new');seenTickets.add(c.id);
    el.dataset.type=c.type;if(S.focus===c.id)el.classList.add('focus');
    el.innerHTML=`<div class="t-head"><span class="t-id"><i class="who" style="background:${c.look.shirt}"></i><b>#${c.no}</b></span><span class="t-type ${c.friend?'friend':c.type}">${c.friend?REGULARS.find(r=>r.id===c.friend).name+' '+'♥'.repeat(friendOf(c.friend).hearts):T.label}</span><span class="t-price">${Math.round(orderPrice(o)*T.pay*(o.qty||1))}k</span></div>
      <div class="t-line tea" data-f="tea"><i class="sw" style="background:${t.color}"></i><span class="nm">${t.name}</span><span class="nm-s">${t.short}</span>${(o.qty||1)>1?`<b class="qty">×${o.qty}</b>`:''}</div>
      <div class="t-vi">${t.vi}</div>
      <div class="t-line" data-f="sugar">Đường ${o.sugar}%</div>
      <div class="t-line" data-f="ice">${ICES[o.ice]}</div>
      <div class="t-line" data-f="tops">${o.tops.length?o.tops.map(x=>'+ '+top(x).name).join('<br>'):'Không topping'}</div>
      <div class="t-tags"></div>
      <div class="moodrow"><img class="mood" alt="" width="24" height="24"><div class="pat"><i></i></div><span class="t-sec"></span></div>
      ${staffOn('na')?'<span class="ask na"></span>':''}`;
    el.addEventListener('click',e=>{if((e.target as HTMLElement).closest<HTMLElement>('button'))return;S.focus=c.id;S.focusManual=true;sfx.click();renderTickets()});
    box.appendChild(el);ticketRefs.push({c,bar:el.querySelector<HTMLElement>('.pat'),fill:el.querySelector<HTMLElement>('.pat i'),face:el.querySelector<HTMLImageElement>('.mood'),mood:null,ask:el.querySelector<HTMLElement>('.ask'),tags:el.querySelector<HTMLElement>('.t-tags'),sec:el.querySelector<HTMLElement>('.t-sec'),tagKey:'',el});
  }
  markTickets();syncFocus();syncServeBtn();renderCounter();syncAgain();
}
export function markTickets(){
  ticketRefs.forEach(r=>{if(!r)return;const o=r.c.order;
    const ok=matchParts(cup,o);
    r.el.querySelectorAll<HTMLElement>('[data-f]').forEach(l=>l.classList.toggle('ok',ok[l.dataset.f]));
    r.ready=!!cup.tea&&ok.tea&&ok.sugar&&ok.ice&&ok.tops;r.el.classList.toggle('ready',r.ready);
    r.el.classList.toggle('bagfull',(r.c.order.qty||1)>1&&r.c.bagged>=r.c.order.qty);
    if(r.ready&&staffOn('tu')&&!S.autoServe)S.autoServe={slot:ticketRefs.indexOf(r),t:.35};
  });
  coach();syncServeBtn();
}
// gentle step-by-step guidance for a brand new player's first drinks
export let coachMsg='';
export function coach(){
  if(!S||S.phase!=='open'||save.day>1||S.served+S.missed>=2)return;
  const live=ticketRefs.filter(Boolean);
  let m='';
  if(live.some(r=>r.ready))m='Khớp hết rồi! Bấm nút Phục vụ to bên dưới.';
  else if($('#again')&&!$('#again').hidden)m='Bấm “Pha y chang” để rót ly tiếp theo.';
  else if(live.length)m=cup.tea?'Giờ thêm đường, đá và topping theo order.':'Chọn trà theo order trước. Phần khớp sẽ hóa xanh.';
  if(m&&m!==coachMsg){coachMsg=m;hint(m,true)}
}
/** Bé Na: whenever the cup is empty she pours tea, sugar and ice for the order you're looking at (1 s).
 *  Touch the cup yourself or pick another customer and she simply starts over; no cooldown. */
export function naLabel(){return S.naJob?'Na đang rót…':cup.tea||cup.tops.length||cup.sugar!==null||cup.ice!==null?'Na chờ ly trống':'Na sẵn sàng'}
export function naWork(dt:number){
  const empty=!cup.tea&&cup.sugar===null&&cup.ice===null&&!cup.tops.length;
  const r=ticketRefs.find(x=>x&&x.c.id===S.focus),o=r&&r.c.order;
  if(!empty||!r||S.phase!=='open'||S.washT>0||r.c.bagT>0||stockN(o.tea)<=0||(save.pantry.cup||0)<=0){S.naJob=null;return}
  if(!S.naJob||S.naJob.cid!==r.c.id){S.naJob={cid:r.c.id,t:1};return}
  S.naJob.t-=dt;if(S.naJob.t>0)return;
  S.naJob=null;if(!useGear('cup'))return;
  S.perks.na++;cup.teaQ=takeServing(o.tea);cup.level=0;cup.tea=o.tea;cup.sugar=o.sugar;cup.ice=o.ice;sfx.pour();cupChanged();syncBadges();
}
export function updateBars(){
  syncServeBtn();renderCounter();tickCounter();
  const live=ticketRefs.filter(Boolean);
  // who came first, who is about to walk out, and which order you're working on
  const first=live.length>1?live.reduce((a,b)=>a.c.no<b.c.no?a:b):null;
  const urgent=live.filter(r=>r.c.pat/r.c.maxPat<.45).sort((a,b)=>a.c.pat-b.c.pat)[0]||null;
  if(S&&S.phase==='open'){
    const cur=live.find(r=>r.c.id===S.focus);
    const partial=r=>(r.c.order.qty||1)>1&&r.c.bagged>0;
    if(!cur||(!S.focusManual&&!cup.tea&&!partial(cur))){const pickR=live.find(partial)||urgent||first||live[0];const nf=pickR?pickR.c.id:null;if(nf!==S.focus){S.focus=nf;S.focusManual=false;live.forEach(r=>r.el.classList.toggle('focus',r.c.id===nf));syncFocus()}}
  }
  live.forEach(r=>{const key=(r===first?'f':'')+(r===urgent?'u':'');if(key!==r.tagKey){r.tagKey=key;r.tags.innerHTML=(r===first?'<span class="tag first">Đến trước</span>':'')+(r===urgent?'<span class="tag hot">Gấp!</span>':'');r.el.classList.toggle('urgent',r===urgent)}
    const sec=Math.ceil(r.c.pat)+'s';if(r.sec.textContent!==sec)r.sec.textContent=sec});
  ticketRefs.forEach(r=>{if(!r)return;
    if(r.ask){const lab=naLabel();if(r.ask.textContent!==lab)r.ask.textContent=lab}const f=Math.max(0,r.c.pat/r.c.maxPat);
    r.fill.style.width=(f*100)+'%';
    const m=moodOf(f);if(m!==r.mood){r.mood=m;r.face.src=faceURL(m);r.face.className='mood '+m;r.face.alt=MOODS[m];r.face.title=MOODS[m]}r.bar.classList.toggle('warn',f<.5&&f>=.25);r.bar.classList.toggle('bad',f<.25)});
}

/* ---------- hud ---------- */
export function updateHud(){
  $('#h-day').textContent=String(S.day);
  $('#h-lv').textContent=String(levelOf(save.xp));
  if(S.quests)$('#h-quests').textContent=`${S.quests.filter(q=>q.done).length}/${S.quests.length}`;
  const m=600+Math.floor(Math.min(1,S.time/DAY_LEN)*690);
  $('#h-clock').textContent=`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;
  $('#h-cash').textContent=S.cash+'k';
  $('#h-goallab').textContent=`Mục tiêu ${dayGoal(S.day)}k`;
  $('#h-goal').style.width=Math.min(100,S.cash/dayGoal(S.day)*100)+'%';
  $('#h-streak').textContent=S.streak>=3?`×${S.streak}`:String(S.streak);
}
