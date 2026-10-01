import {ev} from './customers';
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
/** one soft synth note. Harsh waveforms are softened (square/sawtooth play as triangle) and every note
 *  fades in over a few ms, so nothing clicks; this keeps the effects in tune with the lo-fi music. */
export function beep(f,d,type='triangle',v=.04,to?,delay=0){
  if(muted||!actx)return;
  if(type==='square'||type==='sawtooth'){type='triangle';v*=.8}
  const t0=actx.currentTime+delay,o=actx.createOscillator(),gn=actx.createGain();
  o.type=type;o.frequency.setValueAtTime(f,t0);if(to)o.frequency.exponentialRampToValueAtTime(to,t0+d);
  v*=settings.sfx/100;if(v<.0005)return;
  gn.gain.setValueAtTime(.0001,t0);gn.gain.linearRampToValueAtTime(v,t0+Math.min(.008,d*.2));gn.gain.exponentialRampToValueAtTime(.0001,t0+d);
  o.connect(gn).connect(actx.destination);o.start(t0);o.stop(t0+d+.02);
}
/** a little bell: a sine with a quiet overtone that rings a bit longer */
function ding(f,v,delay=0,len=.45){v*=1.5;beep(f,len,'sine',v,null,delay);beep(f*2.01,len*.5,'sine',v*.25,null,delay);beep(f*3.98,len*.2,'sine',v*.08,null,delay)}
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
  // a soft wooden tick for buttons
  click:()=>{beep(1320,.035,'sine',.032);beep(2640,.02,'sine',.009)},
  // a round "pop" for toppings and choices on the bar
  pop:()=>{beep(520,.08,'sine',.065,1040);beep(1560,.03,'sine',.012,null,.03)},
  // pouring: a rising glide plus two tiny bubbles
  pour:()=>{beep(330,.3,'sine',.06,640);beep(1400,.03,'sine',.018,null,.14);beep(1650,.03,'sine',.015,null,.22)},
  // a shop-door bell
  bell:()=>{ding(1568,.028);ding(2093,.022,.09)},
  // a happy music-box arpeggio
  win:()=>{[659,784,988,1319].forEach((f,i)=>ding(f,.026,i*.075,.5))},
  ok:()=>{ding(784,.026);ding(1047,.022,.08)},
  // a gentle "uh-oh" instead of a buzzer
  fail:()=>{beep(392,.18,'triangle',.045,330);beep(330,.26,'triangle',.042,262,.16)},
  nope:()=>beep(247,.09,'triangle',.038,220),
};

/* ---------- background music: an original lo-fi loop generated live ---------- */
/** background music state; the audio nodes are attached when it first starts */
export const music:{on:boolean;started:boolean;[node:string]:any}={on:true,started:false};
try{if(localStorage.getItem('tcs-music')==='off')music.on=false}catch(e){}
export function mtof(m){return 440*Math.pow(2,(m-69)/12)}
/*  "Mèo Trân Châu" theme — an original 32-bar lo-fi tune in F major, 84 bpm with a lazy swing.
    Form: A (intro: Rhodes, bass, soft drums) → A' (music-box melody) → B (kalimba arpeggios, a little
    "mew" call and answer) → A'' (melody an octave up with sparkles), then around again.  */
