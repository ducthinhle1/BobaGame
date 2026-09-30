import {DELIVERY,GEAR,GEAR_NAME,ICES,QUAL,SUGARS,SUPPLY,TEAS,TOPS} from '../data';
import {audio,beep,sfx} from './audio';
import {$,g,has,maxTops,nextQ,save,stockN,stockName,takeServing,tea,top,unlocked,useGear} from './core';
import {parts} from './fx';
import {iconURL} from './icons';
import {markTickets,updateHud} from './orders';
import {checkQuests} from './quests';
import {floatText,hint} from './serve';
import {S,cup,emptyCup,setCup} from './state';

export function buildControls(){
  const mk=(parent,items)=>{const box=$(parent);box.innerHTML='';items.forEach(([kind,val,label,full])=>{
    const b=document.createElement('button');b.type='button';b.className='tile';b.dataset.kind=kind;b.dataset.val=val;
    b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',full);b.title=full;
    const im=document.createElement('img');im.src=iconURL(kind,val);im.alt='';im.width=48;im.height=48;
    const s=document.createElement('span');s.textContent=label;
    b.append(im,s);
    if(kind==='tea'||kind==='top'){const bd=document.createElement('i');bd.className='badge';b.appendChild(bd)}
    box.appendChild(b)})};
  mk('#o-tea',unlocked(TEAS).map(t=>['tea',t.id,t.short,t.name]));
  mk('#o-sugar',SUGARS.map(s=>['sugar',s,s+'%',`${s}% đường`]));
  mk('#o-ice',ICES.map((n,i)=>['ice',i,['Không','Ít','Vừa'][i],n]));
  mk('#o-top',unlocked(TOPS).map(t=>['top',t.id,t.short,t.name]));
  $('#toplab').textContent=`Topping (tối đa ${maxTops()})`;
  syncControls();
}
export function syncControls(){
  document.querySelectorAll<HTMLElement>('.opts .tile').forEach(b=>{
    const k=b.dataset.kind,v=b.dataset.val;let on=false;
    let set=false;
    if(k==='tea'){on=cup.tea===v;set=cup.tea!==null}else if(k==='sugar'){on=cup.sugar===+v;set=cup.sugar!==null}
    else if(k==='ice'){on=cup.ice===+v;set=cup.ice!==null}else{on=cup.tops.includes(v);set=cup.tops.length>=maxTops()}
    b.setAttribute('aria-pressed',on?'true':'false');
    b.classList.toggle('locked',set&&!on);
  });
  $('#dump').textContent='Đổ ly';
  const sb=$<HTMLButtonElement>('#seal');sb.hidden=true;sb.disabled=!cup.tea||cup.sealed||S.sealT>0;sb.textContent=cup.sealed?'Đã dán nắp':S.sealT>0?'Đang dán…':'Dán nắp';sb.classList.toggle('done',cup.sealed);
  if(cup.sealed)document.querySelectorAll<HTMLElement>('.opts .tile').forEach(t=>{if(t.getAttribute('aria-pressed')!=='true')t.classList.add('locked')});
  syncBadges();
}
// out of stock mid-shift: order a rush delivery paid from today's takings (then savings); it costs 20% more and takes a while
export function orderDelivery(id){
  const it=SUPPLY.find(x=>x.id===id),name=it.name;
  if(S.delivering[id]){hint(`${name} đang được giao, còn ${Math.ceil(S.delivering[id])} giây.`);sfx.nope();return}
  const price=Math.round(it.price*1.2);
  if(S.cash+save.wallet<price){hint(`Hết ${it.gear?GEAR_NAME[id]:it.kind==='top'&&id!=='pearl'?top(id).name:stockName(id)}. Cần ${price}k để đặt giao gấp, bán thêm vài ly rồi đặt nhé.`);sfx.nope();return}
  const fromCash=Math.min(S.cash,price);S.cash-=fromCash;save.wallet-=price-fromCash;S.spent+=price;
  S.delivering[id]=DELIVERY;
  hint(`Đã đặt giao gấp ${name} (−${price}k). Shipper tới sau ${DELIVERY} giây.`);sfx.ok();updateHud();syncBadges();
}
export function syncGear(){
  const el=$('#gear');if(!el)return;
  el.innerHTML=GEAR.map(id=>{const n=save.pantry[id]||0,dl=S&&S.delivering&&S.delivering[id];return `<span class="${n<=5?'low':''}" title="${GEAR_NAME[id]}"><img src="${iconURL('gear',id)}" alt="">${dl&&!n?Math.ceil(dl)+'s':n}</span>`}).join('');
}
export function syncBadges(){
  if(S&&S.delivering&&GEAR.some(g=>S.delivering[g]))syncGear();
  document.querySelectorAll<HTMLElement>('.opts .tile .badge').forEach(bd=>{
    const id=bd.parentElement.dataset.val,br=S.brewing[id],dl=S.delivering&&S.delivering[id];
    let n,q;
    if(S.stock[id]){n=stockN(id);q=nextQ(id)}else{n=save.pantry[id]||0;q='good'}
    bd.textContent=br&&!n?Math.ceil(br)+'s':dl&&!n?Math.ceil(dl)+'s':n;
    bd.className='badge'+(br&&!n?' brew':dl&&!n?' ship':n<=0?' out':q==='perfect'?'':QUAL[q].mul<1?' out':' plain');
    bd.title=n?`Còn ${n} · kế tiếp: ${QUAL[q].label}`:'';
  });
}
/** Chị Hoa looks at what the waiting customers ordered and brews whatever will run short first,
 *  keeping a small buffer of every tea you brewed today. Up to two pots at once. When the pantry is out,
 *  she orders a rush delivery (at most every 20 s per item, and only if you can pay for it). */
