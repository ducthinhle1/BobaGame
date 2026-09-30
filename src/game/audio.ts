import {ev} from './customers';
import {loop} from './loop';
import {musicBase,settings} from './settings';

/* ---------- sound ---------- */
export let actx=null,muted=false;
// a tenth of a second of silence as a real audio file; playing it (looped) inside a tap moves iPhones to the
// media audio channel, so the game is audible even with the ring/silent switch on
export let silentEl=null;
export function silentWavURL(){
  const n=4410,b=new ArrayBuffer(44+n*2),v=new DataView(b),w=(o,t)=>{for(let i=0;i<t.length;i++)v.setUint8(o+i,t.charCodeAt(i))};
  w(0,'RIFF');v.setUint32(4,36+n*2,true);w(8,'WAVE');w(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
  v.setUint32(24,44100,true);v.setUint32(28,88200,true);v.setUint16(32,2,true);v.setUint16(34,16,true);w(36,'data');v.setUint32(40,n*2,true);
  return URL.createObjectURL(new Blob([b],{type:'audio/wav'}));
}
export function audio(){try{
  try{if((navigator as any).audioSession&&(navigator as any).audioSession.type!=='playback')(navigator as any).audioSession.type='playback'}catch(e){}
  if(!actx){
    actx=new (window.AudioContext||(window as any).webkitAudioContext)();
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
export function beep(f,d,type='square',v=.04,to?,delay=0){
  if(muted||!actx)return;
  const t0=actx.currentTime+delay,o=actx.createOscillator(),gn=actx.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);if(to)o.frequency.exponentialRampToValueAtTime(to,t0+d);
  v*=settings.sfx/100;if(v<.0005)return;gn.gain.setValueAtTime(v,t0);gn.gain.exponentialRampToValueAtTime(.0001,t0+d);
  o.connect(gn).connect(actx.destination);o.start(t0);o.stop(t0+d+.02);
}
// a synthesized meow: a buzzy voice through a moving 'mi-a-ow' mouth filter
export function meow(pitch=1,vol=.07,delay=0){
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
export function purr(dur=1.3,vol=.09){
  if(muted||!actx)return;const v=vol*settings.sfx/100;if(v<.0005)return;
  const t=actx.currentTime,o=actx.createOscillator(),lp=actx.createBiquadFilter(),am=actx.createGain(),lfo=actx.createOscillator(),depth=actx.createGain(),gn=actx.createGain();
  o.type='sawtooth';o.frequency.value=48;lp.type='lowpass';lp.frequency.value=320;
  lfo.frequency.value=24;depth.gain.value=.5;am.gain.value=.5;lfo.connect(depth).connect(am.gain);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(v,t+.15);gn.gain.setValueAtTime(v,t+dur-.3);gn.gain.linearRampToValueAtTime(0,t+dur);
  o.connect(lp).connect(am).connect(gn).connect(actx.destination);
  o.start(t);lfo.start(t);o.stop(t+dur+.05);lfo.stop(t+dur+.05);
}
export const sfx={
  click:()=>beep(660,.05,'square',.03),
  pour:()=>beep(260,.3,'triangle',.06,520),
  bell:()=>{beep(1175,.09,'square',.025);beep(1568,.14,'square',.025,null,.08)},
  win:()=>{[523,659,784,1047].forEach((f,i)=>beep(f,.1,'square',.035,null,i*.07))},
  ok:()=>{beep(523,.1,'square',.03);beep(659,.12,'square',.03,null,.08)},
  fail:()=>beep(220,.35,'sawtooth',.03,98),
  nope:()=>beep(160,.12,'square',.03),
};

/* ---------- background music: an original lo-fi loop generated live ---------- */
/** background music state; the audio nodes are attached when it first starts */
export const music:{on:boolean;started:boolean;[node:string]:any}={on:true,started:false};
try{if(localStorage.getItem('tcs-music')==='off')music.on=false}catch(e){}
export function mtof(m){return 440*Math.pow(2,(m-69)/12)}
export const STEP=60/74/2; // eighth notes at 74 bpm
export const PROG:[number,number[]][]=[ // 8-bar loop: [bass root, chord voicing]
  [41,[57,60,64,67]],[40,[55,59,62,64]],[38,[53,57,60,64]],[36,[52,55,59,64]],
  [34,[50,53,57,62]],[33,[48,52,55,60]],[31,[50,53,58,62]],[36,[48,53,55,58]],
];
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function startMusic(){
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
export function stopMusic(){
  if(!music.started)return;music.started=false;clearInterval(music.timer);
  const m={...music},t=actx.currentTime;
  m.master.gain.cancelScheduledValues(t);m.master.gain.setTargetAtTime(0,t,.4);
  setTimeout(()=>{try{m.crackle.stop();m.lfo.stop();m.master.disconnect()}catch(e){}},2500);
}
export function musicLevel(v){if(music.started){const t=actx.currentTime;music.master.gain.cancelScheduledValues(t);music.master.gain.setTargetAtTime(v,t,.5)}}
export function voice(type,freq,t,dur,vol,dest,detune?){
  const o=actx.createOscillator(),gn=actx.createGain();o.type=type;o.frequency.value=freq;
  if(detune)music.lfoAmt.connect(o.detune);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(vol,t+.02);
  gn.gain.exponentialRampToValueAtTime(vol*.3,t+Math.min(.7,dur*.5));gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  o.connect(gn).connect(dest);o.start(t);o.stop(t+dur+.05);
}
export function keys(m,t,dur,vol){voice('sine',mtof(m),t,dur,vol,music.warm,true);voice('triangle',mtof(m)*2.003,t,dur*.6,vol*.1,music.warm,true)}
export function bell(m,t){const f=mtof(m);[music.warm,music.delay].forEach(dst=>{voice('sine',f,t,1.6,.06,dst);voice('sine',f*3.01,t,.5,.008,dst)})}
export function bass(m,t,dur){const o=actx.createOscillator(),gn=actx.createGain();o.type='sine';o.frequency.value=mtof(m);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(.2,t+.03);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn).connect(music.warm);o.start(t);o.stop(t+dur+.05)}
export function kick(t){const o=actx.createOscillator(),gn=actx.createGain();o.frequency.setValueAtTime(95,t);o.frequency.exponentialRampToValueAtTime(42,t+.14);
  gn.gain.setValueAtTime(.26,t);gn.gain.exponentialRampToValueAtTime(.0001,t+.28);o.connect(gn).connect(music.master);o.start(t);o.stop(t+.3)}
export function noiseHit(t,type,f,vol,dur){const src=actx.createBufferSource();src.buffer=music.buf;const fl=actx.createBiquadFilter();fl.type=type;fl.frequency.value=f;
  const gn=actx.createGain();gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.connect(fl).connect(gn).connect(music.warm);src.start(t,Math.random()*1.5);src.stop(t+dur+.02)}
export function scheduleMusic(){
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
export function setMuted(v){muted=v}
