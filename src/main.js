import './styles/main.css';
import {EVENTS,SEASONS,REGULARS,TEAS,TOPS,SUGARS,QUAL,PEARL_BATCH,ICES,TYPES,LEVELS,TUB,SUPPLY,RECIPES,UPGRADES,STAFF,DELIVERY,RUSH,FEATURES,NEWS,MINI_INFO,GEAR,GEAR_NAME} from './data.js';

const $=s=>document.querySelector(s);
const scene=$('#scene'), g=scene.getContext('2d');
const cupC=$('#cup'), cg=cupC.getContext('2d');
const W=160,H=80,SLOTS=[30,80,130],DAY_LEN=150,OUT='#120F26';






const stockName=id=>id==='pearl'?'Trân châu':tea(id).name;
const stockN=id=>S.stock[id].reduce((a,b)=>a+b.n,0);
const nextQ=id=>(S.stock[id][0]||{}).q;
function addBatch(id,n,q){S.stock[id].push({n,q})}
function takeServing(id){const b=S.stock[id][0];b.n--;if(b.n<=0)S.stock[id].shift();return b.q}


const tea=id=>TEAS.find(t=>t.id===id), top=id=>TOPS.find(t=>t.id===id);
const pick=a=>a[Math.floor(Math.random()*a.length)];
const shuffle=a=>{for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a};
const unlocked=list=>list.filter(x=>save.owned.includes(x.id));
const maxTops=()=>has('double')?2:1;
const goalFor=d=>400+110*(d-1);
const orderPrice=o=>Math.round((tea(o.tea).price+o.tops.reduce((s,t)=>s+top(t).price,0))*ev().price);

const NEW_SAVE=()=>({day:1,wallet:200,xp:0,owned:['black','jasmine','taro','pearl','grass'],upgrades:[],pantry:{black:2,jasmine:1,taro:1,pearl:2,grass:12,cup:40,straw:40,film:40,bag:10},staff:{},history:[]});
let save=NEW_SAVE();
try{const v=JSON.parse(localStorage.getItem('tcs-save3'));if(v&&v.owned)save=Object.assign(NEW_SAVE(),v)}catch(e){}
// older saves: hand out a starter box of cups, straws, film and bags once
if(save.pantry.cup===undefined)Object.assign(save.pantry,{cup:40,straw:40,film:40,bag:10});
const persist=()=>{try{localStorage.setItem('tcs-save3',JSON.stringify(save))}catch(e){}};
const has=id=>save.upgrades.includes(id);

const levelOf=xp=>LEVELS.filter(t=>xp>=t).length;
const lvProgress=xp=>{const l=levelOf(xp);if(l>=LEVELS.length)return 1;return (xp-LEVELS[l-1])/(LEVELS[l]-LEVELS[l-1])};


const packOf=it=>it.pack||(it.tub?TUB:1);
function useGear(id){if((save.pantry[id]||0)<=0){hint(`Hết ${GEAR_NAME[id]}!`);orderDelivery(id);return false}save.pantry[id]--;syncGear();return true}



const staffOn=id=>!!(save.staff&&save.staff[id]&&save.staff[id].hired&&save.staff[id].on);

// new players meet one new thing per day instead of everything at once

const feat=f=>!!S&&S.day>=FEATURES[f];
const sealNeeded=()=>feat('seal');

const teaBatch=()=>has('bigpot')?12:8;
const isTub=id=>!!(SUPPLY.find(x=>x.id===id)||{}).tub;

/* ---------- settings ---------- */
const settings={music:70,sfx:80,shake:true,vi:true,layout:'new'};
try{Object.assign(settings,JSON.parse(localStorage.getItem('tcs-settings'))||{})}catch(e){}
const saveSettings=()=>{try{localStorage.setItem('tcs-settings',JSON.stringify(settings))}catch(e){}};
const musicBase=()=>.9*settings.music/100;

/* ---------- sound ---------- */
let actx=null,muted=false;
// a tenth of a second of silence as a real audio file; playing it (looped) inside a tap moves iPhones to the
// media audio channel, so the game is audible even with the ring/silent switch on
let silentEl=null;
function silentWavURL(){
  const n=4410,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,44100,true);v.setUint32(28,88200,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  return URL.createObjectURL(new Blob([b],{type:'audio/wav'}));
}
function audio(){try{
  try{if(navigator.audioSession&&navigator.audioSession.type!=='playback')navigator.audioSession.type='playback'}catch(e){}
  if(!actx){
    actx=new (window.AudioContext||window.webkitAudioContext)();
    const b=actx.createBuffer(1,1,22050),src=actx.createBufferSource();src.buffer=b;src.connect(actx.destination);src.start(0);
  }
  if(!silentEl){try{silentEl=new Audio(silentWavURL());silentEl.loop=true;silentEl.setAttribute('playsinline','');silentEl.play().catch(()=>{silentEl=null})}catch(e){silentEl=null}}
  else if(silentEl.paused)silentEl.play().catch(()=>{});
  if(actx.state!=='running')actx.resume().catch(()=>{});
  if(music.on&&!music.started)startMusic();
}catch(e){}}
// iPhones only unlock sound on a finished tap (touchend/click), not on touch start
['touchend','click'].forEach(ev=>document.addEventListener(ev,()=>audio(),{capture:true,passive:true}));
document.addEventListener('keydown',()=>audio());
function beep(f,d,type='square',v=.04,to,delay=0){
  if(muted||!actx)return;
  const t0=actx.currentTime+delay,o=actx.createOscillator(),gn=actx.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);if(to)o.frequency.exponentialRampToValueAtTime(to,t0+d);
  v*=settings.sfx/100;if(v<.0005)return;gn.gain.setValueAtTime(v,t0);gn.gain.exponentialRampToValueAtTime(.0001,t0+d);
  o.connect(gn).connect(actx.destination);o.start(t0);o.stop(t0+d+.02);
}
// a synthesized meow: a buzzy voice through a moving 'mi-a-ow' mouth filter
function meow(pitch=1,vol=.07,delay=0){
  if(muted||!actx)return;const v=vol*settings.sfx/100;if(v<.0005)return;
  const t=actx.currentTime+delay,o=actx.createOscillator(),o2=actx.createOscillator(),f=actx.createBiquadFilter(),g2=actx.createGain(),gn=actx.createGain();
  const b=520*pitch,d=.55+Math.random()*.15;
  o.type='sawtooth';o2.type='sine';
  [o,o2].forEach(x=>{x.frequency.setValueAtTime(b*.85,t);x.frequency.linearRampToValueAtTime(b*1.32,t+.13);x.frequency.linearRampToValueAtTime(b*1.12,t+d*.55);x.frequency.linearRampToValueAtTime(b*.72,t+d)});
  f.type='bandpass';f.Q.value=3.5;f.frequency.setValueAtTime(800,t);f.frequency.linearRampToValueAtTime(1900,t+.16);f.frequency.linearRampToValueAtTime(1150,t+d*.8);
  g2.gain.value=.6;
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+.04);gn.gain.setValueAtTime(v*.85,t+d*.6);gn.gain.linearRampToValueAtTime(0,t+d);
  o.connect(f).connect(gn);o2.connect(g2).connect(gn);gn.connect(actx.destination);
  o.start(t);o2.start(t);o.stop(t+d+.05);o2.stop(t+d+.05);
}
// a soft purr: low rumble pulsing about 24 times a second
function purr(dur=1.3,vol=.09){
  if(muted||!actx)return;const v=vol*settings.sfx/100;if(v<.0005)return;
  const t=actx.currentTime,o=actx.createOscillator(),lp=actx.createBiquadFilter(),am=actx.createGain(),lfo=actx.createOscillator(),depth=actx.createGain(),gn=actx.createGain();
  o.type='sawtooth';o.frequency.value=48;lp.type='lowpass';lp.frequency.value=320;
  lfo.frequency.value=24;depth.gain.value=.5;am.gain.value=.5;lfo.connect(depth).connect(am.gain);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+.15);gn.gain.setValueAtTime(v,t+dur-.3);gn.gain.linearRampToValueAtTime(0,t+dur);
  o.connect(lp).connect(am).connect(gn).connect(actx.destination);
  o.start(t);lfo.start(t);o.stop(t+dur+.05);lfo.stop(t+dur+.05);
}
const sfx={
  click:()=>beep(660,.05,'square',.03),
  pour:()=>beep(260,.3,'triangle',.06,520),
  bell:()=>{beep(1175,.09,'square',.025);beep(1568,.14,'square',.025,null,.08)},
  win:()=>{[523,659,784,1047].forEach((f,i)=>beep(f,.1,'square',.035,null,i*.07))},
  ok:()=>{beep(523,.1,'square',.03);beep(659,.12,'square',.03,null,.08)},
  fail:()=>beep(220,.35,'sawtooth',.03,98),
  nope:()=>beep(160,.12,'square',.03),
};

/* ---------- background music: an original lo-fi loop generated live ---------- */
const music={on:true,started:false};
try{if(localStorage.getItem('tcs-music')==='off')music.on=false}catch(e){}
const mtof=m=>440*Math.pow(2,(m-69)/12);
const STEP=60/74/2; // eighth notes at 74 bpm
const PROG=[ // 8-bar loop: [bass root, chord voicing]
  [41,[57,60,64,67]],[40,[55,59,62,64]],[38,[53,57,60,64]],[36,[52,55,59,64]],
  [34,[50,53,57,62]],[33,[48,52,55,60]],[31,[50,53,58,62]],[36,[48,53,55,58]],
];
function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function startMusic(){
  if(!actx||music.started)return;
  music.started=true;
  const now=actx.currentTime;
  const master=actx.createGain();master.gain.setValueAtTime(0,now);master.gain.linearRampToValueAtTime(Math.max(.0001,musicBase()),now+3);
  const warm=actx.createBiquadFilter();warm.type='lowpass';warm.frequency.value=2300;warm.Q.value=.4;
  warm.connect(master).connect(actx.destination);
  const delay=actx.createDelay(2);delay.delayTime.value=STEP*3;
  const fb=actx.createGain();fb.gain.value=.3;const wet=actx.createGain();wet.gain.value=.35;
  const dtone=actx.createBiquadFilter();dtone.type='lowpass';dtone.frequency.value=1600;
  delay.connect(dtone).connect(fb).connect(delay);dtone.connect(wet).connect(warm);
  // slow tape wobble on the keys
  const lfo=actx.createOscillator();lfo.frequency.value=.35;const lfoAmt=actx.createGain();lfoAmt.gain.value=7;lfo.connect(lfoAmt);lfo.start();
  // noise for crackle and percussion
  const len=actx.sampleRate*2,buf=actx.createBuffer(1,len,actx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  // vinyl: mostly silence, a whisper of hiss and a few soft pops (no steady rain-like wash)
  const vlen=actx.sampleRate*4,vbuf=actx.createBuffer(1,vlen,actx.sampleRate),v=vbuf.getChannelData(0);
  for(let i=0;i<vlen;i++)v[i]=(Math.random()*2-1)*.04;
  for(let k=0;k<7;k++){const at=Math.floor(Math.random()*(vlen-200)),amp=.4+Math.random()*.5;for(let j=0;j<60;j++)v[at+j]+=(Math.random()*2-1)*amp*Math.exp(-j/12)}
  const crackle=actx.createBufferSource();crackle.buffer=vbuf;crackle.loop=true;
  const chp=actx.createBiquadFilter();chp.type='bandpass';chp.frequency.value=1800;chp.Q.value=.7;const cg2=actx.createGain();cg2.gain.value=.012;
  crackle.connect(chp).connect(cg2).connect(master);crackle.start();
  Object.assign(music,{master,warm,delay,lfo,lfoAmt,buf,crackle,next:now+.15,step:0,last:69});
  music.timer=setInterval(scheduleMusic,80);
}
function stopMusic(){
  if(!music.started)return;music.started=false;clearInterval(music.timer);
  const m={...music},t=actx.currentTime;
  m.master.gain.cancelScheduledValues(t);m.master.gain.setTargetAtTime(0,t,.4);
  setTimeout(()=>{try{m.crackle.stop();m.lfo.stop();m.master.disconnect()}catch(e){}},2500);
}
function musicLevel(v){if(music.started){const t=actx.currentTime;music.master.gain.cancelScheduledValues(t);music.master.gain.setTargetAtTime(v,t,.5)}}
function voice(type,freq,t,dur,vol,dest,detune){
  const o=actx.createOscillator(),gn=actx.createGain();o.type=type;o.frequency.value=freq;
  if(detune)music.lfoAmt.connect(o.detune);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(vol,t+.02);
  gn.gain.exponentialRampToValueAtTime(vol*.3,t+Math.min(.7,dur*.5));gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(gn).connect(dest);o.start(t);o.stop(t+dur+.05);
}
function keys(m,t,dur,vol){voice('sine',mtof(m),t,dur,vol,music.warm,true);voice('triangle',mtof(m)*2.003,t,dur*.6,vol*.1,music.warm,true)}
function bell(m,t){const f=mtof(m);[music.warm,music.delay].forEach(dst=>{voice('sine',f,t,1.6,.06,dst);voice('sine',f*3.01,t,.5,.008,dst)})}
function bass(m,t,dur){const o=actx.createOscillator(),gn=actx.createGain();o.type='sine';o.frequency.value=mtof(m);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(.2,t+.03);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn).connect(music.warm);o.start(t);o.stop(t+dur+.05)}
function kick(t){const o=actx.createOscillator(),gn=actx.createGain();o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);
  gn.gain.setValueAtTime(.26,t);gn.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(gn).connect(music.master);o.start(t);o.stop(t+.3)}
function noiseHit(t,type,f,vol,dur){const src=actx.createBufferSource();src.buffer=music.buf;const fl=actx.createBiquadFilter();fl.type=type;fl.frequency.value=f;
  const gn=actx.createGain();gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.connect(fl).connect(gn).connect(music.warm);src.start(t,Math.random()*1.5);src.stop(t+dur+.02)}
function scheduleMusic(){
  if(!music.started)return;
  while(music.next<actx.currentTime+.4){
    const st=music.step,pos=st%8,bar=Math.floor(st/8)%8,loop=Math.floor(st/64);
    const swing=pos%2?STEP*.18:0,t=music.next+swing;
    const [root,ch]=PROG[bar];
    if(pos===0){ch.forEach((n,i)=>keys(n,t+i*.025,STEP*8,.075));bass(root,t,STEP*3.5)}
    if(pos===5)bass(root+7,t,STEP*2.5);
    if(pos===0||pos===5)kick(t);
    if(pos===4)noiseHit(t,'bandpass',1900,.045,.09);
    if(pos%2)noiseHit(t,'highpass',7000,.007,.03);
    // melody: phrases repeat for two loops, then a new phrase
    if(pos===0)music.rand=rng(1000+(Math.floor(loop/2)%4)*77+bar);
    const r=music.rand;
    const pr=[.55,.1,.35,.45,.2,.3,.5,.12][pos]*(bar===3||bar===7?.5:1);
    if(r()<pr){
      const pool=[];ch.forEach(n=>{pool.push(n+12);if(n+24<=84)pool.push(n+24)});
      const cand=pool.filter(n=>n>=64&&n<=84).sort((a,b)=>Math.abs(a-music.last)-Math.abs(b-music.last)).slice(0,3);
      const n=cand[Math.floor(r()*cand.length)];music.last=n;bell(n,t+.01);
    }
    music.next+=STEP;music.step++;
  }
}
document.addEventListener('visibilitychange',()=>{if(!actx)return;if(document.hidden)actx.suspend();else actx.resume().catch(()=>{})});

