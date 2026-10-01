import {EVENTS} from '../data';
import {audio,meow,purr} from './audio';
import {H,OUT,W,cg,g,has,pick,placeAtLeast,save,tea} from './core';
import {ev,season} from './customers';
import {drawShopDecor,ownsDecor} from './decor';
import {blit,drawPerson,inEll,px} from './draw';
import {coins} from './fx';
import {METAL,METAL_HI} from './icons';
import {checkQuests} from './quests';
import {hint} from './serve';
import {S,cup} from './state';
import {drawVisitor} from './visitors';

/* ---------- the shop's cats: Bơ sleeps on the counter, Mochi peeks from the awning, Mun strolls by ---------- */
/** a cat that lives in the shop; `meowT` counts down to its next idle meow */
export interface ShopCat{id:string;name:string;x:number;y:number;w:number;h:number;petT:number;meowT?:number;walkIn?:number;[k:string]:any}
export const shopCats:ShopCat[]=[
  {id:'bo',name:'Bơ',x:98,y:52,w:16,h:9,petT:0},
  {id:'mochi',name:'Mochi',x:124,y:5,w:12,h:10,petT:0},
  {id:'mun',name:'Mun',x:-30,y:44,w:14,h:10,petT:0,walkIn:6},
];
export function catById(id){return shopCats.find(c=>c.id===id)}
export function heart(x,y,col='#F2708F'){px(g,x,y,1,1,col);px(g,x+2,y,1,1,col);px(g,x,y+1,3,1,col);px(g,x+1,y+2,1,1,col)}
export function drawShopCats(t){
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
  const m=catById('mochi');
  if(catHere(m)){const mx=m.x,my=m.y,sw=Math.round(Math.sin(t*2.2)*2);
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
  }
  // little 'meo' speech bubbles when a cat talks on its own
  shopCats.forEach(c=>{if(c.meowT>0&&catHere(c)&&!(c.id==='mun'&&(c.x<-10||c.x>W))){const bx=Math.round(c.x+c.w/2)+2,by=c.y-9-Math.round((1.4-c.meowT)*2);px(g,bx,by,9,6,'#8A6A78');px(g,bx+1,by+1,7,4,'#FFFFFF');px(g,bx+1,by+6,1,1,'#8A6A78');
    px(g,bx+2,by+2,1,2,'#E0557A');px(g,bx+3,by+2,1,1,'#E0557A');px(g,bx+4,by+2,1,2,'#E0557A');px(g,bx+6,by+2,1,2,'#E0557A');px(g,bx+6,by+2,1,1,'#E0557A')}});
  // hearts for any cat being petted
  shopCats.forEach(c=>{if(c.petT>0){const q=1-c.petT/1.6;g.globalAlpha=Math.min(1,c.petT*1.5);heart(c.x+c.w/2-1,c.y-3-q*10);heart(c.x+c.w/2+3,c.y-1-q*7,'#FF9DB3');g.globalAlpha=1}});
}
export function drawWalker(t){
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
export function updateCats(dt){
  shopCats.forEach(c=>{if(c.petT>0)c.petT=Math.max(0,c.petT-dt);if(c.meowT>0)c.meowT=Math.max(0,c.meowT-dt)});
  ambientCats(dt);
  const m=catById('mun');
  if(m.petT>0)return;
  if(m.x<-20||m.x>W+20){m.walkIn-=dt;if(m.walkIn<=0){m.x=-18;m.walkIn=14+Math.random()*16;if(S&&S.phase==='open')meow(.95,.03)}else return}
  m.x+=9*dt;
}
export let ambT=10+Math.random()*8;
export function ambientCats(dt){
  ambT-=dt;if(ambT>0)return;ambT=13+Math.random()*16;
  const pool=shopCats.filter(c=>catHere(c)&&(c.id!=='mun'||(c.x>0&&c.x<W)));const c=pick(pool);
  c.meowT=1.4;meow(c.id==='bo'?.9:c.id==='mochi'?1.25:1.05,.035);
}
export function petCat(c){
  audio();c.petT=1.6;
  if(c.id==='bo'){purr(1.8);meow(.9,.05,.9)}else if(c.id==='mochi'){meow(1.25);purr(1)}else{meow(1.05);meow(1.15,.05,.55)}
  if(S&&S.q){S.q.pet=(S.q.pet||0)+1;if(S.phase==='open'||S.phase==='prep')checkQuests()}
  if(S&&S.phase==='open')hint(`${c.name} kêu meo và dụi đầu vào tay bạn.`);
}
export function catHere(c){return c.id!=='mochi'||placeAtLeast('shop')}
export function catAt(x,y){return shopCats.find(c=>catHere(c)&&x>=c.x-2&&x<=c.x+c.w+2&&y>=c.y-3&&y<=c.y+c.h+2&&!(c.id==='mun'&&(c.x<-10||c.x>W+5)))}
export function drawDecor(t){
  // moon-festival lanterns step aside for the wooden sign when the shop has one
  if(season==='trungthu'&&placeAtLeast('kiosk'))(ownsDecor('sign')?[[24,9],[52,10],[110,9],[146,10]]:[[22,9],[62,10],[98,9],[146,10]]).forEach(([x,y],i)=>{
    const sw=Math.round(Math.sin(t*1.5+i));g.globalAlpha=.25+.1*Math.sin(t*3+i);blit(g,x-4+sw,y-3,10,12,(a,b)=>inEll(a,b,5,6,5,6),'#FFB35A',null);g.globalAlpha=1;
    px(g,x+sw,y-2,1,2,'#8A6A78');blit(g,x-3+sw,y,8,8,(a,b)=>inEll(a,b,4,4,3.6,3.8),(a,b)=>b<1.5||b>6.5?'#F2C94C':'#E0485F',OUT);px(g,x-1+sw,y+3,4,1,'#FF8A7A');px(g,x+sw,y+8,1,2,'#F2C94C')});
  if(season==='tet'){for(let i=0;i<9;i++)px(g,4+i*2,20-i,1,1,'#7A4A2A');[[6,17],[10,14],[14,12],[8,19],[16,10]].forEach(([x,y])=>{px(g,x,y,2,2,'#F9D24A');px(g,x,y,1,1,'#FFF3B0')})}
  if(ev()===EVENTS.holiday){const cols=['#E0485F','#F2C94C','#3F83C4','#7ED6B8'];for(let x=2;x<W;x+=6){const y=20+Math.round(2*Math.sin(Math.PI*((x%53)/53))),col=cols[(x/6|0)%4];px(g,x,y,4,1,col);px(g,x+1,y+1,2,1,col);px(g,x+1,y+2,1,1,col)}}
  if(ev()===EVENTS.hot){blit(g,8,10,14,14,(x,y)=>inEll(x,y,7,7,5,5),'#FFD36B','#F2A541');for(let i=0;i<8;i++){const a=i/8*Math.PI*2+t*.3;px(g,15+Math.cos(a)*9,17+Math.sin(a)*9,1,1,'#F2A541')}}
}
export function drawWeather(t){
  if(ev()!==EVENTS.rain)return;
  g.globalAlpha=.14;px(g,0,0,W,60,'#5A6E9A');g.globalAlpha=.7;
  for(let i=0;i<46;i++){const x=Math.round((i*37+t*38)%(W+10))-5,y=Math.round((i*23+t*150)%(H+6))-6;px(g,x,y,1,3,'#A8C4F0')}
  g.globalAlpha=1;
}
export function drawScene(t){
  // sky
  ([['#FFE6C8',0,14],['#FFD8BE',14,24],['#FFC9BB',24,31],['#FBB9C0',31,37],['#F2AEC7',37,42],['#E6A6CC',42,46]] as [string,number,number][]).forEach(([c,a,b])=>px(g,0,a,W,b-a,c));
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
  drawVisitor(t);
  if(placeAtLeast('shop')){
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
  }else if(save.place==='kiosk')drawKioskBack(t);
  // customers
  S.customers.forEach(c=>drawPerson(c,t));
  if(save.place==='cart')drawCart(t);
  else{
  // counter + props
  px(g,0,60,W,20,'#CF915F');px(g,0,60,W,2,'#EDB888');px(g,0,62,W,1,'#A76C44');
  for(let x=10;x<W;x+=20)px(g,x,63,1,14,'#B97A4E');
  for(let x=4;x<W;x+=20){px(g,x,68,2,1,'#E8A87A');px(g,x-1,69,1,1,'#E8A87A');px(g,x+2,69,1,1,'#E8A87A')} // little paw prints
  px(g,0,77,W,3,'#A76C44');
  }
  // tip jar
  const coins=Math.min(7,Math.floor(S.tips/8));
  px(g,3,49,11,11,OUT);px(g,4,50,9,10,'#BFDCEA');px(g,4,49,9,1,'#EAF6FB');
  for(let i=0;i<coins;i++)px(g,5+(i%3)*3,58-Math.floor(i/3)*2,2,1,'#F2C94C');
  px(g,5,51,1,6,'#FFFFFF');
  // menu board (on the cart it stands in the street on little legs)
  if(save.place==='cart'){px(g,143,58,1,4,'#6E4630');px(g,154,58,1,4,'#6E4630')}
  px(g,141,44,16,16,OUT);px(g,142,45,14,14,'#23302A');
  for(let r=0;r<4;r++){px(g,144,47+r*3,6,1,'#CFE6D8');px(g,152,47+r*3,2,1,'#F2A541')}
  if(placeAtLeast('shop')){
    // awning
    for(let x=0;x<W;x+=8){const c=(x/8)%2?'#FFF4EA':'#F58DA6';px(g,x,0,8,5,c);px(g,x+1,5,6,1,c);px(g,x+2,6,4,1,c);px(g,x+2,7,4,1,'#C85C7A')}
    px(g,0,0,W,1,'#D96A86');
    drawShopDecor(t);
  }else if(save.place==='kiosk')drawKioskRoof(t);
  else drawUmbrella(t);
  drawDecor(t);
  drawShopCats(t);
  drawWeather(t);
  if(S.phase==='paused'){g.globalAlpha=.45;px(g,0,0,W,H,'#FFF6EF');g.globalAlpha=1}
}
export function cupInside(x,y){if(y<12||y>52)return false;return Math.abs(x-20)<=13-(y-12)*(3/40)}
export function drawCup(){
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
  if(S&&S.sealT>0){const q=1-S.sealT/.25,y=Math.round(q*7);px(cg,18,0,4,y+2,'#8C86A4');px(cg,4,y+2,33,3,METAL);px(cg,4,y+2,33,1,METAL_HI)}
  if(cup.sealed){px(cg,6,9,29,3,'#FFF1F5');px(cg,6,11,29,1,'#F2B8C8');px(cg,19,9,3,2,'#F2708F');px(cg,18,8,1,1,'#F2708F');px(cg,20,8,1,1,'#F2708F');px(cg,22,8,1,1,'#F2708F')}
  // cat ears on the lid and a little cat face once there's tea inside
  const ear=(cx,dir)=>{for(let i=0;i<5;i++){const w=Math.max(1,5-i);px(cg,cx-(dir<0?0:w-1),9-i,w,1,'#B9A2B8');if(w>2)px(cg,cx-(dir<0?-1:w-2),9-i,w-2,1,i<3?'#FBD3DE':'#FFF6F8')}};
  ear(8,-1);ear(32,1);
  if(cup.tea&&cup.level>.6){px(cg,15,21,1,2,'#3B2A2D');px(cg,23,21,1,2,'#3B2A2D');px(cg,18,24,1,1,'#3B2A2D');px(cg,19,25,1,1,'#3B2A2D');px(cg,20,24,1,1,'#3B2A2D');
    cg.globalAlpha=.55;px(cg,13,24,2,1,'#FF8FAB');px(cg,24,24,2,1,'#FF8FAB');cg.globalAlpha=1}
  cg.globalAlpha=.3;px(cg,9,14,2,34,'#FFFFFF');cg.globalAlpha=1;
}

/* ---------- the pushcart and the kiosk ---------- */
function drawCart(t){
  // sidewalk under and around the cart
  px(g,0,62,W,18,'#E6C3BE');for(let i=0;i<10;i++)px(g,(i*31+12)%W,65+(i%3)*4,3,1,'#D9AFAB');
  // cart body: a pink box with cream stripes on two wheels, a handle on the right
  px(g,4,58,116,3,'#EDB888');px(g,4,58,116,1,'#F7D3A8');px(g,4,61,116,1,'#A76C44');
  if(has('paint')){ // repainted: brighter pink with white paw prints
    px(g,6,62,112,12,'#FF9DB5');
    for(let x=14;x<114;x+=16){px(g,x,66,3,3,'#FFF4EA');px(g,x-1,64,1,1,'#FFF4EA');px(g,x+1,63,1,1,'#FFF4EA');px(g,x+3,64,1,1,'#FFF4EA')}
  }else{px(g,6,62,112,12,'#F58DA6');for(let x=10;x<118;x+=12)px(g,x,62,5,12,'#FFF4EA')}
  px(g,6,62,112,1,'#D96A86');px(g,6,73,112,1,'#C85C7A');
  px(g,118,55,1,7,'#8A6A78');px(g,118,55,9,1,'#8A6A78');px(g,126,55,2,2,'#5A4A55');
  if(has('bell')){const sw=Math.round(Math.sin(t*3)*1);px(g,122,56,1,2,'#8A6A78');blit(g,119+sw,57,7,6,(x,y)=>y<5&&Math.abs(x-3)<=1+y*.5,'#F2C94C',OUT);px(g,122+sw,62,1,1,'#C9A15A')}
  [[22,75],[102,75]].forEach(([cx,cy])=>{blit(g,cx-5,cy-5,11,11,(x,y)=>inEll(x,y,5,5,5,5),(x,y)=>inEll(x,y,5,5,2,2)?'#E8DCCF':'#5A4A55',OUT);
    const a=t*.6;px(g,cx+Math.round(Math.cos(a)*3),cy+Math.round(Math.sin(a)*3),1,1,'#E8DCCF');px(g,cx,cy,1,1,OUT)});
  px(g,0,79,W,1,'#D9B4B2');
}
function drawUmbrella(t){
  // a pink beach umbrella over the cart, its scallops bobbing a little in the breeze
  px(g,61,14,2,44,'#8A6A78');
  const sway=Math.round(Math.sin(t*.9)*.6);
  blit(g,16+sway,4,92,14,(x,y)=>inEll(x,y,46,13,46,10)&&y<13,(x,y)=>Math.floor((x-1)/11.5)%2?'#FFF4EA':'#F58DA6',OUT);
  for(let i=0;i<8;i++){const x=18+sway+i*11.5;px(g,Math.round(x),16,10,1,i%2?'#FFF4EA':'#F58DA6');px(g,Math.round(x)+2,17,6,1,i%2?'#FFF4EA':'#F58DA6');px(g,Math.round(x)+3,18,4,1,'#C85C7A')}
  px(g,60+sway,2,4,2,'#F2C94C');
  if(has('parasol')){ // second layer on top and a row of swinging tassels
    blit(g,40+sway,1,44,7,(x,y)=>inEll(x,y,22,7,22,6)&&y<7,(x,y)=>Math.floor(x/6)%2?'#F58DA6':'#FFF4EA',OUT);
    for(let x=20;x<106;x+=4){const s=Math.round(Math.sin(t*2+x*.3)*.6);px(g,x+sway+s,19,1,2,'#F2C94C')}
  }
}
function drawKioskBack(t){
  // two posts holding the roof, a strip of warm bulbs under it
  px(g,4,12,3,48,'#8A5A3C');px(g,153,12,3,48,'#8A5A3C');px(g,5,12,1,48,'#A8724E');px(g,154,12,1,48,'#A8724E');
  for(let x=10;x<W-8;x+=10){const on=Math.floor(t*1.5+x)%6!==0;if(on){g.globalAlpha=.2;px(g,x-1,13,4,4,'#FFD36B');g.globalAlpha=1}px(g,x,13,2,2,on?'#FFD36B':'#D8C4D6')}
}
function drawKioskRoof(t){
  // a mint tin roof with corrugation and a scalloped trim
  px(g,0,0,W,11,'#7ED6B8');for(let x=0;x<W;x+=4)px(g,x,0,1,11,'#5FB89B');px(g,0,0,W,1,'#4E9F86');
  for(let x=0;x<W;x+=6){px(g,x,11,6,1,'#FFF4EA');px(g,x+1,12,4,1,'#FFF4EA');px(g,x+2,13,2,1,'#E0C8B8')}
  if(has('garland')){ // paper-flower garland along the roof trim
    for(let x=0;x<W;x++){const y=15+Math.round(1.5*Math.sin(Math.PI*x/40));px(g,x,y,1,1,'#7FB86A');
      if(x%10===5){const col=['#F58DA6','#F2C94C','#B79BD6','#FFFFFF'][(x/10|0)%4];px(g,x-1,y+1,3,1,col);px(g,x,y,1,3,col);px(g,x,y+1,1,1,'#F2A541')}}
  }
  if(has('fan')){ // a ceiling fan, blades turning
    px(g,118,11,1,4,'#6E5A66');const a=t*7;
    for(let k=0;k<3;k++){const ang=a+k*Math.PI*2/3;for(let r=2;r<=8;r++)px(g,118+Math.round(Math.cos(ang)*r),16+Math.round(Math.sin(ang)*r*.35),2,1,'#9F97B8')}
    px(g,116,15,5,3,'#7ED6B8');px(g,117,16,3,1,'#FFF4EA');
  }
  if(has('radio')){ // a little cassette radio on the counter, notes drifting up
    px(g,17,52,12,8,OUT);px(g,18,53,10,6,'#E86A6A');px(g,19,55,3,3,'#3B2A2D');px(g,24,55,3,3,'#3B2A2D');px(g,20,53,6,1,'#FFF4EA');px(g,26,49,1,3,'#8A6A78');
    for(let i=0;i<2;i++){const ph=(t*.6+i*.5)%1;g.globalAlpha=1-ph;px(g,21+i*6,47-ph*12,1,3,'#8A6A78');px(g,22+i*6,47-ph*12,2,1,'#8A6A78');px(g,20+i*6,49-ph*12,2,2,'#8A6A78');g.globalAlpha=1}
  }
  // a little hanging cat-face sign
  px(g,79,13,1,3,'#8A6A78');px(g,74,16,11,7,OUT);px(g,75,17,9,5,'#F2A541');px(g,75,15,1,1,'#F2A541');px(g,83,15,1,1,'#F2A541');
  px(g,77,18,1,1,OUT);px(g,81,18,1,1,OUT);px(g,79,19,1,1,'#E86A6A');
}
