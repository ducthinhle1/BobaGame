import {EVENTS,GEAR_NAME,ICES,LEVELS,NEWS,PEARL_BATCH,RECIPES,REGULARS,SEASONS,STAFF,SUPPLY,TEAS,TOPS,TUB,UPGRADES} from '../data';
import {goalFor} from '../logic/economy';
import {track} from './analytics';
import {audio,meow,sfx} from './audio';
import {$,DAY_LEN,NEW_SAVE,g,has,isTub,levelOf,lvProgress,packOf,persist,save,setSave,staffOn,stockN,tea,teaBatch,top,unlocked} from './core';
import {canMake,ev,rollEvent,season} from './customers';
import {iconURL} from './icons';
import {last} from './loop';
import {renderTickets,updateHud} from './orders';
import {renderPrep} from './prep';
import {checkQuests,questRows} from './quests';
import {S,newDay} from './state';

/* ---------- day flow ---------- */
export function showOnly(id){['start','market','prep','end'].forEach(x=>$('#'+x).hidden=x!==id)}
export function openMarket(){
  audio();
  if(save.eventDay!==save.day){save.lastEvent=save.event;save.event=rollEvent(save.day);save.eventDay=save.day;persist()}
  newDay(save.day);S.phase='market';showOnly('market');
  const teaPacks=unlocked(TEAS).reduce((a,t)=>a+(save.pantry[t.id]||0),0);
  const cheapest=Math.min(...SUPPLY.filter(x=>x.kind==='tea'&&save.owned.includes(x.id)).map(x=>x.price));
  if(!teaPacks&&save.wallet<cheapest){save.pantry.black=(save.pantry.black||0)+1;persist();mmsg('Dì ghé tặng một gói lá trà đen. Chúc bán đắt hàng!')}
  else mmsg('');
  renderMarket();$('#market').scrollTop=0;
}
export function mmsg(t){$('#mmsg').textContent=t}
export function marketItem(kind,it){
  const lv=levelOf(save.xp),icon=kind==='up'?iconURL('up',it.id):kind==='staff'?iconURL('staff',it.id):it.gear?iconURL('gear',it.id):iconURL(it.kind,it.id);
  let btn,cls='mitem',note='';
  if(kind==='supply'){
    const n=save.pantry[it.id]||0;
    note=`<span class="have">Đang có ${n}${it.tub?' muỗng':it.gear?' '+GEAR_NAME[it.id]:''}</span> · ${it.desc}`;
    btn=`<button class="btn" type="button" data-buy="supply:${it.id}"${save.wallet<it.price?' disabled':''}>−${it.price}k</button>`;
  }else if(kind==='staff'){
    const st=save.staff[it.id];note=`${it.desc} Lương ${it.wage}k/ngày.`;
    if(st&&st.hired){if(!st.on)cls+=' owned';btn=`<button class="btn${st.on?' on':''}" type="button" data-staff="${it.id}" title="Chạm để cho nghỉ hoặc đi làm">${st.on?'Đang làm':'Đang nghỉ'}</button>`}
    else if(lv<it.lv){cls+=' lockd';btn=`<button class="btn" type="button" disabled>Cấp ${it.lv}</button>`}
    else btn=`<button class="btn" type="button" data-buy="staff:${it.id}"${save.wallet<it.price?' disabled':''}>Tuyển −${it.price}k</button>`;
  }else{
    const owned=kind==='recipe'?save.owned.includes(it.id):has(it.id);
    note=it.desc;
    if(owned){cls+=' owned';btn=`<button class="btn" type="button" disabled>Đã có</button>`}
    else if(lv<it.lv){cls+=' lockd';btn=`<button class="btn" type="button" disabled>Cấp ${it.lv}</button>`}
    else btn=`<button class="btn" type="button" data-buy="${kind}:${it.id}"${save.wallet<it.price?' disabled':''}>−${it.price}k</button>`;
  }
  return `<div class="${cls}"><img src="${icon}" alt=""><div>${it.name}<small>${note}</small></div>${btn}</div>`;
}
// what to buy before today's shift: an estimate of today's drinks turned into packs, cups, straws and so on
export function estDrinks(d){return Math.min(42,22+3*d)}
export function unitOf(it){return it.gear?GEAR_NAME[it.id]:it.tub?'muỗng':it.id==='pearl'?'bao':'gói'}
export function shoppingList(day=save.day){
  const d=estDrinks(day),teas=unlocked(TEAS),tubs=unlocked(TOPS).filter(t=>isTub(t.id)),out=[];
  const add=(id,want)=>{const it=SUPPLY.find(x=>x.id===id);if(!it)return;const have=save.pantry[id]||0;if(have>=want)return;
    const packs=Math.ceil((want-have)/packOf(it));out.push({it,have,want,packs,cost:packs*it.price})};
  const perTea=Math.max(1,Math.ceil(d/teaBatch()/Math.max(1,teas.length)+.25));
  teas.forEach(t=>add(t.id,perTea));
  add('pearl',Math.max(1,Math.ceil(d*.45/PEARL_BATCH)));
  tubs.forEach(t=>add(t.id,Math.max(6,Math.ceil(d*.35/Math.max(1,tubs.length+1)))));
  ['cup','straw','film'].forEach(g=>add(g,d+4));add('bag',Math.max(4,Math.ceil(d*.2)));
  return {list:out,drinks:d};
}
export function renderNeeds(){
  const {list,drinks}=shoppingList(),total=list.reduce((a,x)=>a+x.cost,0);
  const box=$('#m-need');
  if(!list.length){box.innerHTML=`<p class="needok">Kho đủ dùng cho hôm nay (ước tính khoảng ${drinks} ly).</p>`;return}
  box.innerHTML=`<p class="needsum">Hôm nay ước tính khoảng <b>${drinks} ly</b>. Những món dưới đây sắp thiếu:</p>`+
    list.map(x=>`<div class="needrow"><img src="${x.it.gear?iconURL('gear',x.it.id):iconURL(x.it.kind,x.it.id)}" alt=""><div>${x.it.name}<small>Có ${x.have} · nên có ${x.want} ${unitOf(x.it)}</small></div><button class="btn" type="button" data-needbuy="${x.it.id}"${save.wallet<x.cost?' disabled':''}>Mua ×${x.packs} −${x.cost}k</button></div>`).join('')+
    `<div class="needfoot"><span>Tổng ${total}k</span><button class="btn big" type="button" data-needall${save.wallet<list[0].cost?' disabled':''}>${save.wallet>=total?`Mua hết −${total}k`:'Mua những món đủ tiền'}</button></div>`;
}
export function buyNeed(x){if(save.wallet<x.cost)return false;save.wallet-=x.cost;save.pantry[x.it.id]=(save.pantry[x.it.id]||0)+x.packs*packOf(x.it);return true}
export function renderRevenue(){
  const box=$('#m-rev'),h=(save.history||[]);
  if(!h.length){box.innerHTML='<p class="needsum">Chưa có số liệu. Hết ngày đầu tiên sẽ có biểu đồ doanh thu ở đây.</p>';return}
  const total=h.reduce((a,x)=>a+x.earned,0),avg=Math.round(total/h.length),best=h.reduce((a,x)=>x.earned>a.earned?x:a,h[0]);
  const last=h.slice(-10),max=Math.max(...last.map(x=>x.earned),1);
  const W2=300,H2=110,pad=18,bw=(W2-8)/10,barW=Math.max(6,bw-6);
  const bars=last.map((x,i)=>{const bh=Math.max(2,Math.round(x.earned/max*(H2-pad-14))),bx=4+i*bw+(bw-barW)/2,by=H2-pad-bh,isBest=x===best;
    const tip=`Ngày ${x.d}: thu ${x.earned}k (tip ${x.tips}k) · thưởng ${x.quest}k · lương ${x.wage?'−'+x.wage:0}k · lãi ${x.net}k · ${x.served} ly`;
    return `<g class="rbar" tabindex="0" aria-label="${tip}"><title>${tip}</title><rect x="${bx-3}" y="0" width="${barW+6}" height="${H2-pad}" fill="transparent"/>
      <path d="M${bx},${H2-pad} v-${bh-4} q0,-4 4,-4 h${barW-8} q4,0 4,4 v${bh-4} z" fill="${isBest?'var(--gold)':'#F2A7BA'}"/>
      ${isBest?`<text x="${bx+barW/2}" y="${by-4}" text-anchor="middle" class="rlab">${x.earned}k</text>`:''}
      <text x="${bx+barW/2}" y="${H2-4}" text-anchor="middle" class="raxis">N${x.d}</text></g>`}).join('');
  box.innerHTML=`<div class="rstats"><div><span class="lab">Tổng doanh thu</span><b>${total}k</b></div><div><span class="lab">Trung bình/ngày</span><b>${avg}k</b></div><div><span class="lab">Cao nhất</span><b>${best.earned}k</b><small>ngày ${best.d}</small></div></div>
    <svg class="rchart" viewBox="0 0 ${W2} ${H2}" role="img" aria-label="Doanh thu ${last.length} ngày gần nhất"><line x1="0" x2="${W2}" y1="${H2-pad+.5}" y2="${H2-pad+.5}" class="rbase"/>${bars}</svg>
    <p class="rtip" id="rtip">Chạm hoặc rê chuột vào cột để xem chi tiết từng ngày.</p>`;
  box.querySelectorAll('.rbar').forEach(g=>{const show=()=>{$('#rtip').textContent=g.getAttribute('aria-label');box.querySelectorAll('.rbar').forEach(x=>x.classList.toggle('on',x===g))};g.addEventListener('mouseenter',show);g.addEventListener('focus',show);g.addEventListener('click',show)});
}
export function renderNews(){
  const n=NEWS[save.day]||[],e=ev(),box=$('#m-new'),items=[...n];
  if(e!==EVENTS.normal)items.unshift(['Hôm nay: '+e.name,e.desc]);
  if(season)items.push([SEASONS[season].name,SEASONS[season].desc]);
  box.hidden=!items.length;
  if(items.length)box.innerHTML=`<b>${n.length?'Mới hôm nay':'Hôm nay ở tiệm'}</b>`+items.map(([t,d])=>`<p><span>${t}</span>${d}</p>`).join('');
}
export function drinkText(o){return `${tea(o.tea).name} · ${o.sugar}% đường · ${ICES[o.ice]}${o.tops.length?' · '+o.tops.map(x=>top(x).name).join(', '):''}`}
export function renderFriends(){
  const fr=save.friends||{};
  $('#m-friends').innerHTML=REGULARS.map(r=>{const f=fr[r.id]||{met:false,hearts:0,gift:false};
    const hearts=[0,1,2,3,4].map(i=>`<span class="${i<f.hearts?'on':''}">♥</span>`).join('');
    const note=f.met?`Món ruột: ${drinkText(r.fav)}${f.hearts>=3?`<br><em>${r.bio}</em>`:''}${f.gift?`<br>Quà: ${r.gift}`:''}`:(canMake(r.fav)?'Chưa gặp. Hãy chờ họ ghé tiệm.':'Chưa gặp. Có lẽ tiệm cần thêm món mới.');
    return `<div class="mitem friendcard${f.met?'':' lockd'}"><img src="${iconURL('friend',r.id)}" alt=""><div>${f.met?r.name:'???'}<span class="hearts">${hearts}</span><small>${note}</small></div></div>`}).join('');
}
export function renderMarket(){
  renderNews();renderFriends();renderNeeds();renderRevenue();
  $('#m-quests').innerHTML=questRows(S.quests);
  $('#mday').textContent=`Buổi sáng · Ngày ${save.day}`;
  $('#mwallet').textContent=save.wallet+'k';
  const lv=levelOf(save.xp);
  $('#mlv').textContent=lv>=LEVELS.length?`Cấp ${lv} · tối đa`:`Cấp ${lv} · ${save.xp}/${LEVELS[lv]} XP`;
  $('#mxp').style.width=(lvProgress(save.xp)*100)+'%';
  $('#m-supply').innerHTML=SUPPLY.filter(x=>!x.gear&&save.owned.includes(x.id)).map(x=>marketItem('supply',x)).join('');
  $('#m-gear').innerHTML=SUPPLY.filter(x=>x.gear).map(x=>marketItem('supply',x)).join('');
  $('#m-recipe').innerHTML=RECIPES.map(x=>marketItem('recipe',x)).join('');
  $('#m-up').innerHTML=UPGRADES.map(x=>marketItem('up',x)).join('');
  $('#m-staff').innerHTML=STAFF.map(x=>marketItem('staff',x)).join('');
}
$('#market').addEventListener('click',e=>{
  const nb=(e.target as HTMLElement).closest<HTMLElement>('[data-needbuy]'),na=(e.target as HTMLElement).closest<HTMLElement>('[data-needall]');
  if(nb||na){audio();const {list}=shoppingList();let n=0,miss=0;
    (na?list:list.filter(x=>x.it.id===nb.dataset.needbuy)).forEach(x=>{if(buyNeed(x))n++;else miss++});
    persist();renderMarket();if(n){sfx.click();mmsg(miss?`Đã mua ${n} món. Còn ${miss} món chưa đủ tiền.`:`Đã mua ${n} món. Kho sẵn sàng!`)}else{sfx.nope();mmsg('Chưa đủ tiền tiết kiệm.')}return}
  const sb=(e.target as HTMLElement).closest<HTMLElement>('[data-staff]');
  if(sb){const st=save.staff[sb.dataset.staff];st.on=!st.on;persist();renderMarket();sfx.click();mmsg(st.on?'Nhân viên sẽ đi làm hôm nay.':'Đã cho nhân viên nghỉ hôm nay.');return}
  const b=(e.target as HTMLElement).closest<HTMLElement>('[data-buy]');if(!b)return;audio();
  const [kind,id]=b.dataset.buy.split(':');
  const it=(kind==='supply'?SUPPLY:kind==='recipe'?RECIPES:kind==='staff'?STAFF:UPGRADES).find(x=>x.id===id);
  if(save.wallet<it.price){mmsg('Chưa đủ tiền tiết kiệm.');sfx.nope();return}
  save.wallet-=it.price;
  if(kind==='supply'){save.pantry[id]=(save.pantry[id]||0)+packOf(it);sfx.click();mmsg(`Đã mua ${it.name}.`)}
  else if(kind==='recipe'){track('unlock',{item:id,day:save.day});save.owned.push(id);save.pantry[id]=(save.pantry[id]||0)+(isTub(id)?TUB:1);sfx.win();mmsg(`${it.name} đã có trong menu.`)}
  else if(kind==='staff'){track('hire',{staff:id,day:save.day});save.staff=save.staff||{};save.staff[id]={hired:true,on:true};sfx.win();meow(1.2,.04,.3);mmsg(`${it.name.split(' · ')[0]} đã vào làm ở tiệm!`)}
  else{track('upgrade',{item:id,day:save.day});save.upgrades.push(id);sfx.win();mmsg(`Đã lắp ${it.name}.`)}
  persist();renderMarket();
});
$('#mgo').addEventListener('click',()=>{
  audio();newDay(save.day);S.phase='prep';showOnly('prep');renderPrep();$('#prep').scrollTop=0;
});
export function endDay(){
  S.phase='closed';S.time=DAY_LEN;S.brewing={};
  const leftovers=Object.keys(S.stock).reduce((a,id)=>a+stockN(id),0);
  S.customers.forEach(c=>{if(c.state!=='leave'){c.state='leave';c.result='ok';c.bubbleT=.6}});
  S.slots=[null,null,null];renderTickets();updateHud();
  const goal=goalFor(S.day),total=S.served+S.missed,rate=total?S.perfect/total:0;
  const stars=S.cash>=goal?(rate>=.75?3:2):S.cash>=goal*.5?1:0;
  const lvBefore=levelOf(S.xp0);
  checkQuests(true);
  const qDone=S.quests.filter(q=>q.done),qCash=qDone.reduce((a,q)=>a+q.cash,0)+(qDone.length===S.quests.length?50:0),qXp=qDone.reduce((a,q)=>a+q.xp,0);
  save.xp+=stars*10+qXp;
  const wage=STAFF.filter(x=>staffOn(x.id)).reduce((a,x)=>a+x.wage,0);
  save.history=(save.history||[]).concat([{d:S.day,earned:S.cash,tips:S.tips,quest:qCash,wage,net:S.cash+qCash-wage,served:S.served,perfect:S.perfect}]).slice(-60);
  const prevDay=save.history[save.history.length-2];
  track('day_end',{day:S.day,served:S.served,perfect:S.perfect,missed:S.missed,stars,goal_met:S.cash>=goal,staff:STAFF.filter(x=>staffOn(x.id)).length});
  save.wallet+=S.cash+qCash-wage;save.day=S.day+1;persist();
  const lvAfter=levelOf(save.xp),gained=save.xp-S.xp0;
  let teaser='';
  if(lvAfter<LEVELS.length){
    const nl=lvAfter+1,need=LEVELS[lvAfter]-save.xp,items=[...RECIPES,...UPGRADES].filter(x=>x.lv===nl).map(x=>x.name);
    if(items.length)teaser=`<div class="teaser">Còn <b>${need} XP</b> nữa lên cấp ${nl}, mở khóa ${items.join(', ')}.</div>`;
  }
  const r=$('#receipt');
  r.innerHTML=`<h2>Mèo Trân Châu</h2><div class="c">Tiệm trà sữa mèo · Ngày ${S.day} · đóng cửa 21:30</div><hr>
    <div class="rl"><span>Ly đã bán</span><span>${S.served}</span></div>
    <div class="rl"><span>Ly hoàn hảo</span><span>${S.perfect}</span></div>
    <div class="rl"><span>Khách bỏ về</span><span>${S.missed}</span></div>
    <div class="rl"><span>Chuỗi dài nhất</span><span>${S.bestStreak}</span></div>
    <div class="rl"><span>Ly bị đổ</span><span>${S.dumped}</span></div>
    <div class="rl"><span>Nguyên liệu dư bỏ đi</span><span>${leftovers}</span></div><hr>
    <div class="rl"><span>Tiền tip</span><span>${S.tips}k</span></div>
    ${S.spent?`<div class="rl"><span>Đặt hàng giao gấp</span><span>−${S.spent}k</span></div>`:''}
    <div class="rl total"><span>Thu hôm nay</span><span>${S.cash}k</span></div>
    ${prevDay&&prevDay.earned>0?`<div class="c">${S.cash>=prevDay.earned?'Tăng':'Giảm'} ${Math.abs(Math.round((S.cash-prevDay.earned)/prevDay.earned*100))}% so với hôm qua (${prevDay.earned}k)</div>`:''}
    ${wage?`<div class="rl"><span>Lương nhân viên</span><span>−${wage}k</span></div>`:''}
    ${S.quests.map(q=>`<div class="rq${q.done?'':' miss'}"><span>${q.done?'✓':'✗'} ${q.text}</span><span>${q.done?'+'+q.cash+'k':''}</span></div>`).join('')}
    ${qDone.length===S.quests.length?'<div class="rq"><span>Thưởng xong cả 3 nhiệm vụ</span><span>+50k</span></div>':''}
    <div class="rl"><span>Tiền tiết kiệm</span><span>${save.wallet}k</span></div>
    <div class="rl"><span>XP</span><span>+${gained}</span></div>
    <div class="stars" aria-label="${stars} trên 3 sao">${[0,1,2].map(i=>`<span class="${i<stars?'':'off'}">★</span>`).join('')}</div>
    <div class="c">Mục tiêu ${goal}k · mỗi sao thưởng thêm XP</div>
    ${lvAfter>lvBefore?`<div class="lvup">Lên cấp ${lvAfter}! Chợ có món mới rồi.</div>`:''}
    ${(()=>{const n=shoppingList(save.day).list;return n.length?`<div class="c">Ngày mai cần mua: ${n.map(x=>x.it.name).slice(0,4).join(', ')}${n.length>4?'…':''}</div>`:''})()}
    ${teaser}
    <div class="row" style="justify-content:center;margin-top:8px">
      <button class="btn big" id="next" type="button">Đi chợ</button>
    </div>`;
  showOnly('end');
  if(lvAfter>lvBefore)sfx.win();
  $('#next').addEventListener('click',openMarket);$('#next').focus();
}
export let wipeArmed=false;
export function renderStart(){
  const b=$('#startbtns');b.innerHTML='';
  const mk=(label,fn,big)=>{const x=document.createElement('button');x.type='button';x.className='btn'+(big?' big':'');x.textContent=label;x.addEventListener('click',()=>fn(x));b.appendChild(x);return x};
  const fresh=save.day===1&&save.xp===0;
  const first=mk(fresh?'Mở tiệm':`Chơi tiếp: ngày ${save.day}`,()=>{track(fresh?'new_game':'continue',{day:save.day,screen:innerWidth>innerHeight?'landscape':'portrait'});openMarket()},true);
  if(!fresh)mk('Chơi lại từ đầu',x=>{
    if(!wipeArmed){wipeArmed=true;x.textContent='Bấm lần nữa để xóa dữ liệu';return}
    track('restart',{from_day:save.day});setSave(NEW_SAVE());persist();wipeArmed=false;openMarket();
  },false);
  first.focus();
}
