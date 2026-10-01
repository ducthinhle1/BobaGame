import {DECOR} from '../data';
import {cozyBonus,cozyPoints} from '../logic/economy';
import {beep} from './audio';
import {OUT,W,g,placeAtLeast,save} from './core';
import {season} from './customers';
import {blit,inEll,px} from './draw';

/** coziness of what the player owns, and what it does */
export function cozy(){return cozyPoints(save.decor||[],DECOR)+(save.cats||[]).length}
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

function trophy(c,x,y){
  px(c,x+1,y,7,1,OUT);px(c,x+1,y+1,7,4,'#F2C94C');px(c,x+2,y+1,1,3,'#FFF3B0');px(c,x,y+1,1,3,'#E0A82E');px(c,x+8,y+1,1,3,'#E0A82E');
  px(c,x+2,y+5,5,1,'#E0A82E');px(c,x+4,y+6,1,2,'#E0A82E');px(c,x+2,y+8,5,2,'#8A5A3C');px(c,x+3,y+2,3,1,'#E86A6A');
}
function neon(c,x,y,t){
  const on=Math.floor(t*1.3)%9!==0,col=on?'#FF8FB6':'#C76A8C';
  if(on){c.globalAlpha=.25;px(c,x-2,y-2,24,13,'#FF8FB6');c.globalAlpha=1}
  // cat head outline + a boba cup
  px(c,x,y+2,1,6,col);px(c,x+9,y+2,1,6,col);px(c,x,y+8,10,1,col);px(c,x+1,y+1,1,1,col);px(c,x+2,y,1,1,col);px(c,x+7,y,1,1,col);px(c,x+8,y+1,1,1,col);px(c,x+3,y+2,4,1,col);
  px(c,x+3,y+4,1,1,col);px(c,x+6,y+4,1,1,col);px(c,x+4,y+6,2,1,col);
  px(c,x+13,y+3,6,1,col);px(c,x+13,y+3,1,6,col);px(c,x+18,y+3,1,6,col);px(c,x+13,y+8,6,1,col);px(c,x+16,y,1,3,col);
}
function cushion(c,x,y){
  px(c,x,y,22,3,'#B79BD6');px(c,x+1,y-1,20,1,'#CDB8E6');px(c,x,y+3,22,1,'#8E76B0');
  [x-1,x+22].forEach(tx=>{px(c,tx,y+1,1,1,'#F2C94C');px(c,tx,y+2,1,2,'#F2C94C')});
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
  if(own.includes('trophy'))trophy(g,31,50);
  if(own.includes('neon'))neon(g,100,21,t);
  if(own.includes('cushion'))cushion(g,95,58);
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
  else if(id==='trophy')trophy(c,3,3);
  else if(id==='neon')neon(c,-2,4,0);
  else if(id==='cushion'){cushion(c,-3,9);px(c,4,4,8,5,'#F4AA55');px(c,4,3,1,1,'#F4AA55');px(c,11,3,1,1,'#F4AA55')}
  else if(id==='board'){px(c,1,1,14,14,OUT);px(c,2,2,12,12,'#23302A');['#F58DA6','#7ED6B8','#F2C94C'].forEach((col,i)=>{px(c,4,4+i*3,5,1,col);px(c,10,4+i*3,2,1,'#F2A541')});px(c,9,12,4,1,'#FFF4EA');px(c,9,11,1,1,'#FFF4EA');px(c,12,11,1,1,'#FFF4EA')}
  return iconCache[id]=cv.toDataURL();
}

/** a soft, random little tinkle from the wind chime */
export function chimeTinkle(){if(!ownsDecor('chime'))return;[2093,2637,3136,2349].sort(()=>Math.random()-.5).slice(0,3).forEach((f,i)=>beep(f,.35,'sine',.012,null,i*.11))}

/* ---------- seasonal decorations (every place), on top of the lanterns and blossoms in drawDecor ---------- */
function pumpkin(c,x,y,big){
  const w=big?9:6,h=big?7:5;
  blit(c,x,y,w,h,(a,b)=>inEll(a,b,w/2-.5,h/2,w/2,h/2-.2),(a,b)=>Math.round(a)%3===0?'#D9682A':'#F08A3C',OUT);
  px(c,x+Math.floor(w/2)-1,y-1,2,1,'#5C8F5A');
  if(big){px(c,x+2,y+2,1,1,'#FFD36B');px(c,x+6,y+2,1,1,'#FFD36B');px(c,x+3,y+4,3,1,'#FFD36B')}
}
function bat(c,x,y,t){const f=Math.floor(t*8)%2;px(c,x,y,3,2,'#3B2A2D');px(c,x-2,y-f,2,1,'#3B2A2D');px(c,x+3,y-f,2,1,'#3B2A2D');px(c,x-3,y+1-f,1,1,'#3B2A2D');px(c,x+5,y+1-f,1,1,'#3B2A2D');px(c,x,y-1,1,1,'#3B2A2D');px(c,x+2,y-1,1,1,'#3B2A2D')}
function web(c,x,y){const col='rgba(255,255,255,.75)';for(let i=0;i<9;i++){px(c,x+i,y,1,1,col);px(c,x,y+i,1,1,col);px(c,x+i,y+i,1,1,col)}
  [3,6].forEach(r=>{for(let i=0;i<=r;i++)px(c,x+i,y+r-Math.round(i*.15)-(i===r?0:0),1,1,col)});}
