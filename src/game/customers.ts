import type {Customer,Look} from '../types';
import type {SeasonId} from '../logic/season';
import {EVENTS,REGULARS,SEASONS,TEAS,TOPS,TYPES} from '../data';
import {seasonOf} from '../logic/season';
import {keys,sfx} from './audio';
import {W,feat,has,maxTops,persist,pick,placeInfo,save,seasonTea,shuffle,staffOn,unlocked} from './core';
import {cozyEffect} from './decor';
import {renderTickets,updateHud} from './orders';
import {floatText,hint} from './serve';
import {S} from './state';

/* ---------- customers ---------- */
/* ---------- daily events, seasons and regulars ---------- */
/** today's season (real calendar); add ?season=halloween (etc.) to the page address to preview another */
export const season:SeasonId|null=(()=>{const q=new URLSearchParams(location.search).get('season');if(q&&SEASONS[q])return q as SeasonId;if(q==='none')return null;return seasonOf(new Date())})();
export function ev(){return EVENTS[save.event&&save.eventDay===save.day?save.event:'normal']||EVENTS.normal}
export function tipBoost(){return ev().tip*(season?SEASONS[season].tip:1)*cozyEffect().tip*(has('paint')?1.05:1)*(has('fan')?1.05:1)}
/** cart/kiosk upgrades that bring customers in faster */
export function spawnBoost(){return (has('bell')?1.1:1)*(has('radio')?1.1:1)}
export function rollEvent(day){
  if(day<3)return'normal';
  const keys=Object.keys(EVENTS).filter(k=>k==='normal'||k!==save.lastEvent);
  let x=Math.random()*keys.reduce((a,k)=>a+EVENTS[k].w,0);
  for(const k of keys){x-=EVENTS[k].w;if(x<=0)return k}return'normal';
}
export function friendOf(id){save.friends=save.friends||{};return save.friends[id]||(save.friends[id]={met:false,hearts:0,gift:false})}
export function canMake(o){return save.owned.includes(o.tea)&&o.tops.every(t=>save.owned.includes(t))}
export function befriend(c){
  const r=REGULARS.find(x=>x.id===c.friend),f=friendOf(c.friend);
  if(!f.met){f.met=true;floatText(c.slot,'Bạn mới!','streak');hint(`Làm quen với ${r.name}! Xem trong Sổ khách quen ở chợ.`)}
  if(f.hearts<5){f.hearts++;setTimeout(()=>floatText(c.slot,`♥ ${f.hearts}/5`,'good'),350)}
  if(f.hearts===3&&!f.story){f.story=true;hint(`Bạn đã thân hơn với ${r.name}. Câu chuyện của họ đã mở trong Sổ khách quen.`)}
  if(f.hearts===5&&!f.gift){f.gift=true;S.cash+=120;save.xp+=30;hint(`${r.gift} +120k và +30 XP!`);sfx.win();updateHud()}
  persist();
}
export function pickType(){
  if(feat('online')&&Math.random()<Math.min(.5,Math.min(.28,.1+.02*S.day)*ev().online))return 'online';
  const r=Math.random()*100;
  if(!has('catbed'))return r<68?'regular':r<88?'rush':'picky';
  return r<55?'regular':r<77?'rush':r<92?'picky':'cat';
}
export function makeLook(type):Look{
  if(type==='cat')return{fur:pick(['#F2A541','#E8E0D0','#6A6478','#C08A5B']),shirt:pick(['#6FA8E8','#E86A6A','#7ED6B8'])};
  let style=type==='online'?'short':pick(['short','bob','bun','long','cap','spiky']);
  return{skin:pick(['#F3CDAA','#E2AD83','#C68863','#8D5A3B']),hair:pick(['#2A1E1A','#4A2E22','#7A4A2A','#C9A15A','#3B2F5A','#9E4A3A']),
    style,cap:pick(['#E86A6A','#6FA8E8','#F2A541']),shirt:type==='online'?'#F58DA6':type==='rush'?pick(['#DCE3EE','#C9D6E8']):pick(['#E86A6A','#7ED6B8','#6FA8E8','#F2A541','#B79BD6','#5C8F5A','#E4D3B0'])};
}
export function genOrder(type){
  const st=seasonTea(),t=st&&Math.random()<.3?st:pick(unlocked(TEAS));
  let n=pick(maxTops()===1?[0,1,1]:[0,1,1,2]);
  let tops=shuffle(unlocked(TOPS).map(x=>x.id)).slice(0,Math.min(n,maxTops()));
  if(type==='cat'&&!tops.includes('pearl'))tops=['pearl',...tops].slice(0,maxTops());
  const qty=type==='online'?2+(S.day>=3&&Math.random()<.5?1:0):type!=='cat'&&feat('multi')&&Math.random()<.16?2:1;
  return{tea:t.id,sugar:pick([0,30,50,50,70,70,100]),ice:ev().iceHeavy?pick([1,2,2,2]):pick([0,1,1,2,2]),tops,qty};
}
export function spawn(force?){
  const free=[0,1,2].filter(i=>!S.slots[i]&&i<placeInfo().slots);
  if(!free.length)return false;
  const slot=pick(free),type=force||pickType(),pat=ev().pat*TYPES[type].patience*Math.max(.62,1-.07*(S.day-1))*(has('lights')?1.2:1)*(staffOn('tu')?1.15:1)*cozyEffect().patience*(has('parasol')?1.08:1)*(has('garland')?1.08:1);
  let order=genOrder(type),look=makeLook(type),friend=null;
  // sometimes a regular walks in and orders their favourite
  if(type==='regular'&&Math.random()<.35){
    const here=S.customers.map(c=>c.friend);
    const r=pick(REGULARS.filter(r=>canMake(r.fav)&&!here.includes(r.id)).concat([null]));
    if(r){friend=r.id;order={...r.fav,tops:[...r.fav.tops],qty:1};look={...r.look,cap:r.look.cap||'#F58DA6'}}
  }
  if(type==='reviewer'){order.qty=1;look.shades=true}
  const pat2=pat*1.3+(order.qty-1)*12;
  const c:Customer={friend,no:++S.orderNo,id:S.nextId++,slot,type,look,order,x:W+12,state:'walk',pat:pat2,maxPat:pat2,result:null,bubbleT:0,bagged:0,perfectCups:0,qmSum:0};
  if(type==='online'&&!S.onlineShown){S.onlineShown=true;setTimeout(()=>{if(S.phase==='open')hint(`Đơn online! Shipper cần ${order.qty} ly: pha ly đầu, cho vào túi, rồi “Pha y chang” cho đủ. Đủ ly là túi tự đóng.`)},900)}
  S.slots[slot]=c;S.customers.push(c);renderTickets();return true;
}
export function leave(c,result){
  c.state='leave';c.result=result;c.bubbleT=1;
  if(S.slots[c.slot]===c)S.slots[c.slot]=null;
  renderTickets();
}
