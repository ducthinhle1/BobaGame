import {OUT,g} from './core';
import {pixText,textW} from './fx';
import {S} from './state';

/* ---------- pixel drawing ---------- */
export function px(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(Math.round(x),Math.round(y),w,h)}
export function inEll(x,y,cx,cy,rx,ry){return ((x-cx)/rx)**2+((y-cy)/ry)**2<=1}
export function blit(c,ox,oy,w,h,inside,fill,outline){
  for(let y=-1;y<=h;y++)for(let x=-1;x<=w;x++){
    if(inside(x+.5,y+.5))px(c,ox+x,oy+y,1,1,typeof fill==='function'?fill(x,y):fill);
    else if(outline&&(inside(x+1.5,y+.5)||inside(x-.5,y+.5)||inside(x+.5,y+1.5)||inside(x+.5,y-.5)))px(c,ox+x,oy+y,1,1,outline);
  }
}
export const ICONS={
  love:['.x.x.','xxxxx','xxxxx','.xxx.','..x..'],
  ok:['....x','...x.','x.x..','.x...','.....'],
  angry:['x...x','.x.x.','..x..','.x.x.','x...x'],
  wait:['..x..','..x..','..x..','.....','..x..'],
};
export const ICOL={love:'#E86A6A',ok:'#2E7A5B',angry:'#C94A4A',wait:'#D08A2E'};
export function bubble(cx,y,kind){
  const x=Math.round(cx)-5;
  px(g,x,y,11,9,OUT);px(g,x+1,y+1,9,7,'#F4EBD6');px(g,x+4,y+9,2,1,OUT);px(g,x+4,y+8,2,1,'#F4EBD6');
  ICONS[kind].forEach((r,j)=>[...r].forEach((ch,i)=>{if(ch==='x')px(g,x+3+i,y+2+j,1,1,ICOL[kind])}));
}
export const MOODS={happy:'Vui vẻ',okay:'Hơi sốt ruột',upset:'Bực mình',furious:'Sắp bỏ đi'};
export const faceCache={};
export function faceURL(m){
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
export function drawPerson(c,t){
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
