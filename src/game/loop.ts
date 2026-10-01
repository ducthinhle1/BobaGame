import {PEARL_BATCH,RUSH,SUPPLY} from '../data';
import {beep,meow,sfx} from './audio';
import {drawCup,drawScene,updateCats} from './cats';
import {DAY_LEN,SLOTS,addBatch,feat,packOf,save,staffOn,stockName,teaBatch} from './core';
import {ev,leave,spawn,spawnBoost} from './customers';
import {endDay} from './day';
import {chimeTinkle} from './decor';
import {drawLifted,drawParts,drawSign,puff,updateParts} from './fx';
import {naWork,renderTickets,ticketRefs,updateBars,updateHud} from './orders';
import {drawMini,updateMini} from './prep';
import {checkQuests} from './quests';
import {finishBag,floatText,hint,serve,tickHint} from './serve';
import {S,cup} from './state';
import {cupChanged,hoaWork,rebrew,syncBadges,syncGear} from './station';
import {updateVisitor} from './visitors';

/* ---------- loop ---------- */
export let last=performance.now(),spawnWait=0;
export function update(dt){
  S.time+=dt;
  if(S.time>=DAY_LEN){endDay();return}
  for(const id in S.brewing){
    S.brewing[id]-=dt;
    if(S.brewing[id]<=0){delete S.brewing[id];addBatch(id,id==='pearl'?PEARL_BATCH:teaBatch(),'good');hint(`${stockName(id)} đã sẵn sàng.`);sfx.bell()}
  }
  for(const id in S.delivering){
    S.delivering[id]-=dt;
    if(S.delivering[id]<=0){
      delete S.delivering[id];const it=SUPPLY.find(x=>x.id===id);
      save.pantry[id]=(save.pantry[id]||0)+packOf(it);sfx.bell();hint(`Shipper giao ${it.name} tới rồi!`);syncGear();
      if(S.stock[id]&&!S.brewing[id])rebrew(id,'auto');
    }
  }
  if(Object.keys(S.brewing).length||Object.keys(S.delivering).length||S.time<.05)syncBadges();
  // Chị Hoa keeps what you've brewed today topped up
  if(Math.random()<dt/15)chimeTinkle();
  updateVisitor(dt);
  if(staffOn('hoa')){S.hoaT-=dt;if(S.hoaT<=0){S.hoaT=.4;hoaWork()}}
  if(S.sealT>0){S.sealT-=dt;if(S.sealT<=0){S.sealT=0;cup.sealed=true;cupChanged();beep(160,.07,'square',.05);beep(110,.12,'square',.05,null,.06)}}
  S.slots.forEach((c,i)=>{if(c&&c.bagT>0){c.bagT-=dt;if(c.bagT<=0){c.bagT=0;finishBag(i);renderTickets()}}});
  // Bé Na pours tea, sugar and ice for the ticket you asked about
  if(staffOn('na'))naWork(dt);
  // Anh Tú carries out any cup that matches a ticket
  if(S.autoServe){S.autoServe.t-=dt;if(S.autoServe.t<=0){const i=S.autoServe.slot;S.autoServe=null;const r=ticketRefs[i];if(r&&r.ready){S.perks.tu++;serve(i)}}}
  // rush hour: customers pour in for 30 seconds mid-shift
  const rush=feat('rush')&&S.time>RUSH[0]&&S.time<RUSH[1];
  if(rush&&!S.rushShown){S.rushShown=true;floatText(1,'Giờ cao điểm!','streak');hint('Giờ cao điểm! Khách kéo đến đông gấp đôi trong 30 giây.');[660,880,660,880].forEach((f,i)=>beep(f,.09,'square',.03,null,i*.12))}
  S.spawnT-=dt;
  if(S.spawnT<=0&&S.time<DAY_LEN-8){
    S.spawnT=spawn()?(5+Math.random()*4)*Math.max(.55,1-.08*(S.day-1))*(rush?.45:1)/ev().spawn/spawnBoost():1;
  }
  if(save.event==='review'&&save.eventDay===S.day&&!S.reviewerCame&&S.time>40&&S.slots.some(x=>!x)){S.reviewerCame=true;spawn('reviewer');hint('Reviewer đã tới! Pha thật hoàn hảo nhé.');[880,1100,1320].forEach((f,i)=>beep(f,.1,'triangle',.04,null,i*.1))
  }
  let changed=false;
  for(const c of S.customers){
    if(c.state==='walk'){c.x-=40*dt;if(c.x<=SLOTS[c.slot]){c.x=SLOTS[c.slot];c.state='wait';sfx.bell();if(c.type==='cat')meow(1.3,.05,.15);changed=true}}
    else if(c.state==='wait'){c.pat-=dt;if(c.pat<=0){c.pat=0;S.missed++;S.streak=0;leave(c,'angry');checkQuests();puff(c.x,40);floatText(c.slot,'Bỏ về!','bad');sfx.fail();hint('Một vị khách chờ lâu quá nên bỏ về.');updateHud()}}
    else{c.bubbleT-=dt;if(c.bubbleT<=0)c.x-=46*dt}
  }
  S.customers=S.customers.filter(c=>c.x>-14);
  if(changed)renderTickets();
  tickHint(dt);
}
export let animT=0;
export function loop(ts){
  const dt=Math.min(.05,(ts-last)/1000);last=ts;
  const paused=S.phase==='paused';
  if(!paused)animT+=dt;
  const t=animT;
  if(S.phase==='open'){
    update(dt);
    if(S.washT>0){S.washT-=dt;document.body.classList.toggle('is-washing',S.washT>0)}
  }
  else if(S.phase==='prep'){updateMini(dt);drawMini(t)}
  else if(S.phase==='closed'){for(const c of S.customers){c.bubbleT-=dt;if(c.bubbleT<=0)c.x-=46*dt}S.customers=S.customers.filter(c=>c.x>-14)}
  if(!paused&&cup.tea&&cup.level<1)cup.level=Math.min(1,cup.level+dt*2.8);
  document.body.classList.toggle('in-shift',S.phase==='open'||S.phase==='paused');
  if(!paused){updateParts(dt);updateCats(dt)}
  drawScene(t);drawSign(t,dt);drawParts();drawCup();drawLifted(paused?0:dt);updateBars();
  if(S.phase==='open')updateHud();
  requestAnimationFrame(loop);
}