export const STEP=60/84/2; // eighth notes at 84 bpm
// [bass root, Rhodes voicing] per bar: Fmaj7 | Am7 | Dm7 | C7sus | Bbmaj7 | Am7 | Gm7 | C7
export const PROG:[number,number[]][]=[
  [41,[53,57,60,64]],[45,[52,55,57,60]],[38,[50,53,57,60]],[36,[53,55,58,60]],
  [34,[53,57,58,62]],[33,[52,55,57,60]],[31,[50,53,55,58]],[36,[52,55,58,60]],
];
const _=null,M='mew';
// melody, eight eighth-notes per bar (MIDI; _ = rest, M = a tiny cat "mew")
const MEL_A:(number|null|string)[][]=[
  [81,_,79,77,_,_,72,_],[_,_,77,79,81,_,_,_],[84,_,81,_,79,_,77,_],[79,_,_,_,_,_,_,_],
  [77,_,79,81,_,86,_,84],[_,_,81,_,79,_,_,_],[77,_,_,79,_,77,_,74],[77,_,_,_,_,_,_,_],
];
const MEL_B:(number|null|string)[][]=[
  [_,_,_,_,84,_,86,_],[84,_,81,_,_,_,_,_],[_,_,_,_,81,_,84,_],[79,_,_,_,_,_,M,_],
  [_,_,_,_,86,_,88,_],[86,_,84,_,_,_,_,_],[_,_,81,_,79,_,77,_],[79,_,_,_,_,_,M,_],
];
export function rng(seed){return()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
export function startMusic(){
  if(!actx||music.started)return;
  music.started=true;
  const now=actx.currentTime;
  const master=actx.createGain();master.gain.setValueAtTime(0,now);master.gain.linearRampToValueAtTime(Math.max(.0001,musicBase()),now+3);
  const warm=actx.createBiquadFilter();warm.type='lowpass';warm.frequency.value=2600;warm.Q.value=.4;
  warm.connect(master).connect(actx.destination);
  // a soft dotted-eighth echo for the bells and the kalimba
  const delay=actx.createDelay(2);delay.delayTime.value=STEP*3;
  const fb=actx.createGain();fb.gain.value=.28;const wet=actx.createGain();wet.gain.value=.3;
  const dtone=actx.createBiquadFilter();dtone.type='lowpass';dtone.frequency.value=1800;
  delay.connect(dtone).connect(fb).connect(delay);dtone.connect(wet).connect(warm);
  // slow tape wobble on the Rhodes
  const lfo=actx.createOscillator();lfo.frequency.value=.3;const lfoAmt=actx.createGain();lfoAmt.gain.value=6;lfo.connect(lfoAmt);lfo.start();
  // noise for the drums
  const len=actx.sampleRate*2,buf=actx.createBuffer(1,len,actx.sampleRate),d=buf.getChannelData(0);
  for(let i=0;i<len;i++)d[i]=Math.random()*2-1;
  // vinyl: mostly silence, a whisper of hiss and a few soft pops
  const vlen=actx.sampleRate*4,vbuf=actx.createBuffer(1,vlen,actx.sampleRate),v=vbuf.getChannelData(0);
  for(let i=0;i<vlen;i++)v[i]=(Math.random()*2-1)*.04;
  for(let k=0;k<6;k++){const at=Math.floor(Math.random()*(vlen-200)),amp=.4+Math.random()*.5;for(let j=0;j<60;j++)v[at+j]+=(Math.random()*2-1)*amp*Math.exp(-j/12)}
  const crackle=actx.createBufferSource();crackle.buffer=vbuf;crackle.loop=true;
  const chp=actx.createBiquadFilter();chp.type='bandpass';chp.frequency.value=1800;chp.Q.value=.7;const cg2=actx.createGain();cg2.gain.value=.01;
  crackle.connect(chp).connect(cg2).connect(master);crackle.start();
  Object.assign(music,{master,warm,delay,lfo,lfoAmt,buf,crackle,next:now+.15,step:0});
  music.timer=setInterval(()=>scheduleMusic(),80);
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
/** warm electric piano */
export function keys(m,t,dur,vol){voice('sine',mtof(m),t,dur,vol,music.warm,true);voice('triangle',mtof(m)*2.003,t,dur*.5,vol*.09,music.warm,true)}
/** music box: a pure tone plus a bright, quickly fading overtone */
export function musicBox(m,t,vol=.05){const f=mtof(m);
  [music.warm,music.delay].forEach((dst,i)=>{voice('sine',f,t,1.3,vol*(i?.6:1),dst);voice('sine',f*4.02,t,.18,vol*.22*(i?.5:1),dst)})}
/** kalimba: a tine that starts a hair sharp and settles */
export function kalimba(m,t,vol=.045){const f=mtof(m),o=actx.createOscillator(),gn=actx.createGain();o.type='sine';
  o.frequency.setValueAtTime(f*1.012,t);o.frequency.exponentialRampToValueAtTime(f,t+.04);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(vol,t+.005);gn.gain.exponentialRampToValueAtTime(.0001,t+.9);
  o.connect(gn);gn.connect(music.warm);gn.connect(music.delay);o.start(t);o.stop(t+.95);
  voice('triangle',f*2,t,.12,vol*.25,music.warm)}
/** a tiny, sweet cat "mew" played as an instrument (pitch slides up, then settles) */
export function mew(t,root=79){const f=mtof(root),o=actx.createOscillator(),fl=actx.createBiquadFilter(),gn=actx.createGain();
  o.type='triangle';o.frequency.setValueAtTime(f*.84,t);o.frequency.linearRampToValueAtTime(f*1.12,t+.09);o.frequency.linearRampToValueAtTime(f*.94,t+.3);
  fl.type='lowpass';fl.frequency.value=2400;
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(.035,t+.03);gn.gain.linearRampToValueAtTime(0,t+.34);
  o.connect(fl).connect(gn);gn.connect(music.warm);gn.connect(music.delay);o.start(t);o.stop(t+.36)}
export function bass(m,t,dur,vol=.19){const o=actx.createOscillator(),gn=actx.createGain();o.type='sine';o.frequency.value=mtof(m);
  gn.gain.setValueAtTime(0,t);gn.gain.linearRampToValueAtTime(vol,t+.03);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gn).connect(music.warm);o.start(t);o.stop(t+dur+.05)}
export function kick(t,vol=.22){const o=actx.createOscillator(),gn=actx.createGain();o.frequency.setValueAtTime(90,t);o.frequency.exponentialRampToValueAtTime(42,t+.13);
  gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.0001,t+.26);o.connect(gn).connect(music.master);o.start(t);o.stop(t+.3)}