export function hoaWork(){
  if(Object.keys(S.brewing).length>=2)return;
  const need:Record<string,number>={};
  S.slots.forEach(c=>{if(!c||c.state==='leave')return;const left=(c.order.qty||1)-c.bagged;
    need[c.order.tea]=(need[c.order.tea]||0)+left;if(c.order.tops.includes('pearl'))need.pearl=(need.pearl||0)+left});
  let best=null,gap=0;
  for(const id in S.stock){if(S.brewing[id])continue;const g=(need[id]||0)+(S.brewed[id]?3:0)-stockN(id);if(g>gap){gap=g;best=id}}
  if(!best)return;
  if((save.pantry[best]||0)>0){rebrew(best,'hoa');return}
  if(S.delivering[best]||S.time-(S.hoaOrdered[best]??-99)<20)return;
  S.hoaOrdered[best]=S.time;orderDelivery(best);
  if(S.delivering[best])hint(`Kho hết ${stockName(best)}. Chị Hoa đã đặt giao gấp.`);
}
export function rebrew(id,byHoa?){
  if(S.brewing[id]){if(!byHoa){hint(`${stockName(id)} sẽ xong sau ${Math.ceil(S.brewing[id])} giây.`);sfx.nope()}return}
  if((save.pantry[id]||0)<=0){if(!byHoa)orderDelivery(id);return}
  S.brewed[id]=1;
  const secs=has('kettle')?3:7;
  save.pantry[id]--;S.brewing[id]=secs;
  hint(byHoa==='hoa'?`Chị Hoa pha thêm ${stockName(id)}, ${secs} giây nữa có.`:byHoa?`Đang pha ${stockName(id)} vừa giao tới (${secs} giây).`:`Hết ${stockName(id)}. Đang pha gấp từ kho: ${secs} giây.`);sfx.pour();syncBadges();
}
export const LOCKED='Đã cho vào ly rồi. Đổ ly để làm lại.';
export function canAct(){
  if(S.phase==='paused'){hint('Đang tạm dừng. Tiếp tục để làm việc nhé.');return false}
  if(S.phase!=='open')return false;
  if(S.washT>0){hint('Đang tráng bình lắc…');sfx.nope();return false}
  if(S.sealT>0){hint('Đang dán nắp…');return false}
  return true;
}
document.querySelector<HTMLElement>('.controls').addEventListener('click',e=>{
  const b=(e.target as HTMLElement).closest<HTMLElement>('.tile');if(!b)return;audio();
  if(!canAct())return;
  const k=b.dataset.kind,v=b.dataset.val;
  if(cup.sealed){hint('Ly đã dán nắp rồi. Muốn đổi thì đổ ly.');sfx.nope();return}
  if(k==='tea'){if(cup.tea===v)return;if(cup.tea){hint(LOCKED);sfx.nope();return}
    if(stockN(v)<=0){rebrew(v);return}if(!useGear('cup'))return;cup.teaQ=takeServing(v);cup.level=0;cup.tea=v;sfx.pour()}
  else if(k==='sugar'){if(cup.sugar===+v)return;if(cup.sugar!==null){hint(LOCKED);sfx.nope();return}cup.sugar=+v;sfx.click()}
  else if(k==='ice'){if(cup.ice===+v)return;if(cup.ice!==null){hint(LOCKED);sfx.nope();return}cup.ice=+v;sfx.click()}
  else{if(cup.tops.includes(v)){hint('Topping đã cho vào thì không lấy ra được.');sfx.nope();return}
    if(cup.tops.length>=maxTops()){hint(`Hôm nay mỗi ly tối đa ${maxTops()} topping.`);sfx.nope();return}
    if(v==='pearl'){if(stockN('pearl')<=0){rebrew('pearl');return}cup.pearlQ=takeServing('pearl')}
    else{if((save.pantry[v]||0)<=0){orderDelivery(v);return}save.pantry[v]--;syncBadges()}
    cup.tops.push(v);sfx.click()}
  syncBadges();
  cupChanged();
});
export function dumpCost(){return cup.tea||cup.tops.length||cup.sugar!==null||cup.ice!==null?1:0}
export function dump(){
  audio();if(!canAct())return;
  const cost=dumpCost();if(!cost){hint('Ly đang trống mà.');return}
  S.dumped++;S.washT=1.2;S.streak=0;checkQuests();
  setCup(emptyCup());cupChanged();updateHud();sfx.fail();
  floatText(1,'Đã đổ','bad');hint('Đã đổ ly. Nguyên liệu trong ly mất hết, chuỗi hoàn hảo về 0.');
}
$('#dump').addEventListener('click',dump);
export function sealCup(){
  audio();if(!canAct())return;
  if(!cup.tea){hint('Chưa có trà để dán nắp.');sfx.nope();return}
  if(cup.sealed)return;
  if(!useGear('film'))return;
  S.sealT=.25;beep(90,.25,'sawtooth',.025,150);syncControls();
}
$('#seal').addEventListener('click',sealCup);
// multi-cup orders: one tap pours the next cup with the same recipe (still uses stock; you still seal and bag it)
export let againBusy=false;
export function syncAgain(){
  const b=$('#again');if(!b||!S)return;const r=S.repeat,c=r&&S.slots.find(x=>x&&x.id===r.cid&&x.state==='wait');
  if(r&&!c)S.repeat=null;
  const show=!!c&&!againBusy&&c.bagged<(c.order.qty||1)&&!cup.tea&&!cup.tops.length&&cup.sugar===null&&cup.ice===null;
  b.hidden=!show;if(show)b.textContent=`Pha y chang #${c.no} · ly ${c.bagged+1}/${c.order.qty}`;
}
export async function pourAgain(){
  audio();const r=S.repeat;if(!r||againBusy||!canAct())return;
  againBusy=true;$('#again').hidden=true;
  const tap=(k,v)=>{const t=document.querySelector(`.controls .tile[data-kind="${k}"][data-val="${v}"]`) as HTMLElement;if(t)t.click()};
  const steps=[['tea',r.tea],['sugar',r.sugar],['ice',r.ice],...r.tops.map(t=>['top',t])];
  for(const [k,v] of steps){
    if(k!=='tea'&&!cup.tea)break; // tea ran out (it's re-brewing): stop so the player sees why
    tap(k,v);await new Promise(res=>setTimeout(res,110));
  }
  againBusy=false;syncAgain();
  if(cup.tea)hint('Đã rót ly giống ly trước. Bấm nút lớn để cho vào túi.');
}
$('#again').addEventListener('click',pourAgain);
export function cupChanged(){
  syncControls();syncAgain();
  const parts=[];
  if(cup.tea)parts.push(tea(cup.tea).name);
  if(cup.sugar!==null)parts.push(cup.sugar+'% đường');
  if(cup.ice!==null)parts.push(ICES[cup.ice]);
  cup.tops.forEach(t=>parts.push(top(t).name));
  $('#cupsum').textContent=parts.length?parts.join(' · '):'Ly trống';
  markTickets();
}
