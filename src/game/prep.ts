import {MINI_INFO,PEARL_BATCH,QUAL,TEAS} from '../data';
import {audio,beep,sfx} from './audio';
import {$,OUT,addBatch,feat,has,save,stockN,tea,teaBatch,top,unlocked} from './core';
import {ev} from './customers';
import {blit,inEll,px} from './draw';
import {METAL,METAL_HI,iconURL} from './icons';
import {renderTickets,updateHud} from './orders';
import {checkQuests} from './quests';
import {hint} from './serve';
import {S} from './state';
import {buildControls} from './station';

/* ---------- prep: brewing and pearl cooking ---------- */
export let mini=null;
export const mg=$<HTMLCanvasElement>('#mcv').getContext('2d');
export function renderPrep(){
  $('#prepday').textContent=`Trước giờ mở cửa · Ngày ${S.day}`;
  const row=(kind,id,name,unit,verb)=>{
    const bs=S.stock[id],packs=save.pantry[id]||0;
    const detail=bs.length?bs.map(b=>`<span class="${QUAL[b.q].cls}">${b.n} ${QUAL[b.q].label}</span>`).join(' + '):`Chưa có ${unit}`;
    return `<div class="prow"><img src="${iconURL(kind,id)}" alt=""><div>${name}<small>${detail}</small></div><button class="btn" type="button" data-prep="${id}"${mini||!packs?' disabled':''}>${verb} · còn ${packs}</button></div>`;
  };
  $('#p-tealab').textContent=`Quầy trà · ${teaBatch()} ly mỗi mẻ`;
  $('#p-teas').innerHTML=unlocked(TEAS).map(t=>row('tea',t.id,t.name,'ly nào','Pha')).join('');
  $('#p-pearl').innerHTML=row('top','pearl','Trân châu','muỗng nào','Nấu');
  $('#pspent').textContent='Số trên nút là nguyên liệu còn trong kho.';
  $<HTMLButtonElement>('#popen').disabled=!!mini;
}
$('#prep').addEventListener('click',e=>{const b=(e.target as HTMLElement).closest<HTMLElement>('[data-prep]');if(b)startMini(b.dataset.prep)});
export let miniCount=0;

