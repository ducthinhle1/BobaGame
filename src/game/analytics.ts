import {settings} from './settings';

const WEBSITE_ID = '2b652fbe-0103-49cc-80be-20aa63f32c49';
const SCRIPT = 'https://cloud.umami.is/script.js';

/** Only the public Netlify site reports; local dev, previews and the Claude artifact never do. */
function isPublishedSite(): boolean {
  return location.protocol === 'https:' && location.hostname.endsWith('.netlify.app');
}

type Umami = {track: (name: string, data?: Record<string, string | number | boolean>) => void};
declare global { interface Window { umami?: Umami } }

let loaded = false;
const queue: [string, Record<string, string | number | boolean> | undefined][] = [];

export function analyticsEnabled(): boolean {
  return settings.analytics !== false && isPublishedSite();
}

/** Loads the tracker once (it also counts the visit and the device/browser/country, all anonymous). */
export function startAnalytics(): void {
  if (loaded || !analyticsEnabled()) return;
  loaded = true;
  const s = document.createElement('script');
  s.defer = true;
  s.src = SCRIPT;
  s.dataset.websiteId = WEBSITE_ID;
  s.onload = () => { while (queue.length) { const [n, d] = queue.shift()!; window.umami?.track(n, d); } };
  document.head.appendChild(s);
}

/** Records a game event, e.g. track('day_end', {day: 3, served: 18}). Does nothing when switched off. */
export function track(name: string, data?: Record<string, string | number | boolean>): void {
  if (!analyticsEnabled()) return;
  startAnalytics();
  if (window.umami) window.umami.track(name, data); else queue.push([name, data]);
}

// ---- play time: counts only while the game is on screen; sent each time the player leaves the tab/app
let activeSince = document.visibilityState === 'visible' ? performance.now() : 0;
let playedMs = 0;
function flushPlayTime(): void {
  if (activeSince) { playedMs += performance.now() - activeSince; activeSince = 0; }
  const secs = Math.round(playedMs / 1000);
  if (secs >= 5) track('play_time', {seconds: secs, minutes: Math.round(secs / 60)});
  playedMs = 0;
}
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') flushPlayTime();
  else activeSince = performance.now();
});
