import * as stock from '../logic/stock';
import * as econ from '../logic/economy';
import type {Order,PlaceId,Quality,Save} from '../types';
import {FEATURES,GEAR_NAME,LEVELS,NEEDS_PLACE,PLACES,SUPPLY,TEAS,TOPS,TUB} from '../data';
import {ev} from './customers';
import {hint} from './serve';
import {S} from './state';
import {orderDelivery,syncGear} from './station';

/** shorthand for document.querySelector; the page's elements always exist */
export function $<T extends HTMLElement=HTMLElement>(s:string):T{return document.querySelector(s) as T}
export const scene=$<HTMLCanvasElement>('#scene'), g=scene.getContext('2d');
export const cupC=$<HTMLCanvasElement>('#cup'), cg=cupC.getContext('2d');
export const W=160,H=80,SLOTS=[30,80,130],DAY_LEN=150,OUT='#120F26';






export function stockName(id){return id==='pearl'?'Trân châu':tea(id).name}
export function stockN(id:string){return stock.count(S.stock[id])}
export function nextQ(id:string){return stock.nextQuality(S.stock[id])}
export function addBatch(id:string,n:number,q:Quality){stock.addBatch(S.stock[id],n,q)}
export function takeServing(id:string){return stock.takeServing(S.stock[id])}


export function tea(id){return TEAS.find(t=>t.id===id)}
export function top(id){return TOPS.find(t=>t.id===id)}
export function pick(a){return a[Math.floor(Math.random()*a.length)]}
export function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
export function unlocked(list){return list.filter(x=>save.owned.includes(x.id))}
export function maxTops(){return has('double')?2:1}
export function orderPrice(o:Order){return econ.cupPrice(o,{tea,top},ev().price)}

export function NEW_SAVE():Save{return ({day:1,wallet:200,xp:0,place:'cart',owned:['black','jasmine','pearl'],upgrades:[],pantry:{black:2,jasmine:2,pearl:2,cup:40,straw:40,film:40,bag:10},staff:{},history:[]})}
export let save:Save=NEW_SAVE();
/** fills in fields added by later versions; saves from before places existed keep their full shop */
export function loadSave(v:any):Save{
  const out=Object.assign(NEW_SAVE(),v);
  if(!v.place)out.place=v.day>1||(v.history||[]).length?'shop':'cart';
  if(out.pantry.cup===undefined)Object.assign(out.pantry,{cup:40,straw:40,film:40,bag:10});
  return out;
}
try{const v=JSON.parse(localStorage.getItem('tcs-save3'));if(v&&v.owned)save=loadSave(v)}catch(e){}
export function persist(){try{localStorage.setItem('tcs-save3',JSON.stringify(save))}catch(e){}}
export function has(id){return save.upgrades.includes(id)}

export function levelOf(xp:number){return econ.levelOf(xp,LEVELS)}
export function lvProgress(xp:number){return econ.levelProgress(xp,LEVELS)}


export function packOf(it){return it.pack||(it.tub?TUB:1)}
export function useGear(id){if((save.pantry[id]||0)<=0){hint(`Hết ${GEAR_NAME[id]}!`);orderDelivery(id);return false}save.pantry[id]--;syncGear();return true}



export function staffOn(id){return placeAtLeast('shop')&&!!(save.staff&&save.staff[id]&&save.staff[id].hired&&save.staff[id].on)}

// new players meet one new thing per day instead of everything at once

export function feat(f){if(NEEDS_PLACE[f]&&!placeAtLeast(NEEDS_PLACE[f]))return false;return !!S&&S.day>=FEATURES[f]}
export function sealNeeded(){return feat('seal')}

export function teaBatch(){return has('bigpot')?12:8}
export function isTub(id){return !!(SUPPLY.find(x=>x.id===id)||{}).tub}
export function setSave(v:Save){save=v}

/* ---------- places: pushcart → kiosk → shop ---------- */
export function placeInfo(id:PlaceId=save.place||'shop'){return PLACES.find(p=>p.id===id)}
export function placeIndex(id:PlaceId=save.place||'shop'){return PLACES.findIndex(p=>p.id===id)}
export function placeAtLeast(id:PlaceId){return placeIndex()>=placeIndex(id)}
export function nextPlace(){return PLACES[placeIndex()+1]||null}
/** today's revenue target, smaller while you're still at the cart or the kiosk */
export function dayGoal(d:number){return Math.round(econ.goalFor(d)*placeInfo().goal/10)*10}