/* ---------- state ---------- */
let S, cup;
const emptyCup=()=>({tea:null,sugar:null,ice:null,tops:[],level:0,teaQ:null,pearlQ:null,sealed:false});
function newDay(day){
  parts=[];lifted=null;
  S={orderNo:0,focus:null,sealT:0,bagJob:null,onlineShown:false,day,phase:'ready',time:0,spawnT:1.2,customers:[],slots:[null,null,null],cash:0,tips:0,wasted:0,washT:0,served:0,perfect:0,missed:0,streak:0,bestStreak:0,nextId:1,stock:{},brewing:{},delivering:{},brewed:{},naJob:null,naCd:0,autoServe:null,hoaT:0,rushShown:false,spent:0,dumped:0,xp0:save.xp,wallet0:save.wallet,q:{pearl:0,tea:{},picky:0,cat:0,perfBrew:0,pet:0}};
  if(!questCache||questCache.day!==day)questCache={day,list:makeQuests(day)};
  S.quests=questCache.list.map(q=>({...q,done:false,failed:false}));
  unlocked(TEAS).forEach(t=>S.stock[t.id]=[]);S.stock.pearl=[];
  signShown=false;signTarget=false;signFlip=0;
  mini=null;$('#mini').hidden=true;
  document.body.classList.remove('is-paused','is-washing');$('#pausedlab').hidden=true;$('#pause').textContent='Tạm dừng';
  cup=emptyCup();buildControls();renderTickets();updateHud();cupChanged();hint('');syncGear();
}

/* ---------- daily quests ---------- */
const QUESTS=[
  {id:'perfect',w:3,make:d=>{const n=4+Math.min(8,d);return{text:`Phục vụ ${n} ly hoàn hảo`,target:n,prog:()=>S.perfect,cash:40+d*8,xp:20}}},
  {id:'streak',w:2,make:d=>{const n=Math.min(8,3+Math.floor(d/2));return{text:`Đạt chuỗi ${n} ly hoàn hảo liên tiếp`,target:n,prog:()=>S.bestStreak,cash:50+d*8,xp:25}}},
  {id:'pearl',w:2,make:d=>{const n=3+Math.floor(d/2);return{text:`Phục vụ ${n} ly có trân châu`,target:n,prog:()=>S.q.pearl,cash:35+d*6,xp:15}}},
  {id:'tea',w:2,make:(d,r)=>{const ts=unlocked(TEAS),t=ts[Math.floor(r()*ts.length)],n=3+Math.floor(d/3);return{text:`Phục vụ ${n} ly ${t.name}`,target:n,prog:()=>S.q.tea[t.id]||0,cash:35+d*6,xp:15}}},
  {id:'earn',w:2,make:d=>{const n=Math.round(goalFor(d)*1.15/10)*10;return{text:`Kiếm ${n}k trong một ca`,target:n,unit:'k',prog:()=>S.cash,cash:60+d*8,xp:25}}},
  {id:'nowalk',w:1,make:d=>({text:'Không để khách nào bỏ về',target:1,endOnly:true,fail:()=>S.missed>0,cash:70+d*10,xp:30})},
  {id:'nodump',w:1,make:d=>({text:'Hết ca mà không đổ ly nào',target:1,endOnly:true,fail:()=>S.dumped>0,cash:40+d*6,xp:15})},
  {id:'brew',w:1,make:d=>({text:'Pha một mẻ trà Hoàn hảo',target:1,prog:()=>S.q.perfBrew,cash:30+d*5,xp:15})},
  {id:'picky',w:1,make:d=>({text:'Làm hài lòng 2 khách khó tính',target:2,prog:()=>S.q.picky,cash:45+d*7,xp:20})},
  {id:'pet',w:2,make:d=>({text:'Vuốt ve mèo của tiệm 3 lần',target:3,prog:()=>S.q.pet,cash:25+d*4,xp:10})},
  {id:'cat',w:1,need:()=>has('catbed'),make:d=>({text:'Chiều lòng một bé Mèo VIP',target:1,prog:()=>S.q.cat,cash:40+d*6,xp:20})},
];
let questCache=null;
function makeQuests(day){
  const r=rng(9000+day*131);
  let pool=QUESTS.filter(q=>!q.need||q.need()),out=[];
  while(out.length<3&&pool.length){
    const tot=pool.reduce((a,q)=>a+q.w,0);let x=r()*tot,i=0;
    while(x>pool[i].w){x-=pool[i].w;i++}
    out.push({id:pool[i].id,...pool[i].make(day,r),done:false,failed:false});pool.splice(i,1);
  }
  return out;
}
function questProg(q){return q.endOnly?(q.fail()?0:(q.done?1:0)):Math.min(q.target,q.prog())}
function checkQuests(final){
  S.quests.forEach(q=>{
    if(q.done||q.failed)return;
    if(q.endOnly){if(q.fail())q.failed=true;else if(final){if(S.served>=5)q.done=true;else q.failed=true}return}
    if(q.prog()>=q.target){q.done=true;if(!final)questToast(q)}
  });
  updateHud();
}
function questToast(q){
  [784,988,1175].forEach((f,i)=>beep(f,.12,'triangle',.05,null,i*.09));
  if(S.phase==='prep'){$('#mtext').textContent+=` Xong nhiệm vụ: ${q.text}!`;return}
  floatText(1,'Xong nhiệm vụ!','streak');
  hint(`Xong nhiệm vụ: ${q.text}. Nhận +${q.cash}k và +${q.xp} XP khi đóng cửa.`);
}
function questRows(list){
  return list.map(q=>{
    const p=questProg(q),st=q.done?'done':q.failed?'failed':'';
    const sub=q.endOnly?(q.failed?'Chưa đạt hôm nay':q.done?'Hoàn thành':'Tính lúc đóng cửa · cần phục vụ ít nhất 5 ly'):`${p}${q.unit||''} / ${q.target}${q.unit||''}`;
    return `<div class="quest ${st}"><span class="qdot" aria-hidden="true"></span><div>${q.text}<small>${sub}</small>${q.endOnly?'':`<div class="qbar"><i style="width:${p/q.target*100}%"></i></div>`}</div><div class="qrew">+${q.cash}k<br>+${q.xp} XP</div></div>`;
  }).join('');
}

/* ---------- customers ---------- */
/* ---------- daily events, seasons and regulars ---------- */
const season=(()=>{const d=new Date(),m=d.getMonth()+1,day=d.getDate();if((m===9&&day>=12)||(m===10&&day<=12))return'trungthu';if((m===1&&day>=20)||(m===2&&day<=20))return'tet';return null})();
const ev=()=>EVENTS[save.event&&save.eventDay===save.day?save.event:'normal']||EVENTS.normal;
const tipBoost=()=>ev().tip*(season?SEASONS[season].tip:1);
function rollEvent(day){
  if(day<3)return'normal';
  const keys=Object.keys(EVENTS).filter(k=>k==='normal'||k!==save.lastEvent);
  let x=Math.random()*keys.reduce((a,k)=>a+EVENTS[k].w,0);
  for(const k of keys){x-=EVENTS[k].w;if(x<=0)return k}return'normal';
}
const friendOf=id=>{save.friends=save.friends||{};return save.friends[id]||(save.friends[id]={met:false,hearts:0,gift:false})};
const canMake=o=>save.owned.includes(o.tea)&&o.tops.every(t=>save.owned.includes(t));
function befriend(c){
  const r=REGULARS.find(x=>x.id===c.friend),f=friendOf(c.friend);
  if(!f.met){f.met=true;floatText(c.slot,'Bạn mới!','streak');hint(`Làm quen với ${r.name}! Xem trong Sổ khách quen ở chợ.`)}
  if(f.hearts<5){f.hearts++;setTimeout(()=>floatText(c.slot,`♥ ${f.hearts}/5`,'good'),350)}
  if(f.hearts===3&&!f.story){f.story=true;hint(`Bạn đã thân hơn với ${r.name}. Câu chuyện của họ đã mở trong Sổ khách quen.`)}
  if(f.hearts===5&&!f.gift){f.gift=true;S.cash+=120;save.xp+=30;hint(`${r.gift} +120k và +30 XP!`);sfx.win();updateHud()}
  persist();
}
function pickType(){
  if(feat('online')&&Math.random()<Math.min(.5,Math.min(.28,.1+.02*S.day)*ev().online))return 'online';
  const r=Math.random()*100;
  if(!has('catbed'))return r<68?'regular':r<88?'rush':'picky';
  return r<55?'regular':r<77?'rush':r<92?'picky':'cat';
}
function makeLook(type){
  if(type==='cat')return{fur:pick(['#F2A541','#E8E0D0','#6A6478','#C08A5B']),shirt:pick(['#6FA8E8','#E86A6A','#7ED6B8'])};
  let style=type==='online'?'short':pick(['short','bob','bun','long','cap','spiky']);
  return{skin:pick(['#F3CDAA','#E2AD83','#C68863','#8D5A3B']),hair:pick(['#2A1E1A','#4A2E22','#7A4A2A','#C9A15A','#3B2F5A','#9E4A3A']),
    style,cap:pick(['#E86A6A','#6FA8E8','#F2A541']),shirt:type==='online'?'#F58DA6':type==='rush'?pick(['#DCE3EE','#C9D6E8']):pick(['#E86A6A','#7ED6B8','#6FA8E8','#F2A541','#B79BD6','#5C8F5A','#E4D3B0'])};
}
function genOrder(type){
  const t=pick(unlocked(TEAS));
  let n=pick(maxTops()===1?[0,1,1]:[0,1,1,2]);
  let tops=shuffle(unlocked(TOPS).map(x=>x.id)).slice(0,Math.min(n,maxTops()));
  if(type==='cat'&&!tops.includes('pearl'))tops=['pearl',...tops].slice(0,maxTops());
  const qty=type==='online'?2+(S.day>=3&&Math.random()<.5?1:0):type!=='cat'&&feat('multi')&&Math.random()<.16?2:1;
  return{tea:t.id,sugar:pick([0,30,50,50,70,70,100]),ice:ev().iceHeavy?pick([1,2,2,2]):pick([0,1,1,2,2]),tops,qty};
}
function spawn(force){
  const free=[0,1,2].filter(i=>!S.slots[i]);
  if(!free.length)return false;
  const slot=pick(free),type=force||pickType(),pat=ev().pat*TYPES[type].patience*Math.max(.62,1-.07*(S.day-1))*(has('lights')?1.2:1)*(staffOn('tu')?1.15:1);
  let order=genOrder(type),look=makeLook(type),friend=null;
  // sometimes a regular walks in and orders their favourite
  if(type==='regular'&&Math.random()<.35){
    const here=S.customers.map(c=>c.friend);
    const r=pick(REGULARS.filter(r=>canMake(r.fav)&&!here.includes(r.id)).concat([null]));
    if(r){friend=r.id;order={...r.fav,tops:[...r.fav.tops],qty:1};look={...r.look,cap:r.look.cap||'#F58DA6'}}
  }
  if(type==='reviewer'){order.qty=1;look.shades=true}
  const pat2=pat*1.3+(order.qty-1)*12;
  const c={friend,no:++S.orderNo,id:S.nextId++,slot,type,look,order,x:W+12,state:'walk',pat:pat2,maxPat:pat2,result:null,bubbleT:0,bagged:0,perfectCups:0,qmSum:0};
  if(type==='online'&&!S.onlineShown){S.onlineShown=true;setTimeout(()=>{if(S.phase==='open')hint(`Đơn online! Shipper cần ${order.qty} ly: pha từng ly, dán nắp, cho vào túi, rồi đóng túi để giao.`)},900)}
  S.slots[slot]=c;S.customers.push(c);renderTickets();return true;
}
function leave(c,result){
  c.state='leave';c.result=result;c.bubbleT=1;
  if(S.slots[c.slot]===c)S.slots[c.slot]=null;
  renderTickets();
}

/* ---------- serving ---------- */
function serve(slot){
  if(S.phase!=='open')return;
  const c=S.slots[slot];if(!c||c.state!=='wait')return;
  const o=c.order,T=TYPES[c.type],qty=o.qty||1;
  if(S.bagJob)return;
  if(qty>1&&c.bagged>=qty){bagUp(slot);return}
  if(!cup.tea){hint(qty>1?`Đơn này cần ${qty} ly giống nhau: pha từng ly, dán nắp rồi cho vào túi.`:'Hãy rót trà trước đã.');sfx.nope();return}
  if(!cup.sealed){if(sealNeeded()){hint('Dán nắp ly trước đã (nút Dán nắp hoặc phím S).');sfx.nope();return}if(!useGear('film'))return;cup.sealed=true}
  if(!useGear('straw'))return;
  let err=0;
  if(cup.tea!==o.tea)err++;if(cup.sugar!==o.sugar)err++;if(cup.ice!==o.ice)err++;
  for(const t of cup.tops)if(!o.tops.includes(t))err++;
  for(const t of o.tops)if(!cup.tops.includes(t))err++;
  const price=Math.round(orderPrice(o)*T.pay);
  liftCup();
  const carry={color:tea(cup.tea).color,pearls:cup.tops.includes('pearl'),foam:cup.tops.includes('foam')};
  if(qty>1){
    const qmc=QUAL[cup.teaQ||'good'].mul*(cup.tops.includes('pearl')?QUAL[cup.pearlQ||'good'].mul:1);
    if(err===0||(err===1&&!T.strict)){
      c.bagged++;if(c.bagged<qty)S.repeat={cid:c.id,tea:cup.tea,sugar:cup.sugar,ice:cup.ice,tops:[...cup.tops]};if(err===0){c.perfectCups++;c.qmSum+=qmc;S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak)}else S.streak=0;
      floatText(slot,`${c.bagged}/${qty} ly`,'good');sfx.ok();beep(420,.12,'triangle',.04,260,.08);
      hint(c.bagged<qty?`Đã cho vào túi ${c.bagged}/${qty}. Bấm “Pha y chang” để rót ly tiếp theo.`:'Đủ ly rồi! Bấm “Đóng túi” để giao.');
    }else{
      S.streak=0;c.pat=Math.max(1,c.pat-c.maxPat*.2);floatText(slot,'Sai món','bad');sfx.fail();shake();
      hint(T.strict?'Khách khó tính muốn đúng từng chi tiết. Ly này phải bỏ.':`Ly này sai ${err} chỗ nên phải bỏ. Pha lại ly khác nhé.`);
    }
    cup=emptyCup();cupChanged();renderTickets();updateHud();checkQuests();return;
  }
  if(err===0){
    S.streak++;S.bestStreak=Math.max(S.bestStreak,S.streak);
    const combo=S.streak>=3?1.5:1;
    const qm=QUAL[cup.teaQ||'good'].mul*(cup.tops.includes('pearl')?QUAL[cup.pearlQ||'good'].mul:1);
    const close=c.friend&&friendOf(c.friend).hearts>=3?1.5:1;
    const tip=Math.max(1,Math.round((6*T.tip*(c.pat/c.maxPat)*combo+1)*qm*(has('tipjar')?1.25:1)*tipBoost()*close));
    save.xp+=5;
    S.cash+=price+tip;S.tips+=tip;S.perfect++;S.served++;
    leave(c,'love');c.carry=carry;floatText(slot,`+${price+tip}k`,'good');sfx.win();
    sparkle(c.x,44);coins(c.x,Math.min(7,Math.ceil(tip/3)));
    if([3,5,10,15,20].includes(S.streak))floatText(slot,`Chuỗi ×${S.streak}!`,'streak');
    if(c.type==='cat')meow(1.35,.06,.2);
    if(c.friend)setTimeout(()=>befriend(c),500);
    if(c.type==='reviewer'){S.cash+=150;save.xp+=40;setTimeout(()=>{floatText(slot,'Review 5 sao!','streak');hint('Reviewer khen tiệm hết lời! Thưởng +150k và +40 XP.')},700);updateHud()}
    hint((S.streak>=3?`Hoàn hảo! Chuỗi ×${S.streak}, tip +50%.`:c.type==='cat'?'Bé mèo ưng lắm. Trả gấp đôi!':'Ly hoàn hảo!')+(qm>1?' Nguyên liệu ngon, tip nhiều hơn.':qm<1?' Khách thấy vị chưa chuẩn, tip ít.':''));
  }else if(err===1&&!T.strict){
    S.cash+=price;S.served++;S.streak=0;save.xp+=2;
    leave(c,'ok');c.carry=carry;floatText(slot,`+${price}k`);sfx.ok();hint('Gần đúng. Sai một chỗ nên không có tip.');
  }else{
    S.streak=0;S.missed++;leave(c,'angry');floatText(slot,'Từ chối','bad');checkQuests();sfx.fail();puff(c.x,40);shake();
    hint(T.strict?'Khách khó tính muốn đúng từng chi tiết.':`Sai ${err} chỗ. Khách bỏ đi rồi.`);
  }
  if(err===0||(err===1&&!T.strict)){if(carry.pearls)S.q.pearl++;S.q.tea[cup.tea]=(S.q.tea[cup.tea]||0)+1;if(c.type==='cat')S.q.cat++;if(err===0&&c.type==='picky')S.q.picky++}
  cup=emptyCup();cupChanged();updateHud();checkQuests();
}
function bagUp(slot){
  const c=S.slots[slot];if(!c||S.bagJob)return;
  if(!useGear('bag'))return;
  S.bagJob={slot,t:.8};beep(300,.3,'triangle',.04,200);beep(500,.08,'square',.025,null,.5);hint('Đang đóng túi…');renderTickets();
}
function finishBag(slot){
  const c=S.slots[slot];if(!c||c.state!=='wait')return;
  const o=c.order,T=TYPES[c.type],qty=o.qty,allPerfect=c.perfectCups===qty;
  const price=Math.round(orderPrice(o)*T.pay*qty),combo=S.streak>=3?1.5:1,qmAvg=c.perfectCups?c.qmSum/c.perfectCups:1;
  const tip=c.perfectCups?Math.max(1,Math.round((5*T.tip*(c.pat/c.maxPat)*combo+1)*c.perfectCups*qmAvg*(has('tipjar')?1.25:1)*tipBoost())):0;
  save.xp+=3*c.perfectCups+2;
  S.cash+=price+tip;S.tips+=tip;S.perfect+=c.perfectCups;S.served+=qty;
  leave(c,allPerfect?'love':'ok');c.carry={bag:true};
  floatText(slot,`+${price+tip}k`,'good');sfx.win();sparkle(c.x,44);if(tip)coins(c.x,Math.min(7,Math.ceil(tip/3)));
  hint(c.type==='online'?`Shipper nhận túi ${qty} ly và chạy đi giao. +${price+tip}k!`:`Giao túi ${qty} ly cho khách. +${price+tip}k!`);
  if(o.tops.includes('pearl'))S.q.pearl+=qty;S.q.tea[o.tea]=(S.q.tea[o.tea]||0)+qty;if(allPerfect&&c.type==='picky')S.q.picky++;
  cup.level=cup.level;updateHud();checkQuests();
}
function floatText(slot,text,cls=''){
  const el=document.createElement('span');el.className='float '+cls;el.textContent=text;
  el.style.left=(SLOTS[slot]/W*100)+'%';$('#floats').appendChild(el);setTimeout(()=>el.remove(),1200);
}
let hintT=0;
function hint(t,sticky){$('#hint').textContent=t;hintT=t?(sticky?999:3.5):0}