export function noiseHit(t,type,f,vol,dur){const src=actx.createBufferSource();src.buffer=music.buf;const fl=actx.createBiquadFilter();fl.type=type;fl.frequency.value=f;
  const gn=actx.createGain();gn.gain.setValueAtTime(vol,t);gn.gain.exponentialRampToValueAtTime(.0001,t+dur);
  src.connect(fl).connect(gn).connect(music.warm);src.start(t,Math.random()*1.5);src.stop(t+dur+.02)}
/** woodblock-ish rim tick: cuter than a snare */
export function tick(t,vol=.03){voice('sine',1650,t,.05,vol,music.warm);noiseHit(t,'bandpass',3200,vol*.8,.03)}
export function scheduleMusic(until?:number){
  if(!music.started)return;
  const horizon=until??actx.currentTime+.4;
  while(music.next<horizon){
    const st=music.step,pos=st%8,bar=Math.floor(st/8)%8,sec=Math.floor(st/64)%4,round=Math.floor(st/256);
    const swing=pos%2?STEP*.2:0,t=music.next+swing;
    const [root,ch]=PROG[bar],r=rng(st*7+round*131);
    // Rhodes: long chord on 1, a soft bouncy re-strike on the "and" of 2 (not in the quiet B section)
    if(pos===0)ch.forEach((n,i)=>keys(n,t+i*.02,STEP*7,.06));
    if(pos===3&&sec!==2)ch.slice(1).forEach(n=>keys(n,t,STEP*2,.028));
    // bass: root on 1, a fifth on the "and" of 3, little walk-up into the next bar
    if(pos===0)bass(root,t,STEP*3);
    if(pos===5)bass(root+7,t,STEP*1.6,.15);
    if(pos===7&&sec!==2)bass(PROG[(bar+1)%8][0]-1,t,STEP*.8,.1);
    // drums: soft kick, woodblock tick on the backbeat, a shaker that leans on the offbeats
    if(pos===0||(pos===5&&sec!==2))kick(t,sec===0&&bar<2?.12:.2);
    if(pos===4)tick(t,sec===2?.02:.03);
    noiseHit(t,'highpass',8000,pos%2?.008:.004,.035);
    // melody
    if(sec===1||sec===3){
      const n=MEL_A[bar][pos];
      if(typeof n==='number'){musicBox(n+(sec===3?12:0),t+.01,sec===3?.04:.05);
        if(sec===3&&r()<.3)musicBox(n+(r()<.5?4:7),t+STEP*.5,.02);} // sprinkles on the last pass
      if(sec===3&&bar===7&&pos===4)[96,100,103].forEach((m,i)=>musicBox(m,t+i*STEP*.33,.018));
    }
    if(sec===2){
      // kalimba walks up and down the chord, the melody answers sparsely, and a cat mews at the end of each phrase
      const arp=[0,1,2,3,2,1,2,3][pos];kalimba(ch[arp]+12,t,.032);
      const n=MEL_B[bar][pos];
      if(typeof n==='number')musicBox(n,t+.01,.042);else if(n===M)mew(t,bar===3?79:84);
    }
    if(sec===0&&bar===7&&pos===6)mew(t); // a little hello before the melody comes in
    music.next+=STEP;music.step++;
  }
}
document.addEventListener('visibilitychange',()=>{if(!actx)return;if(document.hidden)actx.suspend();else actx.resume().catch(()=>{})});
export function setMuted(v){muted=v}