export function startMini(id){
  if(mini)return;audio();
  const isTea=id!=='pearl';
  if((save.pantry[id]||0)<=0)return;
  save.pantry[id]--;S.brewed[id]=1;miniCount++;
  const hard=Math.min(4,S.day-1);
  const kind=isTea?(id==='matcha'?'whisk':!feat('minis')?'steep':miniCount%3===0?'whisk':miniCount%2?'steep':'heat'):(feat('minis')?'knead':'stir');
  if(kind==='steep')mini={v:0,speed:100/Math.max(2.6,4.2-hard*.4),center:48+Math.random()*28,w:Math.max(9,16-hard*2)};
  else if(kind==='heat')mini={temp:40,holding:false,inZone:0,need:2.4,t:0,dur:7.5,lo:81,hi:Math.max(89,94-hard),maxT:40};
  else if(kind==='whisk')mini={froth:0,t:0,dur:6.5,lastX:null,dir:0,run:0,wx:32};
  else if(kind==='stir')mini={t:0,dur:6,s:20,peak:20,clumps:0,stirT:0,ang:0};
  else mini={t:0,period:Math.max(.72,1.05-hard*.07),beats:5,hits:0,miss:0,got:{},flash:null};
  Object.assign(mini,{kind,id,done:false});
  $('#mtext').textContent=MINI_INFO[kind].text(isTea?tea(id).name:'');
  $('#mact').textContent=MINI_INFO[kind].label;
  $<HTMLButtonElement>('#mact').disabled=false;$('#mini').hidden=false;renderPrep();
  $('#mini').scrollIntoView({block:'nearest'});$('#mact').focus({preventScroll:true});sfx.pour();
}
export function miniAct(){
  const m=mini;if(!m||m.done)return;
  if(m.kind==='steep')finishSteep();
  else if(m.kind==='stir'){m.s=Math.max(0,m.s-24);m.stirT=.25;sfx.click()}
  else if(m.kind==='whisk')whisk(m.dir>=0?-1:1);
  else if(m.kind==='knead'){
    const b=Math.round(m.t/m.period),d=Math.abs(m.t-b*m.period);
    if(b>=1&&b<=m.beats&&d<=.13&&!m.got[b]){m.got[b]=1;m.hits++;m.flash={ok:true,t:.25};beep(660+b*60,.08,'square',.035)}
    else{m.miss++;m.flash={ok:false,t:.25};sfx.nope()}
  }
}
export function whisk(dir){const m=mini;if(!m||m.kind!=='whisk'||m.done)return;if(dir!==m.dir){m.froth=Math.min(100,m.froth+7);m.dir=dir;m.wx=32+dir*8;beep(900+Math.random()*300,.03,'triangle',.02)}}
// holding for the kettle, swiping for the whisk
$('#mact').addEventListener('pointerdown',()=>{if(mini&&mini.kind==='heat'&&!mini.done){mini.holding=true;audio()}});
['pointerup','pointercancel','pointerleave'].forEach(ev=>$('#mact').addEventListener(ev,()=>{if(mini&&mini.kind==='heat')mini.holding=false}));
$('#mini').addEventListener('pointermove',e=>{
  const m=mini;if(!m||m.kind!=='whisk'||m.done)return;
  if(e.pointerType==='mouse'&&!e.buttons)return;
  if(m.lastX===null){m.lastX=e.clientX;return}
  const dx=e.clientX-m.lastX;if(Math.abs(dx)>=14){whisk(dx>0?1:-1);m.lastX=e.clientX}
});
$('#mini').addEventListener('pointerup',()=>{if(mini)mini.lastX=null});
export function finishSteep(){
  const m=mini,d=m.v-m.center,a=Math.abs(d);
  const q=a<=m.w/2?'perfect':a<=m.w/2+14?'good':d<0?'weak':'bitter';
  finishMini(q,teaBatch());
}
export function finishMini(q,n){
  const m=mini;m.done=true;
  // pearls are two steps: knead the dough first, then cook it
  if(m.kind==='knead'){
    $('#mtext').textContent=`Nhào xong (${QUAL[q].label}). Giờ thả viên bột vào nồi nấu…`;
    $<HTMLButtonElement>('#mact').disabled=true;$('#mact').textContent=QUAL[q].label;(q==='clumpy'?sfx.fail:sfx.ok)();
    setTimeout(()=>{if(mini!==m)return;
      mini={kind:'stir',id:m.id,t:0,dur:6,s:20,peak:20,clumps:0,stirT:0,ang:0,done:false,prevQ:q,prevN:n};
      $('#mtext').textContent='Bước 2/2 · Nấu trân châu: bấm Khuấy để hạt không dính vào nhau, đừng để thanh chạm vùng đỏ.';
      $('#mact').textContent=MINI_INFO.stir.label;$<HTMLButtonElement>('#mact').disabled=false;$('#mact').focus({preventScroll:true});sfx.pour();
    },1300);
    return;
  }
  if(m.prevQ){q=q==='clumpy'||m.prevQ==='clumpy'?'clumpy':q==='perfect'&&m.prevQ==='perfect'?'perfect':'good';n=Math.min(n,m.prevN)}
  addBatch(m.id,n,q);
  const isTea=m.id!=='pearl';
  if(q==='perfect'&&isTea){S.q.perfBrew++;checkQuests()}
  const perfect={steep:'Ủ hoàn hảo! Các ly này được tip +40%.',heat:'Nước đúng độ, trà thơm lừng! Tip +40%.',whisk:'Matcha mịn bọt! Tip +40%.',stir:'Trân châu hoàn hảo, dai và tơi! Tip +40%.',knead:'Nhào chuẩn nhịp, trân châu dai ngon! Tip +40%.'}[m.kind];
  const msg={perfect,good:isTea?'Pha tốt. Tip bình thường.':'Trân châu ổn. Tip bình thường.',
    weak:m.kind==='whisk'?'Ít bọt nên vị nhạt. Khách chỉ tip một nửa.':'Trà nhạt quá. Khách chỉ tip một nửa.',
    bitter:m.kind==='heat'?'Nước sôi quá nên trà bị đắng. Khách chỉ tip một nửa.':'Ủ lâu quá nên bị đắng. Khách chỉ tip một nửa.',
    clumpy:`Trân châu bị vón. Chỉ còn ${n} muỗng, khách tip một nửa.`}[q];
  $('#mtext').textContent=`Xong ${n} ${isTea?'ly '+tea(m.id).name:'muỗng trân châu'}. ${msg}`;
  $<HTMLButtonElement>('#mact').disabled=true;$('#mact').textContent=QUAL[q].label;
  (q==='perfect'?sfx.win:q==='good'?sfx.ok:sfx.fail)();
  setTimeout(()=>{if(mini===m){mini=null;renderPrep();$('#popen').focus({preventScroll:true})}},1500);
}
export function updateMini(dt){
  const m=mini;if(!m||m.done)return;
  if(m.kind==='steep'){m.v+=m.speed*dt;if(m.v>=100){m.v=100;finishSteep()}}
  else if(m.kind==='heat'){
    m.t+=dt;m.temp=Math.max(30,Math.min(106,m.temp+(m.holding?26+S.day*2:-14)*dt));m.maxT=Math.max(m.maxT,m.temp);
    if(m.temp>=m.lo&&m.temp<=m.hi)m.inZone+=dt;
    const lab=`${m.holding?'Đang đun':'Giữ để đun'} · ${Math.round(m.temp)}°C · ${m.inZone.toFixed(1)}/${m.need}s`;if($('#mact').textContent!==lab)$('#mact').textContent=lab;
    if(m.inZone>=m.need)finishMini(m.maxT>100?'good':m.t<=m.need+3?'perfect':'good',teaBatch());
    else if(m.t>=m.dur)finishMini(m.maxT>100?'bitter':m.inZone>=m.need*.5?'good':'weak',teaBatch());
  }else if(m.kind==='whisk'){
    m.t+=dt;m.froth=Math.max(0,m.froth-7*dt);
    if(m.froth>=100)finishMini(m.t<=3.8?'perfect':'good',teaBatch());
    else if(m.t>=m.dur)finishMini(m.froth>=60?'good':'weak',teaBatch());
  }else if(m.kind==='stir'){
    m.t+=dt;m.s+=(26+S.day*3)*(has('nonstick')?.65:1)*dt*(.7+Math.random()*.6);
    m.stirT=Math.max(0,m.stirT-dt);
    if(m.s>=100){m.clumps++;m.s=45;sfx.fail()}
    m.peak=Math.max(m.peak,m.s);
    if(m.t>=m.dur)finishMini(m.clumps?'clumpy':m.peak<75?'perfect':'good',m.clumps?Math.max(4,PEARL_BATCH-3*m.clumps):PEARL_BATCH);
  }else{
    m.t+=dt;if(m.flash){m.flash.t-=dt;if(m.flash.t<=0)m.flash=null}
    if(m.t>m.period*m.beats+.2){const miss=m.beats-m.hits;finishMini(miss===0&&m.miss<=1?'perfect':m.hits>=3?'good':'clumpy',miss<=2?PEARL_BATCH:Math.max(4,PEARL_BATCH-2*miss))}
  }
}
export function lerpHex(a,b,t){
  t=Math.max(0,Math.min(1,t));const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);
  const ch=s=>Math.round(((A>>s)&255)+(((B>>s)&255)-((A>>s)&255))*t);
  return '#'+((1<<24)|(ch(16)<<16)|(ch(8)<<8)|ch(0)).toString(16).slice(1);
}
export function heartOn(c,x,y){px(c,x,y,1,1,'#F2708F');px(c,x+2,y,1,1,'#F2708F');px(c,x,y+1,3,1,'#F2708F');px(c,x+1,y+2,1,1,'#F2708F')}
export function line(c,x0,y0,x1,y1,col){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0;for(let i=0;i<=n;i++)px(c,x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,2,2,col)}
export function drawMini(t){
  const m=mini;if(!m)return;const c=mg;
  px(c,0,0,64,40,'#FBE6DA');for(let x=0;x<64;x+=8)for(let y=0;y<34;y+=8)px(c,x+((y/8)%2)*4,y,1,1,'#F3D2C4');
  for(let i=0;i<3;i++){const ph=(t*.7+i/3)%1;c.globalAlpha=.45*(1-ph);px(c,24+i*6+Math.round(Math.sin(t*3+i)),9-ph*9,2,2,'#D9B8B0')}c.globalAlpha=1;
  if(m.kind==='heat'){
    const h=(m.temp-30)/76;
    px(c,0,36,64,4,'#6B4128');px(c,0,36,64,1,'#9A6340');
    const fl=m.holding?4:1;for(let x=20;x<44;x+=3){const hh=fl+((Math.floor(t*14)+x)%3);px(c,x,36-hh,2,hh,'#F2A541');px(c,x,36-hh,2,1,'#E86A6A')}
    blit(c,0,0,64,40,(x,y)=>inEll(x,y,32,24,12,9)&&y>16&&y<33,(x,y)=>x<26?'#FFB37A':'#F58A4E',OUT);
    px(c,26,13,12,3,'#F58A4E');px(c,26,13,12,1,'#FFC89E');px(c,30,10,4,3,OUT);px(c,26,11,2,2,'#F58A4E');px(c,36,11,2,2,'#F58A4E');
    for(let i=0;i<5;i++)px(c,44+i,22-i,2,2,'#F58A4E');px(c,17,18,2,10,OUT);px(c,18,17,4,1,OUT);px(c,18,28,4,1,OUT);
    px(c,29,23,1,1,OUT);px(c,34,23,1,1,OUT);px(c,31,25,2,1,'#E8788F');
    for(let i=0;i<Math.round(h*6);i++){const ph=(t*1.2+i/6)%1;c.globalAlpha=.6*(1-ph);px(c,49+Math.round(Math.sin(t*4+i)*2),16-ph*14,2,2,'#FFFFFF')}c.globalAlpha=1;
    px(c,56,6,5,28,OUT);px(c,57,7,3,26,'#FFFFFF');const th=Math.round(h*24);px(c,57,33-th,3,th,m.temp>m.hi?'#E0485F':m.temp>=m.lo?'#2F9A6C':'#F2A541');
  }else if(m.kind==='whisk'){
    px(c,0,36,64,4,'#6B4128');px(c,0,36,64,1,'#9A6340');
    blit(c,0,0,64,40,(x,y)=>inEll(x,y,32,22,17,13)&&y>20,'#FFF8F0','#B9A2B8');
    const top=Math.round(26-m.froth/100*6);
    for(let y=top;y<34;y++)for(let x=16;x<49;x++)if(inEll(x+.5,y+.5,32,22,15.5,11.5)&&y>20)px(c,x,y,1,1,y<top+2?'#D5EDB8':((x+y)%4?'#8FBF6A':'#7FB05A'));
    for(let i=0;i<Math.round(m.froth/12);i++)px(c,20+(i*7)%24,top-1+(i%2),2,1,'#EAF7DA');
    const wx=Math.round(m.wx);px(c,wx-1,2,2,14,'#D9B06B');for(let k=-3;k<=3;k++)px(c,wx+k,16,1,6,'#E8C27E');px(c,wx-4,21,8,1,'#C9A05A');
    m.wx+=(32-m.wx)*.08;
  }else if(m.kind==='knead'){
    px(c,0,34,64,6,'#EBD2BF');px(c,0,34,64,1,'#F7E6DA');
    const ok=m.flash&&m.flash.ok,bad=m.flash&&!m.flash.ok;
    blit(c,0,0,64,40,(x,y)=>inEll(x,y,32,22,7,5.5),(x,y)=>(x+y)%5===0?'#A77A56':'#C39A74',OUT);
    const p=(m.t%m.period)/m.period,r=7+16*(1-p),rr=r*.78;
    if(m.t<m.period*m.beats+.05)for(let a=0;a<Math.PI*2;a+=.09)px(c,32+Math.cos(a)*r,22+Math.sin(a)*rr,1,1,ok?'#2F9A6C':bad?'#E0485F':'#E0557A');
    for(let i=0;i<m.beats;i++)px(c,22+i*5,3,3,3,i<m.hits?'#2F9A6C':(i<Math.floor(m.t/m.period)?'#E0485F':'#D8C4D6'));
    if(ok){heartOn(c,40,12)}
  }else if(m.kind==='steep'){
    const T=tea(m.id).color,p=m.v/100,cz=m.center/100;
    const col=p<cz?lerpHex('#E9E4CF',T,p/cz):lerpHex(T,'#3A2418',(p-cz)/(1-cz)*.85);
    px(c,0,36,64,4,'#6B4128');px(c,0,36,64,1,'#9A6340');
    for(let i=0;i<6;i++)px(c,13-i,22-i,3,2,'#A58DB8');
    px(c,45,19,3,2,'#A58DB8');px(c,47,21,2,9,'#A58DB8');px(c,45,30,3,2,'#A58DB8');
    blit(c,0,0,64,40,(x,y)=>inEll(x,y,30,25,15,10.5)&&y>15,(x,y)=>y<18.5?'#F4ECF4':col,'#A58DB8');
    if(!m.done){
      for(let i=0;i<7;i++){const a=t*2.2+i*.9;px(c,33+Math.round(Math.cos(a)*(4+i)),27+Math.round(Math.sin(a)*2.5),2,1,lerpHex(col,'#2A1810',.4))}
      px(c,31,22,7,7,OUT);px(c,32,23,5,5,'#E8D8B0');px(c,32,23,5,1,'#F6ECCF');
      px(c,34,5,1,17,'#F4EBD6');px(c,33,2,4,4,'#F2A541');px(c,33,2,4,1,'#F7C27A');
    }
    c.globalAlpha=.3;px(c,18,20,2,9,'#FFFFFF');c.globalAlpha=1;
    px(c,21,13,18,3,METAL);px(c,21,13,18,1,METAL_HI);px(c,27,10,6,3,METAL);px(c,27,10,6,1,METAL_HI);px(c,27,8,2,2,METAL);px(c,31,8,2,2,METAL);px(c,27,8,1,1,OUT);px(c,32,8,1,1,OUT);
  }else{
    for(let x=18;x<46;x+=3){const h=2+((Math.floor(t*12)+x)%3);px(c,x,40-h,2,h,'#F2A541');px(c,x,40-h,2,1,'#E86A6A')}
    px(c,6,19,5,3,OUT);px(c,53,19,5,3,OUT);
    px(c,11,16,42,21,OUT);px(c,12,16,40,20,METAL);px(c,13,18,2,16,METAL_HI);px(c,12,34,40,2,'#8C86A4');
    blit(c,0,0,64,40,(x,y)=>inEll(x,y,32,16,19.5,5.5),(x,y)=>'#6A4636','#E6E2F0');
    for(let i=0;i<5;i++){const bx=(i*13+Math.floor(t*6)*7)%34+15,by=14+(i*3)%5;if(inEll(bx+.5,by+.5,32,16,18,4.5))px(c,bx,by,1,1,'#9A7060')}
    const k0=Math.max(.15,1-m.s/110);
    for(let i=0;i<16;i++){
      const a=m.ang+i*(Math.PI*2/16)+(i%3)*.4,k=k0*(i%2?1:.62);
      const x=32+Math.cos(a)*16*k,y=16+Math.sin(a)*4*k;
      px(c,x-1,y-1,2,2,'#2A160C');px(c,x-1,y-1,1,1,'#8A6450');
    }
    for(let j=0;j<m.clumps;j++){const bx=22+j*10,by=15+(j%2);px(c,bx,by,5,3,'#2A160C');px(c,bx+1,by-1,3,1,'#2A160C');px(c,bx+1,by,1,1,'#8A6450')}
    const hx=32+Math.cos(m.ang*1.5)*9,hy=16+Math.sin(m.ang*1.5)*2.5;
    line(c,hx,hy,hx+14,hy-14,METAL);px(c,hx-2,hy-1,4,3,METAL_HI);
    m.ang+=(1/60)*(m.stirT>0?10:2.2)*k0;
  }
  // meter
  const zone=$('#mzone'),fill=$('#mfill'),needle=$('#mneedle');
  if(m.kind==='steep'){
    zone.className='zone';zone.style.left=(m.center-m.w/2)+'%';zone.style.width=m.w+'%';
    fill.style.width='0';needle.hidden=false;needle.style.left=m.v+'%';
  }else if(m.kind==='heat'){
    const pc=v=>(v-30)/76*100;zone.className='zone band';zone.style.left=pc(m.lo)+'%';zone.style.width=(pc(m.hi)-pc(m.lo))+'%';
    fill.style.width=pc(m.temp)+'%';needle.hidden=false;needle.style.left=Math.min(100,m.t/m.dur*100)+'%';
  }else if(m.kind==='whisk'){
    zone.style.width='0';fill.style.width=m.froth+'%';needle.hidden=false;needle.style.left=Math.min(100,m.t/m.dur*100)+'%';
  }else if(m.kind==='knead'){
    zone.style.width='0';fill.style.width=(m.hits/m.beats*100)+'%';needle.hidden=false;needle.style.left=Math.min(100,m.t/(m.period*m.beats)*100)+'%';
  }else{
    zone.className='zone warn';zone.style.left='75%';zone.style.width='25%';
    fill.style.width=Math.min(100,m.s)+'%';needle.hidden=false;needle.style.left=Math.min(100,m.t/m.dur*100)+'%';
  }
}
$('#mact').addEventListener('click',miniAct);
$('#popen').addEventListener('click',()=>{
  if(mini)return;
  if(!unlocked(TEAS).some(t=>stockN(t.id)>0)){$('#pspent').textContent='Pha ít nhất một loại trà rồi mới mở cửa nhé.';sfx.nope();return}
  $('#prep').hidden=true;S.phase='open';buildControls();renderTickets();updateHud();
  hint('Mở cửa rồi! Vị khách đầu tiên đang tới.');
});
export function resetMini(){mini=null}
