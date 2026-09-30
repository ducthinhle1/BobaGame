import {beep,sfx} from './audio';
import {$,OUT,cg,cupC,g} from './core';
import {px} from './draw';
import {settings} from './settings';
import {S} from './state';

/* ---------- juice: particles, cup lift-off, shake ---------- */
export let parts=[],lifted=null;
export function sparkle(x,y){
  const cols=['#F2A541','#7ED6B8','#F4EBD6','#E86A6A'];
  for(let i=0;i<10;i++){const a=i/10*Math.PI*2;parts.push({k:'spark',x,y,vx:Math.cos(a)*(22+Math.random()*14),vy:Math.sin(a)*(16+Math.random()*10)-8,life:0,max:.6,col:cols[i%4]})}
}
export function coins(x,n){for(let i=0;i<n;i++)parts.push({k:'coin',x0:x,y0:46,x1:8,y1:50,life:-i*.09,max:.7,x,y:46})}
export function puff(x,y){for(let i=0;i<7;i++)parts.push({k:'puff',x:x-6+Math.random()*12,y:y-Math.random()*6,vx:(Math.random()-.5)*8,vy:-10-Math.random()*8,life:0,max:.8})}
export function shake(){if(!settings.shake)return;const el=$('.scene');el.classList.remove('shake');void el.offsetWidth;el.classList.add('shake')}
export function updateParts(dt){
  for(const p of parts){
    p.life+=dt;if(p.life<0)continue;
    if(p.k==='coin'){const q=Math.min(1,p.life/p.max);p.x=p.x0+(p.x1-p.x0)*q;p.y=p.y0+(p.y1-p.y0)*q-Math.sin(Math.PI*q)*16;
      if(q>=1&&!p.done){p.done=true;beep(1760+Math.random()*300,.05,'square',.018)}}
    else{p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.k==='spark')p.vy+=40*dt}
  }
  parts=parts.filter(p=>p.life<p.max);
}
export function drawParts(){
  for(const p of parts){
    if(p.life<0)continue;const f=1-p.life/p.max;
    if(p.k==='spark'){g.globalAlpha=f;px(g,p.x,p.y,1,1,p.col);if(f>.5){px(g,p.x-1,p.y,1,1,p.col);px(g,p.x+1,p.y,1,1,p.col);px(g,p.x,p.y-1,1,1,p.col);px(g,p.x,p.y+1,1,1,p.col)}}
    else if(p.k==='coin'){px(g,p.x-1,p.y-1,3,3,OUT);px(g,p.x-1,p.y-1,2,2,'#F2C94C');px(g,p.x-1,p.y-1,1,1,'#FFF1B0')}
    else{g.globalAlpha=f*.7;px(g,p.x,p.y,3,2,'#8E86A8');px(g,p.x+1,p.y-1,1,1,'#B8B2CC')}
    g.globalAlpha=1;
  }
}
export function liftCup(){
  const c=document.createElement('canvas');c.width=40;c.height=56;const x=c.getContext('2d');
  x.drawImage(cupC,0,0);
  x.fillStyle='#F4EBD6';x.fillRect(6,9,29,3);x.fillStyle='#E86A6A';x.fillRect(14,10,13,1);
  lifted={c,t:0};
}
export function drawLifted(dt){
  if(!lifted)return;lifted.t+=dt;const q=lifted.t/.45;
  if(q>=1){lifted=null;return}
  cg.globalAlpha=1-q;cg.drawImage(lifted.c,0,Math.round(-q*q*34));cg.globalAlpha=1;
}

/* ---------- counter sign ---------- */
export let signShown=false,signTarget=false,signFlip=0;
export const GLYPH={'0':['111','101','101','101','111'],'1':['01','11','01','01','01'],'2':['111','001','111','100','111'],'3':['111','001','111','001','111'],'4':['101','101','111','001','001'],'5':['111','100','111','001','111'],'6':['111','100','111','101','111'],'7':['111','001','001','001','001'],'8':['111','101','111','101','111'],'9':['111','101','111','001','111'],'#':['01010','11111','01010','11111','01010'],O:['111','101','101','101','111'],P:['111','101','111','100','100'],E:['111','100','110','100','111'],N:['1001','1101','1011','1001','1001'],
  C:['111','100','100','100','111'],L:['100','100','100','100','111'],S:['111','100','111','001','111'],D:['110','101','101','101','110']};
export function pixText(c,str,x,y,col){for(const ch of str){const gl=GLYPH[ch];gl.forEach((r,j)=>[...r].forEach((b,i)=>{if(b==='1')px(c,x+i,y+j,1,1,col)}));x+=gl[0].length+1}}
export function textW(str){return [...str].reduce((a,ch)=>a+GLYPH[ch][0].length+1,-1)}
export function drawSign(t,dt){
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
export function resetFx(){parts=[];lifted=null;signShown=false;signTarget=false;signFlip=0}