function star(c,x,y,t){const sw=Math.round(Math.sin(t*1.4));px(c,x+3,y-6,1,6,'#8A6A78');
  const pts=[[3,0],[2,1],[3,1],[4,1],[0,2],[1,2],[2,2],[3,2],[4,2],[5,2],[6,2],[1,3],[2,3],[3,3],[4,3],[5,3],[2,4],[3,4],[4,4],[1,5],[2,5],[4,5],[5,5],[0,6],[6,6]];
  c.globalAlpha=.25;blit(c,x-3+sw,y-3,13,13,(a,b)=>inEll(a,b,6,6,6,6),'#FFD36B',null);c.globalAlpha=1;
  pts.forEach(([a,b])=>px(c,x+a+sw,y+b,1,1,'#E0485F'));px(c,x+3+sw,y+3,1,1,'#F2C94C');
}
function mooncake(c,x,y){blit(c,x,y,9,6,(a,b)=>inEll(a,b,4,3,4.4,2.8),(a,b)=>(a+b)%3===0?'#B9783E':'#D4995A',OUT);px(c,x+3,y+2,3,1,'#8A5A3C');px(c,x+4,y+1,1,3,'#8A5A3C')}
function watermelon(c,x,y){blit(c,x,y,9,5,(a,b)=>b>=0&&inEll(a,b,4,0,4.5,4.5),(a,b)=>inEll(a,b,4,0,3.3,3.3)?'#F2556E':'#5FB86A',OUT);px(c,x+2,y+1,1,1,OUT);px(c,x+5,y+1,1,1,OUT);px(c,x+4,y+2,1,1,OUT)}
function wreath(c,x,y){blit(c,x,y,11,11,(a,b)=>inEll(a,b,5,5,5.4,5.4)&&!inEll(a,b,5,5,2.6,2.6),(a,b)=>(a*3+b)%4===0?'#E0485F':(a+b)%2?'#3E8F5A':'#5FB86A',OUT);px(c,x+3,y+9,5,2,'#E0485F');px(c,x+5,y+10,1,2,'#E0485F')}
function envelope(c,x,y){px(c,x,y,5,7,'#E0485F');px(c,x,y,5,1,'#F2C94C');px(c,x+2,y+3,1,1,'#F2C94C')}

export function drawSeason(t){
  if(!season)return;
  if(season==='halloween'){
    web(g,1,8);web(g,W-10,8);
    for(let i=0;i<3;i++){const x=((t*(14+i*5)+i*61)%(W+30))-15,y=22+i*5+Math.round(Math.sin(t*2+i)*3);bat(g,Math.round(x),y,t+i)}
    pumpkin(g,48,53,true);pumpkin(g,132,55,false);
  }else if(season==='noel'){
    for(let i=0;i<46;i++){const x=(i*37+Math.sin(t*.8+i)*4+t*3)%W,y=(i*53+t*(9+i%5))%80;px(g,Math.round(x),Math.round(y),1,1,'#FFFFFF')}
    wreath(g,40,63);
  }else if(season==='he'){
    blit(g,140,8,14,14,(x,y)=>inEll(x,y,7,7,5,5),'#FFD36B','#F2A541');
    watermelon(g,46,55);watermelon(g,52,56);
  }else if(season==='tet'){
    // a yellow apricot-blossom (mai) branch reaching in from the left, below the roof
    const br=[[2,34],[5,32],[8,30],[11,29],[14,27],[17,26],[20,24],[23,23],[9,27],[10,25],[16,29],[19,31]];
    br.forEach(([x,y])=>px(g,x,y,2,1,'#7A4A2A'));
    [[6,30],[12,26],[15,24],[21,21],[24,22],[9,24],[18,29],[20,32],[4,31],[13,29]].forEach(([x,y],i)=>{const tw=Math.sin(t*2+i)>.6;px(g,x,y,3,2,'#F9D24A');px(g,x+1,y,1,1,tw?'#FFFFFF':'#FFF3B0');px(g,x+1,y+1,1,1,'#E8A33A')});
    envelope(g,40,64);envelope(g,47,66);
    [[132,12],[146,12]].forEach(([x,y],i)=>{const sw=Math.round(Math.sin(t*1.5+i));px(g,x+3+sw,y-4,1,4,'#8A6A78');blit(g,x+sw,y,8,8,(a,b)=>inEll(a,b,4,4,3.6,3.8),(a,b)=>b<1.5||b>6.5?'#F2C94C':'#E0485F',OUT);px(g,x+3+sw,y+8,1,2,'#F2C94C')});
  }else if(season==='trungthu'){
    if(!placeAtLeast('kiosk'))star(g,18,22,t);
    mooncake(g,48,54);
  }
}
/** little seasonal outfits for Bơ */
export function drawBoOutfit(bx,by){
  if(season==='noel'){px(g,bx,by-1,8,1,'#FFFFFF');px(g,bx+1,by-2,6,1,'#E0485F');px(g,bx+2,by-3,4,1,'#E0485F');px(g,bx+4,by-4,2,1,'#E0485F');px(g,bx+6,by-5,2,2,'#FFFFFF')}
  else if(season==='he'){px(g,bx+1,by+3,3,2,OUT);px(g,bx+5,by+3,2,2,OUT);px(g,bx+4,by+3,1,1,OUT);px(g,bx+2,by+3,1,1,'#6E6880')}
  else if(season==='halloween'){px(g,bx+1,by-2,6,1,'#3B2A2D');px(g,bx+2,by-4,4,2,'#3B2A2D');px(g,bx+3,by-6,2,2,'#3B2A2D');px(g,bx+2,by-3,4,1,'#B79BD6')}
}
