import type {Batch,Cup,Customer} from '../types';
import {TEAS} from '../data';
import {$,save,unlocked} from './core';
import {resetFx} from './fx';
import {renderTickets,updateHud} from './orders';
import {resetMini} from './prep';
import {questsFor} from './quests';
import {hint} from './serve';
import {buildControls,cupChanged,syncGear} from './station';

/* ---------- state ---------- */
/** Everything about the day in progress; reset every morning by newDay(). */
function freshDay(day:number){
  return {orderNo:0,focus:null as number|null,sealT:0,onlineShown:false,day,phase:'ready' as 'ready'|'market'|'prep'|'open'|'paused'|'closed',time:0,spawnT:1.2,customers:[] as Customer[],slots:[null,null,null] as (Customer|null)[],cash:0,tips:0,wasted:0,washT:0,served:0,perfect:0,missed:0,streak:0,bestStreak:0,nextId:1,stock:{} as Record<string,Batch[]>,brewing:{} as Record<string,number>,delivering:{} as Record<string,number>,brewed:{} as Record<string,number>,naJob:null as {cid:number;t:number}|null,autoServe:null as {slot:number;t:number}|null,hoaT:0,rushShown:false,spent:0,dumped:0,xp0:save.xp,wallet0:save.wallet,q:{pearl:0,tea:{},picky:0,cat:0,perfBrew:0,pet:0},
    focusManual:false,hoaOrdered:{} as Record<string,number>,reviewerCame:false,quests:[] as any[],repeat:null as {cid:number;tea:string;sugar:number;ice:number;tops:string[]}|null};
}
export type DayState=ReturnType<typeof freshDay>;
export let S:DayState, cup:Cup;
export function emptyCup():Cup{return ({tea:null,sugar:null,ice:null,tops:[],level:0,teaQ:null,pearlQ:null,sealed:false})}
export function newDay(day){
  resetFx();
  S=freshDay(day);
  S.quests=questsFor(day).map(q=>({...q,done:false,failed:false}));
  unlocked(TEAS).forEach(t=>S.stock[t.id]=[]);S.stock.pearl=[];
  resetMini();$('#mini').hidden=true;
  document.body.classList.remove('is-paused','is-washing');$('#pausedlab').hidden=true;$('#pause').textContent='Tạm dừng';
  setCup(emptyCup());buildControls();renderTickets();updateHud();cupChanged();hint('');syncGear();
}
export function setCup(v:Cup){cup=v}
