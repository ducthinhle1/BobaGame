// Shared shapes for the game's data and saved progress.

export type Quality = 'perfect' | 'good' | 'weak' | 'bitter' | 'clumpy';
export type TypeId = 'regular' | 'rush' | 'picky' | 'cat' | 'reviewer' | 'online';

/** How a tea is brewed before opening: always the same mini game for the same tea. */
export type BrewStyle = 'steep' | 'heat' | 'whisk';
export interface Tea { id: string; name: string; short: string; vi: string; color: string; price: number; brew: BrewStyle; day?: number }
export interface Topping { id: string; name: string; short: string; vi: string; price: number; day?: number }
export interface QualityInfo { label: string; mul: number; cls: string }
export interface CustomerType { label: string; patience: number; tip: number; pay: number; strict: boolean }
export interface SupplyItem { id: string; kind: 'tea' | 'top' | 'gear'; name: string; desc: string; price: number; tub?: boolean; gear?: boolean; pack?: number }
export interface ShopItem { id: string; kind?: 'tea' | 'top'; name: string; lv: number; price: number; desc: string }
export interface StaffInfo extends ShopItem { wage: number }
export type PlaceId = 'cart' | 'kiosk' | 'shop';
/** Where you sell: you start with a pushcart and move up as you earn. */
export interface PlaceInfo { id: PlaceId; name: string; lv: number; price: number; slots: number; goal: number; desc: string; perks: string[] }
/** Shop decoration: drawn in the street scene; each adds coziness points (tips and patience). */
export interface DecorItem { id: string; name: string; lv: number; price: number; cozy: number; desc: string }
export interface GameEvent { name: string; desc: string; spawn: number; pat: number; tip: number; online: number; price: number; w: number; iceHeavy?: boolean }
export interface Season { name: string; desc: string; tip: number }

/** What a customer asks for. `ice`: 0 none, 1 little, 2 regular. */
export interface Order { tea: string; sugar: number; ice: number; tops: string[]; qty?: number }

export interface Look { skin?: string; hair?: string; style?: string; cap?: string; shirt: string; fur?: string; glasses?: boolean; shades?: boolean }
export interface Regular { id: string; name: string; fav: Order; look: Look; bio: string; gift: string }

/** A drink on the counter. `null` means that step hasn't been done yet. */
export interface Cup { tea: string | null; sugar: number | null; ice: number | null; tops: string[]; level: number; teaQ: Quality | null; pearlQ: Quality | null; sealed: boolean }

/** A tea or pearl batch in stock; the oldest batch is used first. */
export interface Batch { n: number; q: Quality }

export interface Friendship { met: boolean; hearts: number; gift: boolean; story?: boolean }
export interface StaffState { hired: boolean; on: boolean }
/** one closed day, for the revenue chart */
export interface DayRecord { d: number; earned: number; tips: number; quest: number; wage: number; net: number; served: number; perfect: number }

/** Everything kept between sessions (localStorage key `tcs-save3`). */
export interface Save {
  day: number; wallet: number; xp: number;
  owned: string[]; upgrades: string[];
  pantry: Record<string, number>;
  staff: Record<string, StaffState>;
  history: DayRecord[];
  friends?: Record<string, Friendship>;
  event?: string; eventDay?: number; lastEvent?: string;
  decor?: string[];
  place?: PlaceId;
}

export type CustomerState = 'walk' | 'wait' | 'leave';

/** Someone at the counter (or walking to / away from it). Patience `pat` counts down in seconds. */
export interface Customer {
  friend: string | null; no: number; id: number; slot: number; type: TypeId; look: Look; order: Order;
  x: number; state: CustomerState; pat: number; maxPat: number; result: 'love' | 'ok' | 'angry' | null;
  bubbleT: number; bagged: number; perfectCups: number; qmSum: number;
  /** seconds left while the bag is being closed */
  bagT?: number;
  carry?: { color?: string; pearls?: boolean; foam?: boolean; bag?: boolean };
}
