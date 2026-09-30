import {REGULARS} from '../data';
import {OUT,tea} from './core';
import {blit,inEll,px} from './draw';

/* ---------- controls ---------- */
/* ---------- pixel icons for the station ---------- */
export const METAL='#B8B2CC',METAL_HI='#E6E2F0';
export const TOP_PAT={
  pearl:(x,y)=>((x+(Math.floor(y/2)%2))%3===0&&y%2===0)?'#8A6450':((x+y)%3===2?'#22120A':'#3A2418'),
  grass:(x,y)=>(x%4===0||y%4===0)?'#4A423A':'#2B2622',
  pudding:(x,y)=>y<7.5?'#C9822F':(x%5===0&&y%3===0?'#FBE39A':'#F2C94C'),
  foam:(x,y)=>((x+y)%5===0)?'#FFFDF5':'#F3E6C4',
  lychee:(x,y)=>((x%4===1&&y%3===0)||(x%4===2&&y%3===1))?'#EC8AA6':'#F9C3D2',
};
export function drawIcon(c,kind,val){
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
        ([[2,'#F2A541'],[6,'#7ED6B8'],[10,'#E86A6A'],[14,'#F4EBD6']] as [number,string][]).forEach(([x,col])=>{const y=4+Math.round(3*Math.sin(Math.PI*x/15));px(c,x-1,y,3,3,col);px(c,x-1,y+3,3,1,OUT)})},
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
export const iconCache={};
export function iconURL(kind,val){
  const key=kind+':'+val;if(iconCache[key])return iconCache[key];
  const cv=document.createElement('canvas');cv.width=16;cv.height=16;
  drawIcon(cv.getContext('2d'),kind,val);
  return iconCache[key]=cv.toDataURL();
}
