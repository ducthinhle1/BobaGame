import {startAnalytics} from './analytics';
import {audio,music,musicLevel,muted,setMuted,sfx,stopMusic} from './audio';
import {catAt,petCat} from './cats';
import {$,H,NEW_SAVE,SLOTS,W,persist,save,scene,setSave} from './core';
import {openMarket} from './day';
import {shake} from './fx';
import {renderTickets,serveTarget} from './orders';
import {mini,miniAct,whisk} from './prep';
import {questRows} from './quests';
import {hint,serve} from './serve';
import {musicBase,saveSettings,settings} from './settings';
import {S} from './state';
import {dump,pourAgain,sealCup} from './station';

/* ---------- inputs ---------- */
scene.addEventListener('click',e=>{
  const r=scene.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=H-(r.bottom-e.clientY)/r.width*W;
  const c=catAt(x,y);if(c){petCat(c);return}
  SLOTS.forEach((sx,i)=>{if(Math.abs(x-sx)<16){audio();if(document.body.classList.contains('bar-new')){const cu=S.slots[i];if(cu&&cu.state==='wait'){S.focus=cu.id;S.focusManual=true;sfx.click();renderTickets()}}else serve(i)}});
});
export let menuPaused=false;
export function openMenu(){
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
export function closeMenu(){
  $('#pausemenu').hidden=true;
  if(menuPaused&&S.phase==='paused')setPaused(false);
}
export function bkMsg(t){$('#bk-msg').textContent=t}
export let bkArmed=false;
$('#bk-make').addEventListener('click',()=>{
  const code='MTC1.'+btoa(unescape(encodeURIComponent(JSON.stringify(save))));
  $<HTMLInputElement>('#bk-code').value=code;$('#bk-copy').hidden=false;bkMsg('Đã tạo mã. Hãy cất mã này ở nơi an toàn.');
});
$('#bk-copy').addEventListener('click',()=>{
  const t=$<HTMLTextAreaElement>('#bk-code');
  navigator.clipboard&&navigator.clipboard.writeText(t.value).then(()=>bkMsg('Đã sao chép mã.'),()=>{t.select();bkMsg('Hãy nhấn giữ và chọn Sao chép.')});
  if(!navigator.clipboard){t.select();bkMsg('Hãy nhấn giữ và chọn Sao chép.')}
});
$('#bk-load').addEventListener('click',()=>{
  const raw=$<HTMLInputElement>('#bk-code').value.trim();let data=null;
  try{if(!raw.startsWith('MTC1.'))throw 0;data=JSON.parse(decodeURIComponent(escape(atob(raw.slice(5)))));if(!data||!Array.isArray(data.owned)||!data.pantry)throw 0}catch(e){bkMsg('Mã không hợp lệ. Hãy kiểm tra lại.');sfx.nope();bkArmed=false;return}
  if(!bkArmed){bkArmed=true;$('#bk-load').textContent='Bấm lần nữa để thay dữ liệu hiện tại';bkMsg(`Mã hợp lệ: ngày ${data.day}, tiết kiệm ${data.wallet}k.`);return}
  bkArmed=false;$('#bk-load').textContent='Khôi phục từ mã';
  setSave(Object.assign(NEW_SAVE(),data));if(save.pantry.cup===undefined)Object.assign(save.pantry,{cup:40,straw:40,film:40,bag:10});
  persist();bkMsg('Đã khôi phục!');sfx.win();
  setTimeout(()=>{$('#pausemenu').hidden=true;openMarket()},700);
});
export function syncSettingsUI(){
  $<HTMLInputElement>('#set-music').value=String(settings.music);$('#out-music').textContent=settings.music+'%';
  $<HTMLInputElement>('#set-sfx').value=String(settings.sfx);$('#out-sfx').textContent=settings.sfx+'%';
  $<HTMLInputElement>('#set-shake').checked=settings.shake;$<HTMLInputElement>('#set-vi').checked=settings.vi;
  document.body.classList.toggle('no-vi',!settings.vi);
  $<HTMLInputElement>('#set-classic').checked=settings.layout==='classic';
  $<HTMLInputElement>('#set-analytics').checked=settings.analytics!==false;
  document.body.classList.toggle('bar-new',settings.layout!=='classic');
}
$('#set-classic').addEventListener('change',e=>{settings.layout=(e.target as HTMLInputElement).checked?'classic':'new';saveSettings();syncSettingsUI();if(S)renderTickets()});
$('#set-music').addEventListener('input',e=>{settings.music=+(e.target as HTMLInputElement).value;$('#out-music').textContent=settings.music+'%';musicLevel(Math.max(.0001,musicBase()));saveSettings()});
$('#set-sfx').addEventListener('input',e=>{settings.sfx=+(e.target as HTMLInputElement).value;$('#out-sfx').textContent=settings.sfx+'%';saveSettings()});
$('#set-sfx').addEventListener('change',()=>{audio();sfx.ok()});
$('#set-shake').addEventListener('change',e=>{settings.shake=(e.target as HTMLInputElement).checked;saveSettings();if(settings.shake)shake()});
$('#set-analytics').addEventListener('change',e=>{settings.analytics=(e.target as HTMLInputElement).checked;saveSettings();syncSettingsUI();startAnalytics()});
$('#set-vi').addEventListener('change',e=>{settings.vi=(e.target as HTMLInputElement).checked;saveSettings();syncSettingsUI()});
$('#pm-resume').addEventListener('click',closeMenu);
$('#settings').addEventListener('click',()=>{audio();$('#pausemenu').hidden?openMenu():closeMenu()});
syncSettingsUI();
export function setPaused(on){
  S.phase=on?'paused':'open';
  $('#pause').textContent=on?'Tiếp tục':'Tạm dừng';
  document.body.classList.toggle('is-paused',on);
  musicLevel(Math.max(.0001,musicBase()*(on?.6:1)));
  $('#pausedlab').hidden=!on;
  document.querySelectorAll<HTMLElement>('.station button,.tickets button').forEach(b=>b.tabIndex=on?-1:0);
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
export function syncMusicBtn(){const b=$('#music');b.classList.toggle('off',!music.on);b.setAttribute('aria-pressed',music.on?'true':'false');b.setAttribute('aria-label',music.on?'Nhạc: bật':'Nhạc: tắt')}
syncMusicBtn();
$('#mute').addEventListener('click',()=>{setMuted(!muted);$('#mute').classList.toggle('off',muted);$('#mute').setAttribute('aria-label',muted?'Hiệu ứng âm thanh: tắt':'Hiệu ứng âm thanh: bật');$('#mute').setAttribute('aria-pressed',muted?'true':'false')});
document.addEventListener('keyup',e=>{if(e.key===' '&&mini&&mini.kind==='heat')mini.holding=false});
document.addEventListener('keydown',e=>{
  if((e.target as HTMLElement).closest&&(e.target as HTMLElement).closest<HTMLElement>('input,textarea'))return;
  if(!$('#pausemenu').hidden){if(e.key==='Escape'||e.key==='p'||e.key==='P'){e.preventDefault();closeMenu()}return}
  if((e.target as HTMLElement).closest&&(e.target as HTMLElement).closest<HTMLElement>('input,textarea'))return;
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
