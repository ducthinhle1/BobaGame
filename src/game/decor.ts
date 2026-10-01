import {DECOR} from '../data';
import {cozyBonus,cozyPoints} from '../logic/economy';
import {beep} from './audio';
import {OUT,W,g,save} from './core';
import {blit,inEll,px} from './draw';

/** coziness of what the player owns, and what it does */
export function cozy(){return cozyPoints(save.decor||[],DECOR)}
export function cozyEffect(){return cozyBonus(cozy())}
export function ownsDecor(id:string){return (save.decor||[]).includes(id)}

const LEAF='#5C8F5A',LEAF2='#86C06C',WOOD='#8A5A3C',WOOD2='#A8724E';

function plant(c,x,y,t){
  const sw=Math.round(Math.sin(t*1.2)*.7);
  [[3,0],[6,2],[1,3],[8,5],[4,4],[2,7],[7,8]].forEach(([dx,dy],i)=>{const col=i%2?LEAF2:LEAF,s=dy<5?sw:0;px(c,x+dx+s,y+dy,3,2,col);px(c,x+dx+1+s,y+dy+2,1,1,col)});
  px(c,x,y+9,1,4,LEAF);px(c,x-1,y+12,2,1,LEAF2);px(c,x+10,y+9,1,3,LEAF2);
  px(c,x+1,y+10,9,1,OUT);px(c,x+1,y+11,9,1,'#E08A5E');px(c,x+2,y+12,7,4,'#C96F4A');px(c,x+4,y+13,1,1,'#F4D3A0');px(c,x+6,y+13,1,1,'#F4D3A0');px(c,x+5,y+14,1,1,'#F4D3A0');
}
function cookies(c,x,y){
  px(c,x+3,y-1,3,1,'#F58DA6');px(c,x,y,9,2,'#F58DA6');px(c,x,y+1,9,1,'#D96A86');
  px(c,x,y+2,9,8,OUT);px(c,x+1,y+2,7,7,'#EAF6FB');
  const fish=(fx,fy,col)=>{px(c,fx,fy,3,1,col);px(c,fx+3,fy-1,1,1,col);px(c,fx+3,fy+1,1,1,col)};
  fish(x+2,y+5,'#E8A35A');fish(x+3,y+7,'#D98A3E');fish(x+2,y+8,'#E8A35A');
  px(c,x+1,y+3,1,4,'#FFFFFF');
}
function flowers(c,x,y,t){
  px(c,x,y+3,26,4,WOOD);px(c,x,y+3,26,1,WOOD2);px(c,x+1,y+7,24,1,'#6E4630');
  const cols=['#F58DA6','#F2C94C','#B79BD6','#FFFFFF','#E86A6A','#7ED6B8'];
  cols.forEach((col,i)=>{const fx=x+2+i*4,sw=Math.round(Math.sin(t*1.5+i)*.5);px(c,fx+1,y+1,1,2,LEAF);px(c,fx+sw,y,3,1,col);px(c,fx+1+sw,y-1,1,3,col);px(c,fx+1+sw,y,1,1,'#F2A541')});
}
function chime(c,x,y,t){
  px(c,x+3,y,1,2,'#8A6A78');px(c,x,y+2,7,1,'#B8B2CC');
  const shells=['#FFD6E0','#CFE9F2','#FFF0C2'];
  shells.forEach((col,i)=>{const sw=Math.round(Math.sin(t*2.2+i*1.7)*.8),h=3+(i%2);px(c,x+i*3,y+3,1,h,'#8A6A78');px(c,x+i*3-(i===2?1:0)+sw,y+3+h,2,2,col)});
}
function lantern(c,x,y,t){
  px(c,x+4,y,1,2,'#8A6A78');
  g.globalAlpha=.18+.06*Math.sin(t*2.5);if(c===g)blit(c,x-3,y-1,15,15,(a,b)=>inEll(a,b,7,8,7,7),'#FFB35A',null);g.globalAlpha=1;
  px(c,x+1,y+2,1,2,'#E0485F');px(c,x+7,y+2,1,2,'#E0485F');
  blit(c,x,y+3,9,8,(a,b)=>inEll(a,b,4,4,4.4,3.8),(a,b)=>b<1||b>6?'#E0485F':'#FFD0A8',OUT);
  px(c,x+2,y+6,1,1,OUT);px(c,x+6,y+6,1,1,OUT);px(c,x+4,y+7,1,1,'#E86A6A');px(c,x+4,y+11,1,2,'#F2C94C');
}
function sign(c,x,y){
  px(c,x+4,y,1,3,'#8A6A78');px(c,x+31,y,1,3,'#8A6A78');
  px(c,x,y+3,36,9,OUT);px(c,x+1,y+4,34,7,'#E8B97E');px(c,x+1,y+4,34,1,'#F4D3A0');px(c,x+1,y+10,34,1,'#C99360');
  // cat face
  px(c,x+4,y+5,1,1,'#F2A541');px(c,x+9,y+5,1,1,'#F2A541');px(c,x+4,y+6,6,4,'#F2A541');px(c,x+5,y+7,1,1,OUT);px(c,x+8,y+7,1,1,OUT);px(c,x+6,y+8,2,1,'#E86A6A');
  // heart
  px(c,x+15,y+6,2,1,'#E0557A');px(c,x+18,y+6,2,1,'#E0557A');px(c,x+15,y+7,5,1,'#E0557A');px(c,x+16,y+8,3,1,'#E0557A');px(c,x+17,y+9,1,1,'#E0557A');
  // boba cup
  px(c,x+26,y+5,1,2,'#8A6A78');px(c,x+24,y+6,6,1,'#FFFFFF');px(c,x+24,y+7,6,3,'#C08A5B');px(c,x+25,y+9,1,1,OUT);px(c,x+27,y+9,1,1,OUT);
}
function bunting(c,t){
  const cols=['#F58DA6','#FFE0B5','#7ED6B8','#B79BD6','#FFF4EA'];
  for(let x=0;x<W;x++){const y=17+Math.round(2*Math.sin(Math.PI*x/W));px(c,x,y,1,1,'#B08AA0');
    if(x%8===2){const col=cols[(x>>3)%cols.length],sw=Math.round(Math.sin(t*1.3+x)*.4);px(c,x,y+1,5,1,col);px(c,x+1+sw,y+2,3,1,col);px(c,x+2+sw,y+3,1,1,col)}}
}
function board(c){
  const chalk=['#F58DA6','#7ED6B8','#F2C94C','#CFE6D8'];
  for(let r=0;r<4;r++){px(c,144,47+r*3,6,1,chalk[r]);px(c,152,47+r*3,2,1,'#F2A541')}
  px(c,150,57,1,1,'#FFF4EA');px(c,154,57,1,1,'#FFF4EA');px(c,150,58,5,1,'#FFF4EA');
}