/* ---------- controls ---------- */
/* ---------- pixel icons for the station ---------- */
const METAL='#B8B2CC',METAL_HI='#E6E2F0';
const TOP_PAT={
  pearl:(x,y)=>((x+(Math.floor(y/2)%2))%3===0&&y%2===0)?'#8A6450':((x+y)%3===2?'#22120A':'#3A2418'),
  grass:(x,y)=>(x%4===0||y%4===0)?'#4A423A':'#2B2622',
  pudding:(x,y)=>y<7.5?'#C9822F':(x%5===0&&y%3===0?'#FBE39A':'#F2C94C'),
  foam:(x,y)=>((x+y)%5===0)?'#FFFDF5':'#F3E6C4',
  lychee:(x,y)=>((x%4===1&&y%3===0)||(x%4===2&&y%3===1))?'#EC8AA6':'#F9C3D2',
};
function drawIcon(c,kind,val){
  if(kind==='tea'){
    const col=tea(val).color;
    blit(c,0,0,16,16,(x,y)=>x>3&&x<11.5&&y>3.5&&y<15,(x,y)=>y<5?'#4A4180':x<5?'#FFFFFF55':col,OUT);
    blit(c,0,0,16,16,(x,y)=>x>3&&x<11.5&&y>3.5&&y<15,(x,y)=>y<5?'#4A4180':(x<5&&y>5&&y<13)?'rgba(255,255,255,.35)':col,null);
    px(c,3,3,9,1,METAL_HI);px(c,2,2,2,1,METAL_HI);px(c,1,1,2,1,OUT);
    px(c,4,1,1,1,OUT);px(c,4,2,2,1,'#F7A8BC');px(c,10,1,1,1,OUT);px(c,9,2,2,1,'#F7A8BC');
    px(c,12,5,2,1,OUT);px(c,14,6,1,6,OUT);px(c,12,12,2,1,OUT);px(c,13,6,1,6,METAL);
  }else if(kind==='sugar'){
    const n={0:0,30:1,50:2,70:3,100:4}[val];
    // a scoop = metal bowl with a heaped white mound of sugar on top
    const spoon=(cx,cy,full)=>{
      blit(c,0,0,16,16,(x,y)=>y>=cy&&inEll(x,y,cx,cy,3.4,2.8),METAL,OUT);
      if(full)blit(c,0,0,16,16,(x,y)=>y<cy&&inEll(x,y,cx,cy,3,2.6),(x,y)=>(x*3+y)%4===0?'#D9D2EC':'#FFFFFF',OUT);
      px(c,cx-2,cy+1,2,1,METAL_HI);
    };
    const layouts={1:[[8,8]],2:[[4.5,8],[11.5,8]],3:[[4.5,5],[11.5,5],[8,12]],4:[[4.5,5],[11.5,5],[4.5,12],[11.5,12]]};
    if(n===0){spoon(8,7,false);for(let i=0;i<12;i++)px(c,2+i,13-i,2,1,'#E86A6A')}
    else layouts[n].forEach(([x,y])=>spoon(x,y,true));
  }else if(kind==='ice'){
    const cube=(x,y)=>{px(c,x,y,6,6,'#7FA9C2');px(c,x+1,y+1,4,4,'#DDF2FA');px(c,x+1,y+1,2,1,'#FFFFFF');px(c,x+4,y+4,1,1,'#A8D0E2')};
    if(+val===0){cube(5,5);for(let i=0;i<12;i++)px(c,2+i,13-i,2,1,'#E86A6A')}
    else if(+val===1){cube(2,8);cube(8,8)}
    else{cube(2,9);cube(8,9);cube(5,3);cube(10,3)}
  }else if(kind==='staff'){
    const P={hoa:{hair:'#3B2A2D',skin:'#F3CDAA'},tu:{hair:'#2A1E1A',skin:'#E2AD83'},na:{hair:'#8A5230',skin:'#F6D5B8'}}[val];
    blit(c,0,0,16,16,(x,y)=>y>11&&Math.abs(x-8)<=4.5+(y-11)*.5,'#F58DA6',OUT);px(c,7,13,2,2,'#FFFFFF');
    if(val==='hoa')blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,1.8,2.6,2),P.hair,OUT);
    blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,7,4.6,4.4),(x,y)=>y<5.2||(val!=='tu'&&(x<4.6||x>11.4)&&y<9)?P.hair:P.skin,OUT);
    if(val==='tu'){px(c,3,3,10,2,'#F58DA6');px(c,3,4,10,1,'#D96A86');px(c,11,5,3,1,'#D96A86')}
    if(val==='na'){px(c,4,1,1,2,'#3B2A2D');px(c,5,2,1,1,'#3B2A2D');px(c,11,1,1,2,'#3B2A2D');px(c,10,2,1,1,'#3B2A2D')}
    px(c,6,7,1,1,OUT);px(c,10,7,1,1,OUT);px(c,7,9,3,1,'#C45A77');px(c,5,8,1,1,'#F7A8BC');px(c,11,8,1,1,'#F7A8BC');
  }else if(kind==='friend'){
    const L=REGULARS.find(r=>r.id===val).look;
    blit(c,0,0,16,16,(x,y)=>y>11&&Math.abs(x-8)<=4.5+(y-11)*.5,L.shirt,OUT);
    if(L.style==='bun')blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,1.8,2.6,2),L.hair,OUT);
    if(L.style==='long')blit(c,0,0,16,16,(x,y)=>y>4&&y<14&&x>2.5&&x<13.5,L.hair,OUT);
    blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,7,4.6,4.4),(x,y)=>y<5.2||((L.style==='bob'||L.style==='long')&&(x<4.6||x>11.4)&&y<10)?L.hair:L.skin,OUT);
    if(L.style==='cap'){px(c,3,3,10,2,L.cap);px(c,10,5,4,1,L.cap)}
    if(L.style==='spiky')[[5,2],[8,1],[11,2]].forEach(([x,y])=>px(c,x,y,1,1,L.hair));
    px(c,6,7,1,1,OUT);px(c,10,7,1,1,OUT);px(c,7,9,3,1,'#C45A77');
    if(L.glasses){px(c,5,6,3,1,OUT);px(c,9,6,3,1,OUT);px(c,5,8,3,1,OUT);px(c,9,8,3,1,OUT);px(c,8,7,1,1,OUT)}
  }else if(kind==='gear'){
    if(val==='cup'){blit(c,0,0,16,16,(x,y)=>y>4&&y<15&&Math.abs(x-8)<=5-(y-4)*.15,'#F6EEF4','#B9A2B8');px(c,3,4,11,1,'#FFFFFF');px(c,3,1,1,3,'#B9A2B8');px(c,4,2,1,2,'#FBD3DE');px(c,12,1,1,3,'#B9A2B8');px(c,11,2,1,2,'#FBD3DE');px(c,6,8,1,1,'#3B2A2D');px(c,9,8,1,1,'#3B2A2D');px(c,7,10,2,1,'#E8788F')}
    else if(val==='straw'){for(let i=0;i<4;i++){px(c,3+i*3,2+i,2,13-i,['#F2708F','#7FC4A6','#F2A541','#8DB6E0'][i]);px(c,3+i*3,2+i,1,13-i,'rgba(255,255,255,.45)')}}
    else if(val==='film'){blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,8,6.5,6.5),'#FFF1F5','#B9A2B8');blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,8,2.5,2.5),'#D9C7D6',OUT);px(c,11,4,2,1,'#F2708F');px(c,10,3,1,1,'#F2708F');px(c,13,3,1,1,'#F2708F')}
    else{px(c,2,5,12,10,OUT);px(c,3,6,10,8,'#E3BE93');px(c,3,6,10,1,'#F2D3AE');px(c,5,2,1,4,OUT);px(c,10,2,1,4,OUT);px(c,6,2,4,1,OUT);px(c,6,9,1,1,OUT);px(c,9,9,1,1,OUT);px(c,7,10,2,1,'#E8788F')}
  }else if(kind==='up'){
    const U={
      double:()=>{blit(c,0,0,16,16,(x,y)=>y>3&&y<15&&Math.abs(x-8)<=5.5-(y-3)*.15,(x,y)=>y>11.5?'#3A2418':y>8.5?'#F2C94C':'#C08A5B','#D8D0F0');px(c,9,0,2,7,'#E86A6A')},
      catbed:()=>{blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,13,7.4,2.6),'#E86A6A',OUT);
        const ear=cx=>(x,y)=>y>2&&y<6.5&&Math.abs(x-cx)<=(y-2)*.6;
        blit(c,0,0,16,16,ear(5),'#F2A541',OUT);blit(c,0,0,16,16,ear(11),'#F2A541',OUT);
        blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,8.5,4.8,3.6),'#F2A541',OUT);px(c,6,8,1,1,OUT);px(c,9,8,1,1,OUT);px(c,7,10,2,1,'#E88A8A')},
      bigpot:()=>{for(let i=0;i<3;i++)px(c,1+i,8-i,2,1,'#D8D0F0');blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,10.5,6,4.8)&&y>6,'#C08A5B','#D8D0F0');px(c,4,5,8,1,METAL);px(c,7,3,2,2,METAL);px(c,14,8,1,5,'#D8D0F0')},
      kettle:()=>{blit(c,0,0,16,16,(x,y)=>inEll(x,y,8,11,5.5,4)&&y>7,'#E8894A',OUT);px(c,4,4,8,1,OUT);px(c,4,4,1,3,OUT);px(c,11,4,1,3,OUT);
        for(let i=0;i<3;i++)px(c,13+i,10-i,1,2,'#E8894A');px(c,2,1,1,3,'#F4EBD6');px(c,14,2,1,3,'#F4EBD6')},
      nonstick:()=>{px(c,1,6,14,9,OUT);px(c,2,7,12,7,'#2A2436');px(c,2,6,12,1,METAL_HI);px(c,0,8,1,2,OUT);px(c,15,8,1,2,OUT);
        px(c,12,1,1,3,'#FFFFFF');px(c,11,2,3,1,'#FFFFFF');px(c,5,9,2,2,'#8A6450');px(c,8,11,2,2,'#8A6450');px(c,10,8,2,2,'#8A6450')},
      lights:()=>{for(let x=0;x<16;x++)px(c,x,3+Math.round(3*Math.sin(Math.PI*x/15)),1,1,'#8E86C2');
        [[2,'#F2A541'],[6,'#7ED6B8'],[10,'#E86A6A'],[14,'#F4EBD6']].forEach(([x,col])=>{const y=4+Math.round(3*Math.sin(Math.PI*x/15));px(c,x-1,y,3,3,col);px(c,x-1,y+3,3,1,OUT)})},
      tipjar:()=>{px(c,3,4,10,11,OUT);px(c,4,5,8,9,'#3E4A6E');px(c,4,3,8,1,METAL);for(let i=0;i<5;i++)px(c,5+(i%3)*2,12-Math.floor(i/3)*2,2,1,'#F2C94C');
        px(c,7,6,1,1,'#E86A6A');px(c,9,6,1,1,'#E86A6A');px(c,7,7,3,1,'#E86A6A');px(c,8,8,1,1,'#E86A6A')},
    };U[val]();
  }else{
    // ladle: handle, bowl, then a heap of the topping
    for(let i=0;i<5;i++){px(c,11+i,6-i,1,2,METAL);px(c,12+i,6-i,1,1,OUT)}
    blit(c,0,0,16,16,(x,y)=>y>8&&inEll(x,y,7,8.5,6,5.5),METAL,OUT);
    const pat=TOP_PAT[val];
    blit(c,0,0,16,16,(x,y)=>(y>8.5&&y<11&&inEll(x,y,7,8.5,5.2,4.6))||inEll(x,y,7,8,4.6,val==='foam'?3.4:2.6)&&y<=9,(x,y)=>pat(x,y),OUT);
    px(c,2,12,1,1,METAL_HI);px(c,3,13,2,1,METAL_HI);
  }
}
const iconCache={};
function iconURL(kind,val){
  const key=kind+':'+val;if(iconCache[key])return iconCache[key];
  const cv=document.createElement('canvas');cv.width=16;cv.height=16;
  drawIcon(cv.getContext('2d'),kind,val);
  return iconCache[key]=cv.toDataURL();
}
function buildControls(){
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
function syncControls(){
  document.querySelectorAll('.opts .tile').forEach(b=>{
    const k=b.dataset.kind,v=b.dataset.val;let on=false;
    let set=false;
    if(k==='tea'){on=cup.tea===v;set=cup.tea!==null}else if(k==='sugar'){on=cup.sugar===+v;set=cup.sugar!==null}
    else if(k==='ice'){on=cup.ice===+v;set=cup.ice!==null}else{on=cup.tops.includes(v);set=cup.tops.length>=maxTops()}
    b.setAttribute('aria-pressed',on?'true':'false');
    b.classList.toggle('locked',set&&!on);
  });
  $('#dump').textContent='Đổ ly';
  const sb=$('#seal');sb.hidden=!sealNeeded();sb.disabled=!cup.tea||cup.sealed||S.sealT>0;sb.textContent=cup.sealed?'Đã dán nắp':S.sealT>0?'Đang dán…':'Dán nắp';sb.classList.toggle('done',cup.sealed);
  if(cup.sealed)document.querySelectorAll('.opts .tile').forEach(t=>{if(t.getAttribute('aria-pressed')!=='true')t.classList.add('locked')});
  syncBadges();
}
// out of stock mid-shift: order a rush delivery paid from today's takings (then savings); it costs 20% more and takes a while
function orderDelivery(id){
  const it=SUPPLY.find(x=>x.id===id),name=it.name;
  if(S.delivering[id]){hint(`${name} đang được giao, còn ${Math.ceil(S.delivering[id])} giây.`);sfx.nope();return}
  const price=Math.round(it.price*1.2);
  if(S.cash+save.wallet<price){hint(`Hết ${it.gear?GEAR_NAME[id]:it.kind==='top'&&id!=='pearl'?top(id).name:stockName(id)}. Cần ${price}k để đặt giao gấp, bán thêm vài ly rồi đặt nhé.`);sfx.nope();return}
  const fromCash=Math.min(S.cash,price);S.cash-=fromCash;save.wallet-=price-fromCash;S.spent+=price;
  S.delivering[id]=DELIVERY;
  hint(`Đã đặt giao gấp ${name} (−${price}k). Shipper tới sau ${DELIVERY} giây.`);sfx.ok();updateHud();syncBadges();
}
function syncGear(){
  const el=$('#gear');if(!el)return;
  el.innerHTML=GEAR.map(id=>{const n=save.pantry[id]||0,dl=S&&S.delivering&&S.delivering[id];return `<span class="${n<=5?'low':''}" title="${GEAR_NAME[id]}"><img src="${iconURL('gear',id)}" alt="">${dl&&!n?Math.ceil(dl)+'s':n}</span>`}).join('');
}
function syncBadges(){
  if(S&&S.delivering&&GEAR.some(g=>S.delivering[g]))syncGear();
  document.querySelectorAll('.opts .tile .badge').forEach(bd=>{
    const id=bd.parentElement.dataset.val,br=S.brewing[id],dl=S.delivering&&S.delivering[id];
    let n,q;
    if(S.stock[id]){n=stockN(id);q=nextQ(id)}else{n=save.pantry[id]||0;q='good'}
    bd.textContent=br&&!n?Math.ceil(br)+'s':dl&&!n?Math.ceil(dl)+'s':n;
    bd.className='badge'+(br&&!n?' brew':dl&&!n?' ship':n<=0?' out':q==='perfect'?'':QUAL[q].mul<1?' out':' plain');
    bd.title=n?`Còn ${n} · kế tiếp: ${QUAL[q].label}`:'';
  });
}
function rebrew(id,byHoa){
  if(S.brewing[id]){if(!byHoa){hint(`${stockName(id)} sẽ xong sau ${Math.ceil(S.brewing[id])} giây.`);sfx.nope()}return}
  if((save.pantry[id]||0)<=0){if(!byHoa)orderDelivery(id);return}
  S.brewed[id]=1;
  const secs=has('kettle')?3:7;
  save.pantry[id]--;S.brewing[id]=secs;
  hint(byHoa==='hoa'?`Chị Hoa đang pha thêm ${stockName(id)} (${secs} giây).`:byHoa?`Đang pha ${stockName(id)} vừa giao tới (${secs} giây).`:`Hết ${stockName(id)}. Đang pha gấp từ kho: ${secs} giây.`);sfx.pour();syncBadges();
}
const LOCKED='Đã cho vào ly rồi. Đổ ly để làm lại.';
function canAct(){
  if(S.phase==='paused'){hint('Đang tạm dừng. Tiếp tục để làm việc nhé.');return false}
  if(S.phase!=='open')return false;
  if(S.washT>0){hint('Đang tráng bình lắc…');sfx.nope();return false}
  if(S.sealT>0){hint('Đang dán nắp…');return false}
  return true;
}
document.querySelector('.controls').addEventListener('click',e=>{
  const b=e.target.closest('.tile');if(!b)return;audio();
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
const dumpCost=()=>cup.tea||cup.tops.length||cup.sugar!==null||cup.ice!==null?1:0;
function dump(){
  audio();if(!canAct())return;
  const cost=dumpCost();if(!cost){hint('Ly đang trống mà.');return}
  S.dumped++;S.washT=1.2;S.streak=0;checkQuests();
  cup=emptyCup();cupChanged();updateHud();sfx.fail();
  floatText(1,'Đã đổ','bad');hint('Đã đổ ly. Nguyên liệu trong ly mất hết, chuỗi hoàn hảo về 0.');
}
$('#dump').addEventListener('click',dump);
function sealCup(){
  audio();if(!canAct())return;
  if(!cup.tea){hint('Chưa có trà để dán nắp.');sfx.nope();return}
  if(cup.sealed)return;
  if(!useGear('film'))return;
  S.sealT=.6;beep(90,.55,'sawtooth',.025,150);syncControls();
}
$('#seal').addEventListener('click',sealCup);
// multi-cup orders: one tap pours the next cup with the same recipe (still uses stock; you still seal and bag it)
let againBusy=false;
function syncAgain(){
  const b=$('#again');if(!b||!S)return;const r=S.repeat,c=r&&S.slots.find(x=>x&&x.id===r.cid&&x.state==='wait');
  if(r&&!c)S.repeat=null;
  const show=!!c&&!againBusy&&c.bagged<(c.order.qty||1)&&!cup.tea&&!cup.tops.length&&cup.sugar===null&&cup.ice===null;
  b.hidden=!show;if(show)b.textContent=`Pha y chang #${c.no} · ly ${c.bagged+1}/${c.order.qty}`;
}
async function pourAgain(){
  audio();const r=S.repeat;if(!r||againBusy||!canAct())return;
  againBusy=true;$('#again').hidden=true;
  const tap=(k,v)=>{const t=document.querySelector(`.controls .tile[data-kind="${k}"][data-val="${v}"]`);if(t)t.click()};
  const steps=[['tea',r.tea],['sugar',r.sugar],['ice',r.ice],...r.tops.map(t=>['top',t])];
  for(const [k,v] of steps){
    if(k!=='tea'&&!cup.tea)break; // tea ran out (it's re-brewing): stop so the player sees why
    tap(k,v);await new Promise(res=>setTimeout(res,110));
  }
  againBusy=false;syncAgain();
  if(cup.tea)hint('Đã rót ly giống ly trước. Dán nắp rồi cho vào túi nhé.');
}
$('#again').addEventListener('click',pourAgain);
function cupChanged(){
  syncControls();syncAgain();
  const parts=[];
  if(cup.tea)parts.push(tea(cup.tea).name);
  if(cup.sugar!==null)parts.push(cup.sugar+'% đường');
  if(cup.ice!==null)parts.push(ICES[cup.ice]);
  cup.tops.forEach(t=>parts.push(top(t).name));
  $('#cupsum').textContent=parts.length?parts.join(' · '):'Ly trống';
  markTickets();
}

/* ---------- tickets ---------- */
let ticketRefs=[];const seenTickets=new Set();
function serveLabel(c){const q=c.order.qty||1;if(q===1)return'Phục vụ';if(S.bagJob&&S.slots[S.bagJob.slot]===c)return'Đang đóng túi…';return c.bagged>=q?'Đóng túi & giao':`Cho vào túi ${c.bagged}/${q}`}
/* ---------- new bar: waiting-customer avatars and the order speech bubble ---------- */
const picCache=new Map();
function portraitURL(c){
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
function speech(c){
  const o=c.order,t=tea(o.tea),q=o.qty||1,ice=['không đá','ít đá','đá vừa'][o.ice];
  const tops=o.tops.length?`thêm <b data-f="tops">${o.tops.map(x=>top(x).name.toLowerCase()).join(' và ')}</b>`:'<b data-f="tops">không topping</b>';
  const parts=`<b class="tea" data-f="tea">${q>1?q+' ly ':''}${t.name}</b>, <b data-f="sugar">${o.sugar}% đường</b>, <b data-f="ice">${ice}</b>, ${tops}`;
  if(c.friend)return `Như mọi khi nha: ${parts}!`;
  return ({regular:`Cho em ${q>1?'':'1 ly '}${parts} nha!`,rush:`Nhanh giúp mình với: ${parts}!`,picky:`Làm đúng y chang nhé: ${parts}.`,
    cat:`Meo~ ${parts}. Meo!`,online:`Đơn MèoShip: ${parts}.`,reviewer:`Cho tôi thử ${parts}.`})[c.type]||`Cho em ${parts} nha!`;
}
let counterKey='';
function renderCounter(){
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
      <div class="bub-foot">${q2>1?`<span class="bub-bag">Túi ${c.bagged}/${q2}</span>`:''}<img class="mood" alt="" width="18" height="18"><div class="pat"><i></i></div><span class="t-sec"></span>${staffOn('na')?'<button class="ask" type="button">Nhờ Na</button>':''}</div>
    </div>`;
  const ask=b.querySelector('.ask');if(ask)ask.addEventListener('click',()=>{audio();askNa(ticketRefs.indexOf(r))});
}
$('#bubble').addEventListener('click',e=>{const a=e.target.closest('.qav');if(!a)return;audio();S.focus=+a.dataset.cid;S.focusManual=true;sfx.click();renderTickets()});
function tickCounter(){
  if(!document.body.classList.contains('bar-new'))return;
  const live=ticketRefs.filter(Boolean);
  document.querySelectorAll('#queue .qav').forEach(a=>{const r=live.find(x=>x.c.id===+a.dataset.cid);if(!r)return;const f=Math.max(0,r.c.pat/r.c.maxPat);
    const ring=a.querySelector('.qring');ring.style.strokeDashoffset=String(100-f*100);ring.style.stroke=f>.5?'#2F9A6C':f>.25?'#D98A1E':'#D9435C';a.classList.toggle('hot',f<.25)});
  const b=$('#bubble'),r=live.find(x=>x.c.id===S.focus)||live[0];if(!r||!b.querySelector('.bub-box'))return;
  const f=Math.max(0,r.c.pat/r.c.maxPat),o=r.c.order;
  const fill=b.querySelector('.pat i'),bar=b.querySelector('.pat');fill.style.width=f*100+'%';bar.classList.toggle('warn',f<.5&&f>=.25);bar.classList.toggle('bad',f<.25);
  const sec=Math.ceil(r.c.pat)+'s',se=b.querySelector('.t-sec');if(se.textContent!==sec)se.textContent=sec;
  const m=moodOf(f),mi=b.querySelector('.mood');if(mi.dataset.m!==m){mi.dataset.m=m;mi.src=faceURL(m)}
  const ok={tea:cup.tea===o.tea,sugar:cup.sugar===o.sugar,ice:cup.ice===o.ice,tops:cup.tops.length===o.tops.length&&o.tops.every(t=>cup.tops.includes(t))&&(cup.tea!==null||cup.tops.length>0)};
  b.querySelectorAll('[data-f]').forEach(el=>el.classList.toggle('ok',ok[el.dataset.f]));
  if(r.ask===undefined){}const ask=b.querySelector('.ask');if(ask){const lab=S.naJob?'Na đang rót…':S.naCd>0?`Na nghỉ ${Math.ceil(S.naCd)}s`:'Nhờ Na';if(ask.textContent!==lab)ask.textContent=lab;ask.disabled=!!S.naJob||S.naCd>0}
}
function syncFocus(){
  const el=$('#focus');if(!el)return;
  const r=ticketRefs.find(x=>x&&x.c.id===S.focus);
  if(!r||S.phase!=='open'){el.hidden=true;return}
  const o=r.c.order,t=tea(o.tea);
  el.hidden=false;
  el.innerHTML=`<b>Đang làm #${r.c.no}</b><span><i class="sw" style="background:${t.color}"></i>${t.short}${(o.qty||1)>1?' ×'+o.qty:''} · ${o.sugar}% đường · ${ICES[o.ice]}${o.tops.length?' · '+o.tops.map(x=>top(x).short).join(', '):''}</span>`;
}
// the big button serves: a ticket the finished cup matches (the chosen one first), else the chosen ticket
function targetSlot(){
  const live=ticketRefs.map((r,i)=>r?{r,i}:null).filter(Boolean);if(!live.length)return -1;
  const full=x=>(x.r.c.order.qty||1)>1&&x.r.c.bagged>=x.r.c.order.qty,foc=live.find(x=>x.r.c.id===S.focus);
  if(cup.tea){const ready=live.filter(x=>x.r.ready&&!full(x));if(foc&&ready.includes(foc))return foc.i;if(ready.length)return ready.sort((a,b)=>a.r.c.pat-b.r.c.pat)[0].i}
  if(foc)return foc.i;
  return live[0].i;
}
function syncServeBtn(){
  const b=$('#serveBig');if(!b||!S)return;
  const i=S.phase==='open'||S.phase==='paused'?targetSlot():-1,r=i>=0?ticketRefs[i]:null;
  let lab='Chờ khách',state='';
  if(r){const c=r.c,q=c.order.qty||1,full=q>1&&c.bagged>=q;
    lab=(S.bagJob&&S.slots[S.bagJob.slot]===c)?'Đang đóng túi…':full?`Đóng túi & giao #${c.no}`:q>1?`Cho vào túi #${c.no} · ${c.bagged}/${q}`:`Phục vụ #${c.no}`;
    state=full?'bag':r.ready&&(cup.sealed||!sealNeeded())?'ready':''}
  if($('#serveLab').textContent!==lab)$('#serveLab').textContent=lab;
  b.className='serveBig'+(state?' '+state:'');b.disabled=!r;
}
function serveTarget(){audio();const i=targetSlot();if(i<0){hint('Chưa có khách nào chờ.');return}serve(i)}
$('#serveBig').addEventListener('click',serveTarget);
function renderTickets(){
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
      ${staffOn('na')?'<button class="ask" type="button">Nhờ Na</button>':''}`;
    el.addEventListener('click',e=>{if(e.target.closest('button'))return;S.focus=c.id;S.focusManual=true;sfx.click();renderTickets()});
    const ask=el.querySelector('.ask');if(ask)ask.addEventListener('click',()=>{audio();askNa(i)});
    box.appendChild(el);ticketRefs.push({c,bar:el.querySelector('.pat'),fill:el.querySelector('.pat i'),face:el.querySelector('.mood'),mood:null,ask:el.querySelector('.ask'),tags:el.querySelector('.t-tags'),sec:el.querySelector('.t-sec'),tagKey:'',el});
  }
  markTickets();syncFocus();syncServeBtn();renderCounter();syncAgain();
}
function markTickets(){
  ticketRefs.forEach(r=>{if(!r)return;const o=r.c.order;
    const ok={tea:cup.tea===o.tea,sugar:cup.sugar===o.sugar,ice:cup.ice===o.ice,
      tops:cup.tops.length===o.tops.length&&o.tops.every(t=>cup.tops.includes(t))&&(cup.tea!==null||cup.tops.length>0)};
    r.el.querySelectorAll('[data-f]').forEach(l=>l.classList.toggle('ok',ok[l.dataset.f]));
    r.ready=!!cup.tea&&ok.tea&&ok.sugar&&ok.ice&&ok.tops;r.el.classList.toggle('ready',r.ready);
    r.el.classList.toggle('bagfull',(r.c.order.qty||1)>1&&r.c.bagged>=r.c.order.qty);
    if(r.ready&&(cup.sealed||!sealNeeded())&&staffOn('tu')&&!S.autoServe)S.autoServe={slot:ticketRefs.indexOf(r),t:.6};
  });
  coach();syncServeBtn();
}
// gentle step-by-step guidance for a brand new player's first drinks
let coachMsg='';
function coach(){
  if(!S||S.phase!=='open'||save.day>1||S.served+S.missed>=2)return;
  const live=ticketRefs.filter(Boolean);
  let m='';
  if(live.some(r=>r.ready))m=cup.sealed||!sealNeeded()?'Khớp hết rồi! Bấm nút Phục vụ to bên dưới.':'Khớp rồi! Bấm Dán nắp, rồi Phục vụ.';
  else if($('#again')&&!$('#again').hidden)m='Bấm “Pha y chang” để rót ly tiếp theo.';
  else if(live.length)m=cup.tea?'Giờ thêm đường, đá và topping theo order.':'Chọn trà theo order trước. Phần khớp sẽ hóa xanh.';
  if(m&&m!==coachMsg){coachMsg=m;hint(m,true)}
}
function askNa(i){
  if(!canAct())return;const r=ticketRefs[i];if(!r||S.naCd>0||S.naJob)return;
  if(cup.tea||cup.sugar!==null||cup.ice!==null||cup.tops.length){hint('Ly đang có đồ rồi. Phục vụ hoặc đổ ly trước khi nhờ Na.');sfx.nope();return}
  const o=r.c.order;if(stockN(o.tea)<=0){rebrew(o.tea);return}
  S.naJob={order:{...o},t:1.2};hint('Na đang rót trà, đường và đá…');sfx.click();
}
function updateBars(){
  syncServeBtn();renderCounter();tickCounter();
  const live=ticketRefs.filter(Boolean);
  // who came first, who is about to walk out, and which order you're working on
  const first=live.length>1?live.reduce((a,b)=>a.c.no<b.c.no?a:b):null;
  const urgent=live.filter(r=>r.c.pat/r.c.maxPat<.45).sort((a,b)=>a.c.pat-b.c.pat)[0]||null;
  if(S&&S.phase==='open'){
    const cur=live.find(r=>r.c.id===S.focus);
    if(!cur||(!S.focusManual&&!cup.tea)){const pickR=urgent||first||live[0];const nf=pickR?pickR.c.id:null;if(nf!==S.focus){S.focus=nf;S.focusManual=false;live.forEach(r=>r.el.classList.toggle('focus',r.c.id===nf));syncFocus()}}
  }
  live.forEach(r=>{const key=(r===first?'f':'')+(r===urgent?'u':'');if(key!==r.tagKey){r.tagKey=key;r.tags.innerHTML=(r===first?'<span class="tag first">Đến trước</span>':'')+(r===urgent?'<span class="tag hot">Gấp!</span>':'');r.el.classList.toggle('urgent',r===urgent)}
    const sec=Math.ceil(r.c.pat)+'s';if(r.sec.textContent!==sec)r.sec.textContent=sec});
  ticketRefs.forEach(r=>{if(!r)return;
    if(r.ask){const lab=S.naJob?'Na đang rót…':S.naCd>0?`Na nghỉ ${Math.ceil(S.naCd)}s`:'Nhờ Na';if(r.ask.textContent!==lab)r.ask.textContent=lab;r.ask.disabled=!!S.naJob||S.naCd>0}const f=Math.max(0,r.c.pat/r.c.maxPat);
    r.fill.style.width=(f*100)+'%';
    const m=moodOf(f);if(m!==r.mood){r.mood=m;r.face.src=faceURL(m);r.face.className='mood '+m;r.face.alt=MOODS[m];r.face.title=MOODS[m]}r.bar.classList.toggle('warn',f<.5&&f>=.25);r.bar.classList.toggle('bad',f<.25)});
}

/* ---------- hud ---------- */
function updateHud(){
  $('#h-day').textContent=S.day;
  $('#h-lv').textContent=levelOf(save.xp);
  if(S.quests)$('#h-quests').textContent=`${S.quests.filter(q=>q.done).length}/${S.quests.length}`;
  const m=600+Math.floor(Math.min(1,S.time/DAY_LEN)*690);
  $('#h-clock').textContent=`${Math.floor(m/60)}:${String(m%60).padStart(2,'0')}`;
  $('#h-cash').textContent=S.cash+'k';
  $('#h-goallab').textContent=`Mục tiêu ${goalFor(S.day)}k`;
  $('#h-goal').style.width=Math.min(100,S.cash/goalFor(S.day)*100)+'%';
  $('#h-streak').textContent=S.streak>=3?`×${S.streak}`:S.streak;
}

/* ---------- pixel drawing ---------- */
function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)}
const inEll=(x,y,cx,cy,rx,ry)=>((x-cx)/rx)**2+((y-cy)/ry)**2<=1;
function blit(c,ox,oy,w,h,inside,fill,outline){
  for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++){
    if(inside(x+.5,y+.5))px(c,ox+x,oy+y,1,1,typeof fill==='function'?fill(x,y):fill);
    else if(outline&&(inside(x+1.5,y+.5)||inside(x-.5,y+.5)||inside(x+.5,y+1.5)||inside(x+.5,y-.5)))px(c,ox+x,oy+y,1,1,outline);
  }
}
const ICONS={
  love:['.x.x.','xxxxx','xxxxx','.xxx.','..x..'],
  ok:['....x','...x.','x.x..','.x...','.....'],
  angry:['x...x','.x.x.','..x..','.x.x.','x...x'],
  wait:['..x..','..x..','..x..','.....','..x..'],
};
const ICOL={love:'#E86A6A',ok:'#2E7A5B',angry:'#C94A4A',wait:'#D08A2E'};
function bubble(cx,y,kind){
  const x=Math.round(cx)-5;
  px(g,x,y,11,9,OUT);px(g,x+1,y+1,9,7,'#F4EBD6');px(g,x+4,y+9,2,1,OUT);px(g,x+4,y+8,2,1,'#F4EBD6');
  ICONS[kind].forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='x')px(g,x+3+i,y+2+j,1,1,ICOL[kind])}));
}
const MOODS={happy:'Vui vẻ',okay:'Hơi sốt ruột',upset:'Bực mình',furious:'Sắp bỏ đi'};
const moodOf=f=>f>.5?'happy':f>.25?'okay':f>.1?'upset':'furious';
const faceCache={};
function faceURL(m){
  if(faceCache[m])return faceCache[m];
  const cv=document.createElement('canvas');cv.width=12;cv.height=12;const c=cv.getContext('2d'),E='#1B1530';
  const col={happy:'#F2C94C',okay:'#EBC27E',upset:'#E8895A',furious:'#E05555'}[m];
  blit(c,0,0,12,12,(x,y)=>inEll(x,y,6,6,5.2,5.2),col,OUT);
  px(c,3,3,2,1,'rgba(255,255,255,.45)');
  if(m==='happy'){px(c,4,4,1,2,E);px(c,7,4,1,2,E);px(c,3,7,1,1,E);px(c,8,7,1,1,E);px(c,4,8,4,1,E);px(c,2,6,1,1,'#E88A8A');px(c,9,6,1,1,'#E88A8A')}
  else if(m==='okay'){px(c,4,4,1,2,E);px(c,7,4,1,2,E);px(c,4,8,4,1,E)}
  else{px(c,3,3,1,1,E);px(c,4,4,1,1,E);px(c,8,3,1,1,E);px(c,7,4,1,1,E);px(c,4,5,1,1,E);px(c,7,5,1,1,E);
    px(c,4,7,4,1,E);px(c,3,8,1,1,E);px(c,8,8,1,1,E);
    if(m==='furious'){px(c,9,1,1,2,'#FFFFFF');px(c,10,2,1,1,'#FFFFFF')}}
  return faceCache[m]=cv.toDataURL();
}
function drawPerson(c,t){
  const L=c.look,walking=c.state==='walk'||(c.state==='leave'&&c.bubbleT<=0);
  const bob=walking?(Math.floor(t*8+c.id)%2):((t+c.id*.37)%1.4<.7?0:1);
  const hop=c.state==='leave'&&c.result==='love'&&c.bubbleT>0?Math.round(Math.abs(Math.sin(c.bubbleT*11))*3):0;
  const ox=Math.round(c.x)-8,oy=37+bob-hop;
  const frac=c.pat/c.maxPat;
  const mood=c.state==='leave'?(c.result==='angry'?'upset':'happy'):frac>.5?'happy':frac>.25?'neutral':'upset';
  const isCat=c.type==='cat';
  const skin=isCat?L.fur:L.skin;
  // back hair / bun / ears
  if(!isCat&&L.style==='long')blit(g,ox,oy,16,28,(x,y)=>y>5&&y<20&&x>1&&x<15&&!(y>18&&(x<3||x>13)),L.hair,OUT);
  if(!isCat&&L.style==='bun')blit(g,ox,oy,16,28,(x,y)=>inEll(x,y,8,1.8,2.8,2.4),L.hair,OUT);
  if(isCat){
    const earL=(x,y)=>y>0&&y<6&&Math.abs(x-3.8)<=y*.55,earR=(x,y)=>y>0&&y<6&&Math.abs(x-12.2)<=y*.55;
    blit(g,ox,oy,16,28,earL,skin,OUT);blit(g,ox,oy,16,28,earR,skin,OUT);
    px(g,ox+3,oy+3,1,2,'#E88A8A');px(g,ox+12,oy+3,1,2,'#E88A8A');
  }
  // body
  blit(g,ox,oy,16,28,(x,y)=>y>15&&y<28&&Math.abs(x-8)<=4.6+(y-15)*.3,L.shirt,OUT);
  if(c.type==='rush'){px(g,ox+5,oy+16,2,1,'#F4EBD6');px(g,ox+9,oy+16,2,1,'#F4EBD6');px(g,ox+7,oy+16,2,1,'#B23A3A');px(g,ox+7,oy+17,2,5,'#C94A4A')}
  if(isCat)px(g,ox+6,oy+18,4,6,'#F4EBD6');
  // head
  const hairAt=(x,y)=>{
    if(isCat)return false;
    switch(L.style){
      case 'short':return y<5.5||(y<7.5&&(x<3.5||x>12.5))||(y<6.5&&x<7.5);
      case 'bob':case 'long':return y<5.5||((x<3.5||x>12.5)&&y<12)||(y<6.5&&x>8.5);
      case 'bun':return y<5||(y<7&&(x<3.5||x>12.5));
      case 'cap':return y<7.5&&(x<3.5||x>12.5);
      case 'spiky':return y<5.5||(y<6.5&&x%2<1);
    }return false;
  };
  blit(g,ox,oy,16,28,(x,y)=>inEll(x,y,8,9,6.6,6.2),(x,y)=>hairAt(x+.5,y+.5)?L.hair:skin,OUT);
  if(c.type==='online'){blit(g,ox,oy,16,28,(x,y)=>inEll(x,y,8,8,7.3,6.6)&&y<8.2,(x,y)=>y<4?'#FF9DB3':'#F58DA6',OUT);px(g,ox+2,oy+7,12,1,'#3B2A2D');px(g,ox+6,oy+2,4,1,'#FFFFFF');px(g,ox+4,oy+21,9,1,'#FFFFFF')}
  if(!isCat&&L.style==='cap'){blit(g,ox,oy,16,28,(x,y)=>y>2&&y<6.5&&inEll(x,y,8,6.5,6.4,4.3),L.cap,OUT);px(g,ox+8,oy+6,8,1,L.cap);px(g,ox+8,oy+7,8,1,OUT)}
  if(!isCat&&L.style==='spiky'){[[4,2],[7,1],[10,1],[12,2]].forEach(([x,y])=>{px(g,ox+x,oy+y,1,1,L.hair);px(g,ox+x,oy+y-1,1,1,OUT)})}
  // face
  const blink=((t*.6+c.id*.9)%4)<.12;
  const E='#1B1530';
  if(blink){px(g,ox+5,oy+10,1,1,E);px(g,ox+10,oy+10,1,1,E)}else{px(g,ox+5,oy+9,1,2,E);px(g,ox+10,oy+9,1,2,E)}
  if(mood==='upset'&&!isCat){px(g,ox+4,oy+7,2,1,E);px(g,ox+10,oy+7,2,1,E)}
  if(mood==='happy'){px(g,ox+3,oy+11,2,1,'#E88A8A');px(g,ox+11,oy+11,2,1,'#E88A8A')}
  if(isCat){
    px(g,ox+7,oy+11,2,1,'#E88A8A');px(g,ox+6,oy+12,1,1,E);px(g,ox+9,oy+12,1,1,E);
    px(g,ox-1,oy+11,3,1,OUT);px(g,ox+14,oy+11,3,1,OUT);px(g,ox-1,oy+13,3,1,OUT);px(g,ox+14,oy+13,3,1,OUT);
  }else if(mood==='happy'){px(g,ox+6,oy+12,1,1,E);px(g,ox+9,oy+12,1,1,E);px(g,ox+7,oy+13,2,1,E)}
  else if(mood==='neutral'){px(g,ox+7,oy+13,2,1,E)}
  else{px(g,ox+7,oy+12,2,1,E);px(g,ox+6,oy+13,1,1,E);px(g,ox+9,oy+13,1,1,E)}
  if(L.shades){px(g,ox+3,oy+8,4,2,OUT);px(g,ox+9,oy+8,4,2,OUT);px(g,ox+7,oy+8,2,1,OUT);px(g,ox+4,oy+8,1,1,'#6A6478');px(g,ox+10,oy+8,1,1,'#6A6478')}
  if(c.type==='picky'){
    [[4,8],[9,8]].forEach(([x,y])=>{px(g,ox+x,oy+y,3,1,OUT);px(g,ox+x,oy+y+3,3,1,OUT);px(g,ox+x,oy+y+1,1,2,OUT);px(g,ox+x+2,oy+y+1,1,2,OUT)});
    px(g,ox+7,oy+9,2,1,OUT);
  }
  // bubbles
  if(c.carry&&c.carry.bag&&c.state==='leave'){
    const cx=ox+(c.bubbleT>0?10:0),cy=oy+14;
    px(g,cx,cy,8,9,OUT);px(g,cx+1,cy+1,6,7,'#E3BE93');px(g,cx+1,cy+1,6,1,'#F2D3AE');px(g,cx+2,cy-2,1,3,OUT);px(g,cx+5,cy-2,1,3,OUT);px(g,cx+3,cy-2,2,1,OUT);
    px(g,cx+2,cy+4,1,1,OUT);px(g,cx+5,cy+4,1,1,OUT);px(g,cx+3,cy+5,2,1,'#E8788F');px(g,cx+1,cy+2,1,1,OUT);px(g,cx+6,cy+2,1,1,OUT);
  }else if(c.carry&&c.state==='leave'){
    const cx=ox+(c.bubbleT>0?11:1),cy=oy+15;
    px(g,cx,cy,6,8,OUT);px(g,cx+1,cy+1,4,6,c.carry.color);px(g,cx+1,cy+1,4,1,'#F4EBD6');
    if(c.carry.foam)px(g,cx+1,cy+2,4,1,'#F3E6C4');
    if(c.carry.pearls){px(g,cx+1,cy+6,1,1,'#2A160C');px(g,cx+3,cy+6,1,1,'#2A160C');px(g,cx+2,cy+5,1,1,'#2A160C')}
    px(g,cx+4,cy-3,1,4,'#F2708F');px(g,cx,cy-1,1,1,OUT);px(g,cx+5,cy-1,1,1,OUT);
  }
  if(c.state==='leave'&&c.bubbleT>0)bubble(c.x,oy-12,c.result);
  else if(c.state==='wait'&&frac<.28&&Math.floor(t*3)%2===0)bubble(c.x,oy-12,'wait');
  else if(c.state==='wait'){const str=String(c.no),w=textW(str)+4,tx=Math.round(c.x-w/2),ty=oy-9,foc=S.focus===c.id;
    px(g,tx,ty,w,7,foc?'#E0557A':'#8A6A78');px(g,tx+1,ty+1,w-2,5,foc?'#E0557A':'#FFFFFF');pixText(g,str,tx+2,ty+1,foc?'#FFFFFF':'#3B2A2D');px(g,Math.round(c.x)-1,ty+7,2,1,foc?'#E0557A':'#8A6A78')}
}
/* ---------- the shop's cats: Bơ sleeps on the counter, Mochi peeks from the awning, Mun strolls by ---------- */
const shopCats=[
  {id:'bo',name:'Bơ',x:98,y:52,w:16,h:9,petT:0},
  {id:'mochi',name:'Mochi',x:124,y:5,w:12,h:10,petT:0},
  {id:'mun',name:'Mun',x:-30,y:44,w:14,h:10,petT:0,walkIn:6},
];
const catById=id=>shopCats.find(c=>c.id===id);
function heart(x,y,col='#F2708F'){px(g,x,y,1,1,col);px(g,x+2,y,1,1,col);px(g,x,y+1,3,1,col);px(g,x+1,y+2,1,1,col)}
function drawShopCats(t){
  // Bơ: orange tabby loaf asleep on the counter
  const b=catById('bo'),bx=b.x,by=b.y,br=Math.sin(t*1.6)>0?0:1,pet=b.petT>0;
  blit(g,bx,by,16,9,(x,y)=>inEll(x,y,9,5.3,6.6,3.4-br*.3)&&y>1.5,(x,y)=>((x+Math.floor(y/2))%4===0&&y>3)?'#E08A34':'#F4AA55',OUT);
  blit(g,bx,by,16,9,(x,y)=>inEll(x,y,4,4,3.4,3),'#F4AA55',OUT);
  px(g,bx+1,by,1,2,'#F4AA55');px(g,bx+1,by-1,1,1,OUT);px(g,bx+5,by,1,2,'#F4AA55');px(g,bx+5,by-1,1,1,OUT);
  px(g,bx+2,by+1,1,1,'#F7A8BC');px(g,bx+5,by+1,1,1,'#F7A8BC');
  if(pet){px(g,bx+2,by+3,1,1,OUT);px(g,bx+5,by+3,1,1,OUT)}else{px(g,bx+2,by+4,2,1,OUT);px(g,bx+5,by+4,1,1,OUT)}
  px(g,bx+3,by+5,1,1,'#E8788F');
  px(g,bx+11,by+7,4,1,'#E08A34');px(g,bx+14,by+6,1,1,'#E08A34');
  if(!pet&&Math.floor(t*.8)%3===0){const zp=(t*.8)%1;g.globalAlpha=1-zp;px(g,bx+6,by-3-zp*6,3,1,'#8A6A78');px(g,bx+7,by-2-zp*6,1,1,'#8A6A78');px(g,bx+6,by-1-zp*6,3,1,'#8A6A78');g.globalAlpha=1}
  // Mochi: calico peeking down from the awning, tail swinging
  const m=catById('mochi'),mx=m.x,my=m.y,sw=Math.round(Math.sin(t*2.2)*2);
  for(let i=0;i<8;i++){const tx=mx+12+Math.round(Math.sin(t*2.2+i*.5)*(i/4));px(g,tx,my+1+i,1,1,i<4?'#FFFFFF':'#F2A541');px(g,tx+1,my+1+i,1,1,OUT)}
  blit(g,mx,my,12,10,(x,y)=>inEll(x,y,6,5.5,4.8,3.8),(x,y)=>x<4.5&&y<6?'#F2A541':x>8&&y<5?'#3B2A2D':'#FFFFFF',OUT);
  const ear=cx=>(x,y)=>y>0&&y<3.2&&Math.abs(x-cx)<=y*.55;
  blit(g,mx,my,12,10,ear(3),'#F2A541',OUT);blit(g,mx,my,12,10,ear(9),'#3B2A2D',OUT);
  const blink=((t*.5+1.3)%3.5)<.15;
  if(m.petT>0){px(g,mx+3,my+5,1,1,OUT);px(g,mx+4,my+4,1,1,OUT);px(g,mx+7,my+4,1,1,OUT);px(g,mx+8,my+5,1,1,OUT)}
  else if(blink){px(g,mx+3,my+5,2,1,OUT);px(g,mx+7,my+5,2,1,OUT)}
  else{px(g,mx+3,my+4,1,2,OUT);px(g,mx+8,my+4,1,2,OUT)}
  px(g,mx+5,my+6,2,1,'#E8788F');px(g,mx+2,my+6,1,1,'#F7A8BC');px(g,mx+9,my+6,1,1,'#F7A8BC');
  px(g,mx+3,my+9,2,2,'#FFFFFF');px(g,mx+7,my+9,2,2,'#FFFFFF');px(g,mx+3,my+11,2,1,OUT);px(g,mx+7,my+11,2,1,OUT);
  // little 'meo' speech bubbles when a cat talks on its own
  shopCats.forEach(c=>{if(c.meowT>0&&!(c.id==='mun'&&(c.x<-10||c.x>W))){const bx=Math.round(c.x+c.w/2)+2,by=c.y-9-Math.round((1.4-c.meowT)*2);px(g,bx,by,9,6,'#8A6A78');px(g,bx+1,by+1,7,4,'#FFFFFF');px(g,bx+1,by+6,1,1,'#8A6A78');
    px(g,bx+2,by+2,1,2,'#E0557A');px(g,bx+3,by+2,1,1,'#E0557A');px(g,bx+4,by+2,1,2,'#E0557A');px(g,bx+6,by+2,1,2,'#E0557A');px(g,bx+6,by+2,1,1,'#E0557A')}});
  // hearts for any cat being petted
  shopCats.forEach(c=>{if(c.petT>0){const q=1-c.petT/1.6;g.globalAlpha=Math.min(1,c.petT*1.5);heart(c.x+c.w/2-1,c.y-3-q*10);heart(c.x+c.w/2+3,c.y-1-q*7,'#FF9DB3');g.globalAlpha=1}});
}
function drawWalker(t){
  // Mun: a black cat who strolls along the street every so often (drawn behind the customers)
  const c=catById('mun');
  if(c.x<-20||c.x>W+20)return;
  const x=Math.round(c.x),y=c.y,step=c.petT>0?0:Math.floor(t*6)%2;
  const F='#2F2A36',H2='#4A4352';
  for(let i=0;i<5;i++)px(g,x-1-Math.round(i*.4),y+4-i+Math.round(Math.sin(t*3+i*.6)*.6),1,1,F);
  px(g,x,y+3,9,4,F);px(g,x+1,y+3,7,1,H2);
  px(g,x+1,y+7,1,2+step,F);px(g,x+3,y+7,1,3-step,F);px(g,x+6,y+7,1,2+step,F);px(g,x+8,y+7,1,3-step,F);
  px(g,x+8,y,5,5,F);px(g,x+8,y-1,1,1,F);px(g,x+12,y-1,1,1,F);px(g,x+9,y,1,1,'#F7A8BC');
  if(c.petT>0){px(g,x+10,y+2,1,1,'#FFE27A');px(g,x+12,y+2,1,1,'#FFE27A')}else{px(g,x+10,y+1,1,2,'#FFE27A');px(g,x+12,y+1,1,2,'#FFE27A')}
}
function updateCats(dt){
  shopCats.forEach(c=>{if(c.petT>0)c.petT=Math.max(0,c.petT-dt);if(c.meowT>0)c.meowT=Math.max(0,c.meowT-dt)});
  ambientCats(dt);
  const m=catById('mun');
  if(m.petT>0)return;
  if(m.x<-20||m.x>W+20){m.walkIn-=dt;if(m.walkIn<=0){m.x=-18;m.walkIn=14+Math.random()*16;if(S&&S.phase==='open')meow(.95,.03)}else return}
  m.x+=9*dt;
}
let ambT=10+Math.random()*8;
function ambientCats(dt){
  ambT-=dt;if(ambT>0)return;ambT=13+Math.random()*16;
  const pool=shopCats.filter(c=>c.id!=='mun'||(c.x>0&&c.x<W));const c=pick(pool);
  c.meowT=1.4;meow(c.id==='bo'?.9:c.id==='mochi'?1.25:1.05,.035);
}
function petCat(c){
  audio();c.petT=1.6;
  if(c.id==='bo'){purr(1.8);meow(.9,.05,.9)}else if(c.id==='mochi'){meow(1.25);purr(1)}else{meow(1.05);meow(1.15,.05,.55)}
  if(S&&S.q){S.q.pet=(S.q.pet||0)+1;if(S.phase==='open'||S.phase==='prep')checkQuests()}
  if(S&&S.phase==='open')hint(`${c.name} kêu meo và dụi đầu vào tay bạn.`);
}
function catAt(x,y){return shopCats.find(c=>x>=c.x-2&&x<=c.x+c.w+2&&y>=c.y-3&&y<=c.y+c.h+2&&!(c.id==='mun'&&(c.x<-10||c.x>W+5)))}
function drawDecor(t){
  if(season==='trungthu')[[22,9],[62,10],[98,9],[146,10]].forEach(([x,y],i)=>{
    const sw=Math.round(Math.sin(t*1.5+i));g.globalAlpha=.25+.1*Math.sin(t*3+i);blit(g,x-4+sw,y-3,10,12,(a,b)=>inEll(a,b,5,6,5,6),'#FFB35A',null);g.globalAlpha=1;
    px(g,x+sw,y-2,1,2,'#8A6A78');blit(g,x-3+sw,y,8,8,(a,b)=>inEll(a,b,4,4,3.6,3.8),(a,b)=>b<1.5||b>6.5?'#F2C94C':'#E0485F',OUT);px(g,x-1+sw,y+3,4,1,'#FF8A7A');px(g,x+sw,y+8,1,2,'#F2C94C')});
  if(season==='tet'){for(let i=0;i<9;i++)px(g,4+i*2,20-i,1,1,'#7A4A2A');[[6,17],[10,14],[14,12],[8,19],[16,10]].forEach(([x,y])=>{px(g,x,y,2,2,'#F9D24A');px(g,x,y,1,1,'#FFF3B0')})}
  if(ev()===EVENTS.holiday){const cols=['#E0485F','#F2C94C','#3F83C4','#7ED6B8'];for(let x=2;x<W;x+=6){const y=20+Math.round(2*Math.sin(Math.PI*((x%53)/53))),col=cols[(x/6|0)%4];px(g,x,y,4,1,col);px(g,x+1,y+1,2,1,col);px(g,x+1,y+2,1,1,col)}}
  if(ev()===EVENTS.hot){blit(g,8,10,14,14,(x,y)=>inEll(x,y,7,7,5,5),'#FFD36B','#F2A541');for(let i=0;i<8;i++){const a=i/8*Math.PI*2+t*.3;px(g,15+Math.cos(a)*9,17+Math.sin(a)*9,1,1,'#F2A541')}}
}
function drawWeather(t){
  if(ev()!==EVENTS.rain)return;
  g.globalAlpha=.14;px(g,0,0,W,60,'#5A6E9A');g.globalAlpha=.7;
  for(let i=0;i<46;i++){const x=Math.round((i*37+t*38)%(W+10))-5,y=Math.round((i*23+t*150)%(H+6))-6;px(g,x,y,1,3,'#A8C4F0')}
  g.globalAlpha=1;
}
function drawScene(t){
  // sky
  [['#FFE6C8',0,14],['#FFD8BE',14,24],['#FFC9BB',24,31],['#FBB9C0',31,37],['#F2AEC7',37,42],['#E6A6CC',42,46]].forEach(([c,a,b])=>px(g,0,a,W,b-a,c));
  // drifting clouds
  [[20,19,.6],[92,15,.4],[140,22,.5]].forEach(([x0,y,sp],i)=>{const x=Math.round((x0+t*sp*3)%(W+30))-20;px(g,x,y,14,2,'#FFF6EE');px(g,x+3,y-1,7,1,'#FFF6EE');px(g,x+2,y+2,11,1,'#FBE5E2')});
  // far stalls
  [[-4,31,26],[22,35,28],[50,29,22],[72,34,26],[96,30,30],[124,33,20],[142,30,24]].forEach(([x,y,w],i)=>{
    px(g,x,y,w,52-y,i%2?'#C3A6D6':'#B79BCF');px(g,x-1,y-2,w+2,2,'#D6C0E6');
    for(let k=0;k<w;k+=4)px(g,x+k,y,2,1,i%2?'#F4B6CB':'#FFE0B5');
    px(g,x+3,y+5,w-6,6,'#9F84B8');px(g,x+4,y+6,w-8,4,Math.floor(t*.5+i)%9?'#FFE7AE':'#FFF3CF');
    px(g,x+4,y+9,w-8,1,'#E9C48F');
  });
  // street
  px(g,0,52,W,10,'#EDCFCB');
  for(let i=0;i<18;i++)px(g,(i*23+5)%W,53+(i%3)*3,2,1,'#E0B9B8');
  drawWalker(t);
  // string lights
  const bulbs=['#F2A541','#7ED6B8','#E86A6A','#F4EBD6'];
  for(let x=0;x<W;x++){
    const y=11+Math.round(4*Math.sin(Math.PI*((x%53)/53)));
    px(g,x,y,1,1,'#8A6A78');
    if(x%9===4){
      const on=Math.floor(t*2+x*.31)%7!==0,col=bulbs[Math.floor(x/9)%4];
      if(on){g.globalAlpha=.22;px(g,x-2,y,5,5,col);g.globalAlpha=1}
      px(g,x-1,y+1,3,3,on?col:'#D8C4D6');
    }
  }
  // customers
  S.customers.forEach(c=>drawPerson(c,t));
  // counter + props
  px(g,0,60,W,20,'#CF915F');px(g,0,60,W,2,'#EDB888');px(g,0,62,W,1,'#A76C44');
  for(let x=10;x<W;x+=20)px(g,x,63,1,14,'#B97A4E');
  for(let x=4;x<W;x+=20){px(g,x,68,2,1,'#E8A87A');px(g,x-1,69,1,1,'#E8A87A');px(g,x+2,69,1,1,'#E8A87A')} // little paw prints
  px(g,0,77,W,3,'#A76C44');
  // tip jar
  const coins=Math.min(7,Math.floor(S.tips/8));
  px(g,3,49,11,11,OUT);px(g,4,50,9,10,'#BFDCEA');px(g,4,49,9,1,'#EAF6FB');
  for(let i=0;i<coins;i++)px(g,5+(i%3)*3,58-Math.floor(i/3)*2,2,1,'#F2C94C');
  px(g,5,51,1,6,'#FFFFFF');
  // menu board
  px(g,141,44,16,16,OUT);px(g,142,45,14,14,'#23302A');
  for(let r=0;r<4;r++){px(g,144,47+r*3,6,1,'#CFE6D8');px(g,152,47+r*3,2,1,'#F2A541')}
  // awning
  for(let x=0;x<W;x+=8){const c=(x/8)%2?'#FFF4EA':'#F58DA6';px(g,x,0,8,5,c);px(g,x+1,5,6,1,c);px(g,x+2,6,4,1,c);px(g,x+2,7,4,1,'#C85C7A')}
  px(g,0,0,W,1,'#D96A86');
  drawDecor(t);
  drawShopCats(t);
  drawWeather(t);
  if(S.phase==='paused'){g.globalAlpha=.45;px(g,0,0,W,H,'#FFF6EF');g.globalAlpha=1}
}
function cupInside(x,y){if(y<12||y>52)return false;return Math.abs(x-20)<=13-(y-12)*(3/40)}
function drawCup(){
  cg.clearRect(0,0,40,56);
  blit(cg,0,0,40,56,cupInside,'#F6EEF4','#B9A2B8');
  const bandTops=cup.tops.filter(t=>t!=='foam');
  if(cup.tea){
    const col=tea(cup.tea).color,topY=Math.round(52-36*cup.level);
    for(let y=topY;y<=52;y++)for(let x=0;x<40;x++)if(cupInside(x+.5,y+.5))px(cg,x,y,1,1,col);
    if(cup.level>.98)px(cg,8,16,24,1,'rgba(255,255,255,.25)');
  }
  // straw
  if(cup.tea){px(cg,27,1,4,11,'#F2708F');px(cg,27,1,1,11,'#FFA3B8');cg.globalAlpha=.5;px(cg,27,12,4,34,'#F2708F');cg.globalAlpha=1}
  // bottom toppings
  bandTops.forEach((id,bi)=>{
    const y1=51-bi*6,y0=y1-5;
    if(id==='pearl'){for(let yy=y0+1,r=0;yy<y1;yy+=3,r++)for(let x=10+(r%2)*2;x<31;x+=4)if(cupInside(x+1,yy+1)){px(cg,x,yy,2,2,'#3A2418');px(cg,x,yy,1,1,'#7A5A48')}}
    if(id==='grass'){for(let x=10;x<30;x+=5)if(cupInside(x+1,y0+2)){px(cg,x,y0+1,3,3,'#2B2622');px(cg,x,y0+1,3,1,'#4A423A')}for(let x=12;x<29;x+=5)px(cg,x,y0+3,3,2,'#2B2622')}
    if(id==='pudding'){for(let y=y0+1;y<=y1;y++)for(let x=0;x<40;x++)if(cupInside(x+.5,y+.5))px(cg,x,y,1,1,y===y1?'#D29A2F':'#F2C94C');px(cg,15,y0+3,1,1,'#6B4A2A');px(cg,24,y0+3,1,1,'#6B4A2A');px(cg,19,y0+4,2,1,'#C9822F')}
    if(id==='lychee'){for(let x=10;x<30;x+=6){px(cg,x,y0+2,4,3,'#F9C3D2');px(cg,x+1,y0+3,2,1,'#EC8AA6');px(cg,x,y0+1,1,1,'#EC8AA6');px(cg,x+3,y0+1,1,1,'#EC8AA6')}}
  });
  // ice
  const ice=[[11,19],[22,23],[15,28],[25,31]].slice(0,[0,2,4][cup.ice??0]);
  ice.forEach(([x,y])=>{cg.globalAlpha=.9;px(cg,x,y,5,5,'#9CC7DC');px(cg,x+1,y+1,3,3,'#DDF2FA');px(cg,x+1,y+1,1,1,'#FFFFFF');cg.globalAlpha=1});
  // foam
  if(cup.tops.includes('foam')){for(let y=13;y<=18;y++)for(let x=0;x<40;x++)if(cupInside(x+.5,y+.5)&&!(y===18&&x%3===0))px(cg,x,y,1,1,y===13?'#FFF8E6':'#F3E6C4')}
  // sugar drops
  if(cup.sugar){const n=cup.sugar/10|0;for(let i=0;i<n;i++)px(cg,36,52-i*3,2,2,'#F2A541')}
  // rim + gloss
  px(cg,6,11,29,1,'#FFFFFF');px(cg,5,10,31,1,'#D9C7D6');
  // sealing machine press, then the sealed film with a paw print
  if(S&&S.sealT>0){const q=1-S.sealT/.6,y=Math.round(q*7);px(cg,18,0,4,y+2,'#8C86A4');px(cg,4,y+2,33,3,METAL);px(cg,4,y+2,33,1,METAL_HI)}
  if(cup.sealed){px(cg,6,9,29,3,'#FFF1F5');px(cg,6,11,29,1,'#F2B8C8');px(cg,19,9,3,2,'#F2708F');px(cg,18,8,1,1,'#F2708F');px(cg,20,8,1,1,'#F2708F');px(cg,22,8,1,1,'#F2708F')}
  // cat ears on the lid and a little cat face once there's tea inside
  const ear=(cx,dir)=>{for(let i=0;i<5;i++){const w=Math.max(1,5-i);px(cg,cx-(dir<0?0:w-1),9-i,w,1,'#B9A2B8');if(w>2)px(cg,cx-(dir<0?-1:w-2),9-i,w-2,1,i<3?'#FBD3DE':'#FFF6F8')}};
  ear(8,-1);ear(32,1);
  if(cup.tea&&cup.level>.6){px(cg,15,21,1,2,'#3B2A2D');px(cg,23,21,1,2,'#3B2A2D');px(cg,18,24,1,1,'#3B2A2D');px(cg,19,25,1,1,'#3B2A2D');px(cg,20,24,1,1,'#3B2A2D');
    cg.globalAlpha=.55;px(cg,13,24,2,1,'#FF8FAB');px(cg,24,24,2,1,'#FF8FAB');cg.globalAlpha=1}
  cg.globalAlpha=.3;px(cg,9,14,2,34,'#FFFFFF');cg.globalAlpha=1;
}

/* ---------- prep: brewing and pearl cooking ---------- */
let mini=null;
const mg=$('#mcv').getContext('2d');
function renderPrep(){
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
  $('#popen').disabled=!!mini;
}
$('#prep').addEventListener('click',e=>{const b=e.target.closest('[data-prep]');if(b)startMini(b.dataset.prep)});
let miniCount=0;

function startMini(id){
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
  $('#mact').disabled=false;$('#mini').hidden=false;renderPrep();
  $('#mini').scrollIntoView({block:'nearest'});$('#mact').focus({preventScroll:true});sfx.pour();
}
function miniAct(){
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
function whisk(dir){const m=mini;if(!m||m.kind!=='whisk'||m.done)return;if(dir!==m.dir){m.froth=Math.min(100,m.froth+7);m.dir=dir;m.wx=32+dir*8;beep(900+Math.random()*300,.03,'triangle',.02)}}
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
function finishSteep(){
  const m=mini,d=m.v-m.center,a=Math.abs(d);
  const q=a<=m.w/2?'perfect':a<=m.w/2+14?'good':d<0?'weak':'bitter';
  finishMini(q,teaBatch());
}
function finishMini(q,n){
  const m=mini;m.done=true;
  // pearls are two steps: knead the dough first, then cook it
  if(m.kind==='knead'){
    $('#mtext').textContent=`Nhào xong (${QUAL[q].label}). Giờ thả viên bột vào nồi nấu…`;
    $('#mact').disabled=true;$('#mact').textContent=QUAL[q].label;(q==='clumpy'?sfx.fail:sfx.ok)();
    setTimeout(()=>{if(mini!==m)return;
      mini={kind:'stir',id:m.id,t:0,dur:6,s:20,peak:20,clumps:0,stirT:0,ang:0,done:false,prevQ:q,prevN:n};
      $('#mtext').textContent='Bước 2/2 · Nấu trân châu: bấm Khuấy để hạt không dính vào nhau, đừng để thanh chạm vùng đỏ.';
      $('#mact').textContent=MINI_INFO.stir.label;$('#mact').disabled=false;$('#mact').focus({preventScroll:true});sfx.pour();
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
  $('#mact').disabled=true;$('#mact').textContent=QUAL[q].label;
  (q==='perfect'?sfx.win:q==='good'?sfx.ok:sfx.fail)();
  setTimeout(()=>{if(mini===m){mini=null;renderPrep();$('#popen').focus({preventScroll:true})}},1500);
}
function updateMini(dt){
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
function lerpHex(a,b,t){
  t=Math.max(0,Math.min(1,t));const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);
  const ch=s=>Math.round(((A>>s)&255)+(((B>>s)&255)-((A>>s)&255))*t);
  return '#'+((1<<24)|(ch(16)<<16)|(ch(8)<<8)|ch(0)).toString(16).slice(1);
}
function heartOn(c,x,y){px(c,x,y,1,1,'#F2708F');px(c,x+2,y,1,1,'#F2708F');px(c,x,y+1,3,1,'#F2708F');px(c,x+1,y+2,1,1,'#F2708F')}
function line(c,x0,y0,x1,y1,col){const n=Math.max(Math.abs(x1-x0),Math.abs(y1-y0))|0;for(let i=0;i<=n;i++)px(c,x0+(x1-x0)*i/n,y0+(y1-y0)*i/n,2,2,col)}
function drawMini(t){
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

/* ---------- juice: particles, cup lift-off, shake ---------- */
let parts=[],lifted=null;
function sparkle(x,y){
  const cols=['#F2A541','#7ED6B8','#F4EBD6','#E86A6A'];
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;parts.push({k:'spark',x,y,vx:Math.cos(a)*(22+Math.random()*14),vy:Math.sin(a)*(16+Math.random()*10)-8,life:0,max:.6,col:cols[i%4]})}
}
function coins(x,n){for(let i=0;i<n;i++)parts.push({k:'coin',x0:x,y0:46,x1:8,y1:50,life:-i*.09,max:.7,x,y:46})}
function puff(x,y){for(let i=0;i<7;i++)parts.push({k:'puff',x:x-6+Math.random()*12,y:y-Math.random()*6,vx:(Math.random()-.5)*8,vy:-10-Math.random()*8,life:0,max:.8})}
function shake(){if(!settings.shake)return;const el=$('.scene');el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}
function updateParts(dt){
  for(const p of parts){
    p.life+=dt;if(p.life<0)continue;
    if(p.k==='coin'){const q=Math.min(1,p.life/p.max);p.x=p.x0+(p.x1-p.x0)*q;p.y=p.y0+(p.y1-p.y0)*q-Math.sin(Math.PI*q)*16;
      if(q>=1&&!p.done){p.done=true;beep(1760+Math.random()*300,.05,'square',.018)}}
    else{p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==='spark')p.vy+=40*dt}
  }
  parts=parts.filter(p=>p.life<p.max);
}
function drawParts(){
  for(const p of parts){
    if(p.life<0)continue;const f=1-p.life/p.max;
    if(p.k==='spark'){g.globalAlpha=f;px(g,p.x,p.y,1,1,p.col);if(f>.5){px(g,p.x-1,p.y,1,1,p.col);px(g,p.x+1,p.y,1,1,p.col);px(g,p.x,p.y-1,1,1,p.col);px(g,p.x,p.y+1,1,1,p.col)}}
    else if(p.k==='coin'){px(g,p.x-1,p.y-1,3,3,OUT);px(g,p.x-1,p.y-1,2,2,'#F2C94C');px(g,p.x-1,p.y-1,1,1,'#FFF1B0')}
    else{g.globalAlpha=f*.7;px(g,p.x,p.y,3,2,'#8E86A8');px(g,p.x+1,p.y-1,1,1,'#B8B2CC')}
    g.globalAlpha=1;
  }
}
function liftCup(){
  const c=document.createElement('canvas');c.width=40;c.height=56;const x=c.getContext('2d');
  x.drawImage(cupC,0,0);
  x.fillStyle='#F4EBD6';x.fillRect(6,9,29,3);x.fillStyle='#E86A6A';x.fillRect(14,10,13,1);
  lifted={c,t:0};
}
function drawLifted(dt){
  if(!lifted)return;lifted.t+=dt;const q=lifted.t/.45;
  if(q>=1){lifted=null;return}
  cg.globalAlpha=1-q;cg.drawImage(lifted.c,0,Math.round(-q*q*34));cg.globalAlpha=1;
}

/* ---------- counter sign ---------- */
let signShown=false,signTarget=false,signFlip=0;
const GLYPH={'0':['111','101','101','101','111'],'1':['01','11','01','01','01'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','001','001','001'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111'],'#':['01010','11111','01010','11111','01010'],O:['111','101','101','101','111'],P:['111','101','111','100','100'],E:['111','100','110','100','111'],N:['1001','1101','1011','1001','1001'],
  C:['111','100','100','100','111'],L:['100','100','100','100','111'],S:['111','100','111','001','111'],D:['110','101','101','101','110']};
function pixText(c,str,x,y,col){for(const ch of str){const gl=GLYPH[ch];gl.forEach((r,j)=>[...r].forEach((b,i)=>{if(b==='1')px(c,x+i,y+j,1,1,col)}));x+=gl[0].length+1}}
const textW=str=>[...str].reduce((a,ch)=>a+GLYPH[ch][0].length+1,-1);
function drawSign(t,dt){
  signTarget=S.phase==='open'||S.phase==='paused';
  if(signTarget!==signShown&&signFlip<=0){signFlip=.5;if(signTarget)sfx.bell()}
  if(signFlip>0){signFlip-=dt;if(signFlip<=.25&&signShown!==signTarget)signShown=signTarget}
  const bw=31,bh=11,bx=80-15,by=65;
  const squash=signFlip>0?Math.abs(Math.cos((.5-signFlip)/.5*Math.PI)):1;
  const h=Math.max(1,Math.round(bh*squash)),y0=by+Math.round((bh-h)/2);
  px(g,bx+5,62,1,y0-62,'#3A2A20');px(g,bx+bw-6,62,1,y0-62,'#3A2A20');
  px(g,bx-1,y0-1,bw+2,h+2,OUT);px(g,bx,y0,bw,h,signShown?'#1E3A32':'#3A1E2A');
  if(squash>.8){
    const word=signShown?'OPEN':'CLOSED',col=signShown?'#7ED6B8':'#E86A6A';
    if(signShown){g.globalAlpha=.25+.1*Math.sin(t*4);px(g,bx+3,y0+2,bw-6,h-4,col);g.globalAlpha=1}
    pixText(g,word,bx+Math.round((bw-textW(word))/2),y0+3,col);
    if(signShown)for(let i=0;i<bw;i+=3){const on=(Math.floor(t*6)+i/3)%2<1;px(g,bx+i,y0,1,1,on?'#F2A541':'#6B4A2A');px(g,bx+bw-1-i,y0+h-1,1,1,on?'#F2A541':'#6B4A2A')}
  }
}

/* ---------- loop ---------- */
let last=performance.now(),spawnWait=0;
function update(dt){
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
  if(staffOn('hoa')){S.hoaT-=dt;if(S.hoaT<=0){S.hoaT=.5;for(const id in S.brewed)if(!S.brewing[id]&&stockN(id)<=2&&(save.pantry[id]||0)>0){rebrew(id,'hoa');break}}}
  if(S.sealT>0){S.sealT-=dt;if(S.sealT<=0){S.sealT=0;cup.sealed=true;cupChanged();beep(160,.07,'square',.05);beep(110,.12,'square',.05,null,.06)}}
  if(S.bagJob){S.bagJob.t-=dt;if(S.bagJob.t<=0){const sl=S.bagJob.slot;S.bagJob=null;finishBag(sl);renderTickets()}}
  // Bé Na pours tea, sugar and ice for the ticket you asked about
  if(S.naCd>0)S.naCd=Math.max(0,S.naCd-dt);
  if(S.naJob){S.naJob.t-=dt;if(S.naJob.t<=0){const o=S.naJob.order;S.naJob=null;S.naCd=15;
    if(!cup.tea&&cup.sugar===null&&cup.ice===null&&!cup.tops.length&&stockN(o.tea)>0&&useGear('cup')){cup.teaQ=takeServing(o.tea);cup.level=0;cup.tea=o.tea;cup.sugar=o.sugar;cup.ice=o.ice;sfx.pour();cupChanged();hint('Na rót xong! Thêm topping rồi phục vụ nhé.')}}}
  // Anh Tú carries out any cup that matches a ticket
  if(S.autoServe){S.autoServe.t-=dt;if(S.autoServe.t<=0){const i=S.autoServe.slot;S.autoServe=null;const r=ticketRefs[i];if(r&&r.ready)serve(i)}}
  // rush hour: customers pour in for 30 seconds mid-shift
  const rush=feat('rush')&&S.time>RUSH[0]&&S.time<RUSH[1];
  if(rush&&!S.rushShown){S.rushShown=true;floatText(1,'Giờ cao điểm!','streak');hint('Giờ cao điểm! Khách kéo đến đông gấp đôi trong 30 giây.');[660,880,660,880].forEach((f,i)=>beep(f,.09,'square',.03,null,i*.12))}
  S.spawnT-=dt;
  if(S.spawnT<=0&&S.time<DAY_LEN-8){
    S.spawnT=spawn()?(5+Math.random()*4)*Math.max(.55,1-.08*(S.day-1))*(rush?.45:1)/ev().spawn:1;
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
  if(hintT>0){hintT-=dt;if(hintT<=0)$('#hint').textContent=''}
}
let animT=0;
function loop(ts){
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

/* ---------- day flow ---------- */
function showOnly(id){['start','market','prep','end'].forEach(x=>$('#'+x).hidden=x!==id)}
function openMarket(){
  audio();
  if(save.eventDay!==save.day){save.lastEvent=save.event;save.event=rollEvent(save.day);save.eventDay=save.day;persist()}
  newDay(save.day);S.phase='market';showOnly('market');
  const teaPacks=unlocked(TEAS).reduce((a,t)=>a+(save.pantry[t.id]||0),0);
  const cheapest=Math.min(...SUPPLY.filter(x=>x.kind==='tea'&&save.owned.includes(x.id)).map(x=>x.price));
  if(!teaPacks&&save.wallet<cheapest){save.pantry.black=(save.pantry.black||0)+1;persist();mmsg('Dì ghé tặng một gói lá trà đen. Chúc bán đắt hàng!')}
  else mmsg('');
  renderMarket();$('#market').scrollTop=0;
}
function mmsg(t){$('#mmsg').textContent=t}
function marketItem(kind,it){
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
const estDrinks=d=>Math.min(42,22+3*d);
const unitOf=it=>it.gear?GEAR_NAME[it.id]:it.tub?'muỗng':it.id==='pearl'?'bao':'gói';
function shoppingList(day=save.day){
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
function renderNeeds(){
  const {list,drinks}=shoppingList(),total=list.reduce((a,x)=>a+x.cost,0);
  const box=$('#m-need');
  if(!list.length){box.innerHTML=`<p class="needok">Kho đủ dùng cho hôm nay (ước tính khoảng ${drinks} ly).</p>`;return}
  box.innerHTML=`<p class="needsum">Hôm nay ước tính khoảng <b>${drinks} ly</b>. Những món dưới đây sắp thiếu:</p>`+
    list.map(x=>`<div class="needrow"><img src="${x.it.gear?iconURL('gear',x.it.id):iconURL(x.it.kind,x.it.id)}" alt=""><div>${x.it.name}<small>Có ${x.have} · nên có ${x.want} ${unitOf(x.it)}</small></div><button class="btn" type="button" data-needbuy="${x.it.id}"${save.wallet<x.cost?' disabled':''}>Mua ×${x.packs} −${x.cost}k</button></div>`).join('')+
    `<div class="needfoot"><span>Tổng ${total}k</span><button class="btn big" type="button" data-needall${save.wallet<list[0].cost?' disabled':''}>${save.wallet>=total?`Mua hết −${total}k`:'Mua những món đủ tiền'}</button></div>`;
}
function buyNeed(x){if(save.wallet<x.cost)return false;save.wallet-=x.cost;save.pantry[x.it.id]=(save.pantry[x.it.id]||0)+x.packs*packOf(x.it);return true}
function renderRevenue(){
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
function renderNews(){
  const n=NEWS[save.day]||[],e=ev(),box=$('#m-new'),items=[...n];
  if(e!==EVENTS.normal)items.unshift(['Hôm nay: '+e.name,e.desc]);
  if(season)items.push([SEASONS[season].name,SEASONS[season].desc]);
  box.hidden=!items.length;
  if(items.length)box.innerHTML=`<b>${n.length?'Mới hôm nay':'Hôm nay ở tiệm'}</b>`+items.map(([t,d])=>`<p><span>${t}</span>${d}</p>`).join('');
}
function drinkText(o){return `${tea(o.tea).name} · ${o.sugar}% đường · ${ICES[o.ice]}${o.tops.length?' · '+o.tops.map(x=>top(x).name).join(', '):''}`}
function renderFriends(){
  const fr=save.friends||{};
  $('#m-friends').innerHTML=REGULARS.map(r=>{const f=fr[r.id]||{hearts:0};
    const hearts=[0,1,2,3,4].map(i=>`<span class="${i<f.hearts?'on':''}">♥</span>`).join('');
    const note=f.met?`Món ruột: ${drinkText(r.fav)}${f.hearts>=3?`<br><em>${r.bio}</em>`:''}${f.gift?`<br>Quà: ${r.gift}`:''}`:(canMake(r.fav)?'Chưa gặp. Hãy chờ họ ghé tiệm.':'Chưa gặp. Có lẽ tiệm cần thêm món mới.');
    return `<div class="mitem friendcard${f.met?'':' lockd'}"><img src="${iconURL('friend',r.id)}" alt=""><div>${f.met?r.name:'???'}<span class="hearts">${hearts}</span><small>${note}</small></div></div>`}).join('');
}
function renderMarket(){
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
  const nb=e.target.closest('[data-needbuy]'),na=e.target.closest('[data-needall]');
  if(nb||na){audio();const {list}=shoppingList();let n=0,miss=0;
    (na?list:list.filter(x=>x.it.id===nb.dataset.needbuy)).forEach(x=>{if(buyNeed(x))n++;else miss++});
    persist();renderMarket();if(n){sfx.click();mmsg(miss?`Đã mua ${n} món. Còn ${miss} món chưa đủ tiền.`:`Đã mua ${n} món. Kho sẵn sàng!`)}else{sfx.nope();mmsg('Chưa đủ tiền tiết kiệm.')}return}
  const sb=e.target.closest('[data-staff]');
  if(sb){const st=save.staff[sb.dataset.staff];st.on=!st.on;persist();renderMarket();sfx.click();mmsg(st.on?'Nhân viên sẽ đi làm hôm nay.':'Đã cho nhân viên nghỉ hôm nay.');return}
  const b=e.target.closest('[data-buy]');if(!b)return;audio();
  const [kind,id]=b.dataset.buy.split(':');
  const it=(kind==='supply'?SUPPLY:kind==='recipe'?RECIPES:kind==='staff'?STAFF:UPGRADES).find(x=>x.id===id);
  if(save.wallet<it.price){mmsg('Chưa đủ tiền tiết kiệm.');sfx.nope();return}
  save.wallet-=it.price;
  if(kind==='supply'){save.pantry[id]=(save.pantry[id]||0)+packOf(it);sfx.click();mmsg(`Đã mua ${it.name}.`)}
  else if(kind==='recipe'){save.owned.push(id);save.pantry[id]=(save.pantry[id]||0)+(isTub(id)?TUB:1);sfx.win();mmsg(`${it.name} đã có trong menu.`)}
  else if(kind==='staff'){save.staff=save.staff||{};save.staff[id]={hired:true,on:true};sfx.win();meow(1.2,.04,.3);mmsg(`${it.name.split(' · ')[0]} đã vào làm ở tiệm!`)}
  else{save.upgrades.push(id);sfx.win();mmsg(`Đã lắp ${it.name}.`)}
  persist();renderMarket();
});
$('#mgo').addEventListener('click',()=>{
  audio();newDay(save.day);S.phase='prep';showOnly('prep');renderPrep();$('#prep').scrollTop=0;
});
function endDay(){
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
let wipeArmed=false;
function renderStart(){
  const b=$('#startbtns');b.innerHTML='';
  const mk=(label,fn,big)=>{const x=document.createElement('button');x.type='button';x.className='btn'+(big?' big':'');x.textContent=label;x.addEventListener('click',()=>fn(x));b.appendChild(x);return x};
  const fresh=save.day===1&&save.xp===0;
  const first=mk(fresh?'Mở tiệm':`Chơi tiếp: ngày ${save.day}`,()=>openMarket(),true);
  if(!fresh)mk('Chơi lại từ đầu',x=>{
    if(!wipeArmed){wipeArmed=true;x.textContent='Bấm lần nữa để xóa dữ liệu';return}
    save=NEW_SAVE();persist();wipeArmed=false;openMarket();
  },false);
  first.focus();
}

/* ---------- inputs ---------- */
scene.addEventListener('click',e=>{
  const r=scene.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=H-(r.bottom-e.clientY)/r.width*W;
  const c=catAt(x,y);if(c){petCat(c);return}
  SLOTS.forEach((sx,i)=>{if(Math.abs(x-sx)<16){audio();if(document.body.classList.contains('bar-new')){const cu=S.slots[i];if(cu&&cu.state==='wait'){S.focus=cu.id;S.focusManual=true;sfx.click();renderTickets()}}else serve(i)}});
});
let menuPaused=false;
function openMenu(){
  const inShift=S.phase==='open'||S.phase==='paused';
  if(S.phase==='open')setPaused(true);
  menuPaused=inShift;
  $('#pm-lab').textContent=inShift?`Tạm dừng · Ngày ${S.day}`:'Cài đặt';
  $('#pm-title').textContent=inShift?'Nghỉ tay chút nhé':'Cài đặt';
  $('#pm-resume').textContent=inShift?'Tiếp tục':'Xong';
  $('#pm-qsec').hidden=!(S.quests&&(inShift||S.phase==='prep'));
  $('#pm-quests').innerHTML=S.quests?questRows(S.quests):'';
  syncSettingsUI();$('#pausemenu').hidden=false;$('#pm-resume').focus();
}
function closeMenu(){
  $('#pausemenu').hidden=true;
  if(menuPaused&&S.phase==='paused')setPaused(false);
}
const bkMsg=t=>{$('#bk-msg').textContent=t};
let bkArmed=false;
$('#bk-make').addEventListener('click',()=>{
  const code='MTC1.'+btoa(unescape(encodeURIComponent(JSON.stringify(save))));
  $('#bk-code').value=code;$('#bk-copy').hidden=false;bkMsg('Đã tạo mã. Hãy cất mã này ở nơi an toàn.');
});
$('#bk-copy').addEventListener('click',()=>{
  const t=$('#bk-code');
  navigator.clipboard&&navigator.clipboard.writeText(t.value).then(()=>bkMsg('Đã sao chép mã.'),()=>{t.select();bkMsg('Hãy nhấn giữ và chọn Sao chép.')});
  if(!navigator.clipboard){t.select();bkMsg('Hãy nhấn giữ và chọn Sao chép.')}
});
$('#bk-load').addEventListener('click',()=>{
  const raw=$('#bk-code').value.trim();let data=null;
  try{if(!raw.startsWith('MTC1.'))throw 0;data=JSON.parse(decodeURIComponent(escape(atob(raw.slice(5)))));if(!data||!Array.isArray(data.owned)||!data.pantry)throw 0}catch(e){bkMsg('Mã không hợp lệ. Hãy kiểm tra lại.');sfx.nope();bkArmed=false;return}
  if(!bkArmed){bkArmed=true;$('#bk-load').textContent='Bấm lần nữa để thay dữ liệu hiện tại';bkMsg(`Mã hợp lệ: ngày ${data.day}, tiết kiệm ${data.wallet}k.`);return}
  bkArmed=false;$('#bk-load').textContent='Khôi phục từ mã';
  save=Object.assign(NEW_SAVE(),data);if(save.pantry.cup===undefined)Object.assign(save.pantry,{cup:40,straw:40,film:40,bag:10});
  persist();bkMsg('Đã khôi phục!');sfx.win();
  setTimeout(()=>{$('#pausemenu').hidden=true;openMarket()},700);
});
function syncSettingsUI(){
  $('#set-music').value=settings.music;$('#out-music').textContent=settings.music+'%';
  $('#set-sfx').value=settings.sfx;$('#out-sfx').textContent=settings.sfx+'%';
  $('#set-shake').checked=settings.shake;$('#set-vi').checked=settings.vi;
  document.body.classList.toggle('no-vi',!settings.vi);
  $('#set-classic').checked=settings.layout==='classic';
  document.body.classList.toggle('bar-new',settings.layout!=='classic');
}
$('#set-classic').addEventListener('change',e=>{settings.layout=e.target.checked?'classic':'new';saveSettings();syncSettingsUI();if(S)renderTickets()});
$('#set-music').addEventListener('input',e=>{settings.music=+e.target.value;$('#out-music').textContent=settings.music+'%';musicLevel(Math.max(.0001,musicBase()));saveSettings()});
$('#set-sfx').addEventListener('input',e=>{settings.sfx=+e.target.value;$('#out-sfx').textContent=settings.sfx+'%';saveSettings()});
$('#set-sfx').addEventListener('change',()=>{audio();sfx.ok()});
$('#set-shake').addEventListener('change',e=>{settings.shake=e.target.checked;saveSettings();if(settings.shake)shake()});
$('#set-vi').addEventListener('change',e=>{settings.vi=e.target.checked;saveSettings();syncSettingsUI()});
$('#pm-resume').addEventListener('click',closeMenu);
$('#settings').addEventListener('click',()=>{audio();$('#pausemenu').hidden?openMenu():closeMenu()});
syncSettingsUI();
function setPaused(on){
  S.phase=on?'paused':'open';
  $('#pause').textContent=on?'Tiếp tục':'Tạm dừng';
  document.body.classList.toggle('is-paused',on);
  musicLevel(Math.max(.0001,musicBase()*(on?.6:1)));
  $('#pausedlab').hidden=!on;
  document.querySelectorAll('.station button,.tickets button').forEach(b=>b.tabIndex=on?-1:0);
  hint(on?'Đang tạm dừng. Đồng hồ, khách và quầy đều đứng yên.':'');
}
$('#pause').addEventListener('click',()=>{
  if(S.phase==='open')openMenu();
  else if(S.phase==='paused')closeMenu();
});
$('#music').addEventListener('click',()=>{
  music.on=!music.on;try{localStorage.setItem('tcs-music',music.on?'on':'off')}catch(e){}
  syncMusicBtn();
  if(music.on)audio();else stopMusic();
});
function syncMusicBtn(){const b=$('#music');b.classList.toggle('off',!music.on);b.setAttribute('aria-pressed',music.on?'true':'false');b.setAttribute('aria-label',music.on?'Nhạc: bật':'Nhạc: tắt')}
syncMusicBtn();
$('#mute').addEventListener('click',()=>{muted=!muted;$('#mute').classList.toggle('off',muted);$('#mute').setAttribute('aria-label',muted?'Hiệu ứng âm thanh: tắt':'Hiệu ứng âm thanh: bật');$('#mute').setAttribute('aria-pressed',muted?'true':'false')});
document.addEventListener('keyup',e=>{if(e.key===' '&&mini&&mini.kind==='heat')mini.holding=false});
document.addEventListener('keydown',e=>{
  if(e.target.closest&&e.target.closest('input,textarea'))return;
  if(!$('#pausemenu').hidden){if(e.key==='Escape'||e.key==='p'||e.key==='P'){e.preventDefault();closeMenu()}return}
  if(e.target.closest&&e.target.closest('input,textarea'))return;
  if(e.key==='Escape'&&S.phase==='open'){openMenu();return}
  if(!$('#prep').hidden){if(e.key===' '){e.preventDefault();if(mini&&mini.kind==='heat'){if(!mini.done)mini.holding=true}else if(!e.repeat)miniAct()}else if(e.key==='ArrowLeft')whisk(-1);else if(e.key==='ArrowRight')whisk(1);return}
  if(!$('#start').hidden||!$('#end').hidden||!$('#market').hidden)return;
  if(e.key==='p'||e.key==='P'){openMenu();return}
  if(S.phase!=='open')return;
  if(['1','2','3'].includes(e.key)){audio();serve(+e.key-1)}
  else if(e.key==='x'||e.key==='X'||e.key==='Backspace'){e.preventDefault();dump()}
  else if(e.key==='s'||e.key==='S'){sealCup()}
  else if((e.key==='r'||e.key==='R')&&!$('#again').hidden){pourAgain()}
  else if(e.key==='Enter'||e.key===' '){e.preventDefault();serveTarget()}
});

newDay(save.day);renderStart();
requestAnimationFrame(loop);
