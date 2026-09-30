

/* ---------- settings ---------- */
export const settings={music:70,sfx:80,shake:true,vi:true,layout:'new'};
try{Object.assign(settings,JSON.parse(localStorage.getItem('tcs-settings'))||{})}catch(e){}
export function saveSettings(){try{localStorage.setItem('tcs-settings',JSON.stringify(settings))}catch(e){}}
export function musicBase(){return .9*settings.music/100}