/** draws the owned decorations into the scene (called after the awning, before the cats) */
export function drawShopDecor(t){
  const own=save.decor||[];if(!own.length)return;
  if(own.includes('bunting'))bunting(g,t);
  if(own.includes('sign'))sign(g,62,6);
  if(own.includes('chime'))chime(g,36,7,t);
  if(own.includes('lantern'))lantern(g,3,7,t);
  if(own.includes('plant'))plant(g,17,44,t);
  if(own.includes('cookies'))cookies(g,118,50);
  if(own.includes('board'))board(g);
  if(own.includes('flowers'))flowers(g,112,63,t);
}

/** 16×16 market icon for a decoration */
const iconCache:Record<string,string>={};
export function decorIconURL(id:string){
  if(iconCache[id])return iconCache[id];
  const cv=document.createElement('canvas');cv.width=16;cv.height=16;const c=cv.getContext('2d');
  if(id==='plant')plant(c,3,0,0);
  else if(id==='cookies')cookies(c,3,4);
  else if(id==='flowers'){px(c,1,9,14,4,WOOD);px(c,1,9,14,1,WOOD2);['#F58DA6','#F2C94C','#B79BD6'].forEach((col,i)=>{px(c,3+i*4,6,3,1,col);px(c,4+i*4,5,1,3,col);px(c,4+i*4,6,1,1,'#F2A541');px(c,4+i*4,8,1,1,LEAF)})}
  else if(id==='chime')chime(c,4,1,0);
  else if(id==='lantern')lantern(c,3,1,0);
  else if(id==='sign'){px(c,1,3,14,9,OUT);px(c,2,4,12,7,'#E8B97E');px(c,4,5,1,1,'#F2A541');px(c,9,5,1,1,'#F2A541');px(c,4,6,6,4,'#F2A541');px(c,5,7,1,1,OUT);px(c,8,7,1,1,OUT);px(c,6,8,2,1,'#E86A6A')}
  else if(id==='bunting'){px(c,0,3,16,1,'#B08AA0');['#F58DA6','#7ED6B8','#F2C94C'].forEach((col,i)=>{const x=1+i*5;px(c,x,4,5,2,col);px(c,x+1,6,3,2,col);px(c,x+2,8,1,2,col)})}
  else if(id==='board'){px(c,1,1,14,14,OUT);px(c,2,2,12,12,'#23302A');['#F58DA6','#7ED6B8','#F2C94C'].forEach((col,i)=>{px(c,4,4+i*3,5,1,col);px(c,10,4+i*3,2,1,'#F2A541')});px(c,9,12,4,1,'#FFF4EA');px(c,9,11,1,1,'#FFF4EA');px(c,12,11,1,1,'#FFF4EA')}
  return iconCache[id]=cv.toDataURL();
}

/** a soft, random little tinkle from the wind chime */
export function chimeTinkle(){if(!ownsDecor('chime'))return;[2093,2637,3136,2349].sort(()=>Math.random()-.5).slice(0,3).forEach((f,i)=>beep(f,.35,'sine',.012,null,i*.11))}
