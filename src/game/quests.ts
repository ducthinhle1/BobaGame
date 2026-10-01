import {TEAS} from '../data';
import {beep,rng} from './audio';
import {$,dayGoal,has,unlocked} from './core';
import {updateHud} from './orders';
import {floatText,hint} from './serve';
import {S} from './state';

/* ---------- daily quests ---------- */
export const QUESTS=[
  {id:'perfect',w:3,make:d=>{const n=4+Math.min(8,d);return{text:`Phục vụ ${n} ly hoàn hảo`,target:n,prog:()=>S.perfect,cash:40+d*8,xp:20}}},
  {id:'streak',w:2,make:d=>{const n=Math.min(8,3+Math.floor(d/2));return{text:`Đạt chuỗi ${n} ly hoàn hảo liên tiếp`,target:n,prog:()=>S.bestStreak,cash:50+d*8,xp:25}}},
  {id:'pearl',w:2,make:d=>{const n=3+Math.floor(d/2);return{text:`Phục vụ ${n} ly có trân châu`,target:n,prog:()=>S.q.pearl,cash:35+d*6,xp:15}}},
  {id:'tea',w:2,make:(d,r)=>{const ts=unlocked(TEAS),t=ts[Math.floor(r()*ts.length)],n=3+Math.floor(d/3);return{text:`Phục vụ ${n} ly ${t.name}`,target:n,prog:()=>S.q.tea[t.id]||0,cash:35+d*6,xp:15}}},
  {id:'earn',w:2,make:d=>{const n=Math.round(dayGoal(d)*1.15/10)*10;return{text:`Kiếm ${n}k trong một ca`,target:n,unit:'k',prog:()=>S.cash,cash:60+d*8,xp:25}}},
  {id:'nowalk',w:1,make:d=>({text:'Không để khách nào bỏ về',target:1,endOnly:true,fail:()=>S.missed>0,cash:70+d*10,xp:30})},
  {id:'nodump',w:1,make:d=>({text:'Hết ca mà không đổ ly nào',target:1,endOnly:true,fail:()=>S.dumped>0,cash:40+d*6,xp:15})},
  {id:'brew',w:1,make:d=>({text:'Pha một mẻ trà Hoàn hảo',target:1,prog:()=>S.q.perfBrew,cash:30+d*5,xp:15})},
  {id:'picky',w:1,make:d=>({text:'Làm hài lòng 2 khách khó tính',target:2,prog:()=>S.q.picky,cash:45+d*7,xp:20})},
  {id:'pet',w:2,make:d=>({text:'Vuốt ve mèo của tiệm 3 lần',target:3,prog:()=>S.q.pet,cash:25+d*4,xp:10})},
  {id:'cat',w:1,need:()=>has('catbed'),make:d=>({text:'Chiều lòng một bé Mèo VIP',target:1,prog:()=>S.q.cat,cash:40+d*6,xp:20})},
];
export let questCache=null;
export function makeQuests(day){
  const r=rng(9000+day*131);
  let pool=QUESTS.filter(q=>!q.need||q.need()),out=[];
  while(out.length<3&&pool.length){
    const tot=pool.reduce((a,q)=>a+q.w,0);let x=r()*tot,i=0;
    while(x>pool[i].w){x-=pool[i].w;i++}
    out.push({id:pool[i].id,...pool[i].make(day,r),done:false,failed:false});pool.splice(i,1);
  }
  return out;
}
export function questProg(q){return q.endOnly?(q.fail()?0:(q.done?1:0)):Math.min(q.target,q.prog())}
export function checkQuests(final?){
  S.quests.forEach(q=>{
    if(q.done||q.failed)return;
    if(q.endOnly){if(q.fail())q.failed=true;else if(final){if(S.served>=5)q.done=true;else q.failed=true}return}
    if(q.prog()>=q.target){q.done=true;if(!final)questToast(q)}
  });
  updateHud();
}
export function questToast(q){
  [784,988,1175].forEach((f,i)=>beep(f,.12,'triangle',.05,null,i*.09));
  if(S.phase==='prep'){$('#mtext').textContent+=` Xong nhiệm vụ: ${q.text}!`;return}
  floatText(1,'Xong nhiệm vụ!','streak');
  hint(`Xong nhiệm vụ: ${q.text}. Nhận +${q.cash}k và +${q.xp} XP khi đóng cửa.`);
}
export function questRows(list){
  return list.map(q=>{
    const p=questProg(q),st=q.done?'done':q.failed?'failed':'';
    const sub=q.endOnly?(q.failed?'Chưa đạt hôm nay':q.done?'Hoàn thành':'Tính lúc đóng cửa · cần phục vụ ít nhất 5 ly'):`${p}${q.unit||''} / ${q.target}${q.unit||''}`;
    return `<div class="quest ${st}"><span class="qdot" aria-hidden="true"></span><div>${q.text}<small>${sub}</small>${q.endOnly?'':`<div class="qbar"><i style="width:${p/q.target*100}%"></i></div>`}</div><div class="qrew">+${q.cash}k<br>+${q.xp} XP</div></div>`;
  }).join('');
}
export function questsFor(day){if(!questCache||questCache.day!==day)questCache={day,list:makeQuests(day)};return questCache.list}
