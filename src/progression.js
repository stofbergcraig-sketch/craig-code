import {BUILD_LIMIT,STARTER_SHEKKLES} from './config.js';
export const SAVE_KEY = 'mirebreak.goblin-debt.v1';
export const GOAL = 150000;
export const EXCALIBUR_KILLS = 20000;
export const TOWER_TYPES = {
  bolt:{name:'Wooden Bolt Turret',cost:5000,range:24,damage:90,cooldown:.9,color:0xc0a06b,description:'Tracking crossbow. A dependable single-target hunter.'},
  wizard:{name:'Arcane Wizard Tower',cost:12500,range:30,damage:130,cooldown:1.1,color:0x87dfca,description:'Homing arcane orbs detonate in a small radius.'},
  ballista:{name:'Cursed Ballista',cost:25000,range:38,damage:240,cooldown:1.7,color:0xb8dd74,description:'Heavy bolts pierce up to six fleeing goblins.'},
  storm:{name:'Stormcaller Tower',cost:50000,range:34,damage:150,cooldown:1.3,color:0xbea3ef,description:'Lightning arcs between up to eight goblins.'},
  spire:{name:'Obsidian Death Spire',cost:100000,range:44,damage:450,cooldown:2,color:0xf1bf79,description:'An ancient sigil detonates across a wide area.'},
  frost:{name:'Frostbound Watchtower',cost:35000,range:30,damage:25,cooldown:1.1,color:0x8cdaed,description:'Icy seekers slow fleeing goblins. Periodic frost pulses catch whole groups.'},
  soulforge:{name:'The Soulforge Obelisk',cost:75000,range:42,damage:95,cooldown:1.25,color:0xcb8bde,description:'Floating runestone. Beams bind several targets; soul pulses scour the ground.'}
};

export const SHOP_ITEMS = [
  { id: 'axe', name: 'Grudge cleaver', kind: 'weapon', cost: 80, icon: '╱', description: 'A heavy axe. Longer reach, wider cuts, a very bad attitude.', label: 'MELEE · 3' },
  { id: 'shotgun', name: 'Gravelmouth', kind: 'weapon', cost: 120, icon: '═', description: 'A punchy scattergun. Send a whole greeting party backwards.', label: 'SHOTGUN · 5' },
  { id: 'hammer', name: 'Bellbreaker', kind: 'weapon', cost: 220, icon: '┳', description: 'A colossal hammer. Crush crowds and launch the survivors.', label: 'HEAVY MELEE · 4' },
  { id: 'repeater', name: 'The Argument', kind: 'weapon', cost: 600, icon: '»', description: 'A rapid repeater. Settle disagreements at a distance.', label: 'AUTOMATIC · 6' },
  { id:'gravehook',name:'The Gravehook',kind:'weapon',cost:3000,icon:'☽',description:'Fast cursed sickle. F: Soul Hook pulls a fleeing goblin to you.',label:'CHAIN-SICKLE · 7' },
  { id:'gravebreaker',name:'The Gravebreaker',kind:'weapon',cost:7500,icon:'┳',description:'Colossal cursed hammer. F: Earthbreaker clears a wide circle.',label:'WARHAMMER · 8' },
  { id:'eclipse',name:'The Eclipse Sigil',kind:'weapon',cost:15000,icon:'☉',description:'Spinning rune-discs. F: Eclipse Burst sends a seeking volley.',label:'RUNIC FOCUS · 9' },
  { id: 'damage', name: 'Meaner hands', kind: 'upgrade', cost: 100, max: 5, icon: '✦', description: '+25% weapon damage per rank. More impact. Less negotiation.', label: 'DAMAGE' },
  { id: 'force', name: 'Bad influence', kind: 'upgrade', cost: 80, max: 4, icon: '↗', description: '+25% knockback per rank. Goblins become other goblins’ problem.', label: 'KNOCKBACK' },
  { id: 'capacity', name: 'Deep pockets', kind: 'upgrade', cost: 140, max: 4, icon: '▥', description: '+6 shotgun shells and +24 repeater rounds per rank.', label: 'MAGAZINE SIZE' },
  { id: 'trap', name: 'Thorn engine', kind: 'upgrade', cost: 160, max: 4, icon: '✳', description: 'Press T to plant a deadly crowd-clearing trap. Higher ranks improve its power.', label: 'DEPLOYABLE · T' },
  { id: 'cataclysm', name: 'Ruin covenant', kind: 'weapon', cost: 3000, icon: '◈', description: 'Unleash enormous hammer shockwaves and slam blasts. The debt gets smaller. Fast.', label: 'LATE GAME · HAMMER / SLAM' },
].map(item=>item.kind==='weapon'?{...item,cost:Math.round(item.cost*.8)}:item);

const milestones = new Map([
  [100, '100 DOWN · The marsh has noticed.'],
  [500, '500 DOWN · A professional nuisance.'],
  [2000, '2,000 DOWN · The horde grows. Keep swinging.'],
  [10000, '10,000 DOWN · You are the local weather.'],
  [20000, '20,000 SOULS · Excalibur awaits on Oath Hill.'],
  [25000, '25,000 DOWN · One sixth of a very bad idea.'],
  [50000, '50,000 DOWN · The bells are getting nervous.'],
  [75000, '75,000 DOWN · Half the debt. All the noise.'],
  [100000, '100,000 DOWN · Six figures. Tiny enemies.'],
  [125000, '125,000 DOWN · The end is in sight.'],
]);

const defaults = () => ({
  version: 2, kills: 0, coins: STARTER_SHEKKLES, starterGrantClaimed:true, totalEarned:0, equipped:'sword', towers:[], owned: ['fists', 'sword'],
  upgrades: { damage: 0, force: 0, capacity: 0, trap: 0 },
  settings: { sensitivity: 1, volume: .65, quality: 'medium', shake: .35 },
  victorySeen: false, secrets: [],
});
const finite = (v, fallback, min, max) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const weapons = new Set(['fists', 'sword', 'axe', 'hammer', 'shotgun', 'repeater', 'cataclysm','gravehook','gravebreaker','eclipse','excalibur']);

function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || ![1,2].includes(raw.version)) throw new Error('Unsupported save');
  const data = defaults();
  data.kills = Math.floor(finite(raw.kills, 0, 0, Number.MAX_SAFE_INTEGER));
  data.coins = Math.floor(finite(raw.coins, 0, 0, Number.MAX_SAFE_INTEGER));
  // One-time top-up for existing saves; spending remains saved across reloads.
  if(raw.starterGrantClaimed!==true)data.coins=Math.max(data.coins,STARTER_SHEKKLES);
  // Keep the original storage key and migrate v1 balances without losing purchases.
  data.totalEarned=Math.max(data.kills,Math.floor(finite(raw.totalEarned,data.kills,0,Number.MAX_SAFE_INTEGER)));
  data.owned = [...new Set(['fists', 'sword', ...(Array.isArray(raw.owned) ? raw.owned.filter(x => weapons.has(x)) : [])])];
  if(data.kills<EXCALIBUR_KILLS)data.owned=data.owned.filter(id=>id!=='excalibur');
  data.equipped=data.owned.includes(raw.equipped)&&raw.equipped!=='cataclysm'?raw.equipped:'sword';
  data.towers=(Array.isArray(raw.towers)?raw.towers:[]).slice(0,16).filter(t=>t&&TOWER_TYPES[t.type]&&Number.isFinite(t.x)&&Number.isFinite(t.z)&&Math.abs(t.x)<=BUILD_LIMIT&&Math.abs(t.z)<=BUILD_LIMIT).map((t,i)=>({id:i+1,type:t.type,x:t.x,z:t.z,level:Math.floor(finite(t.level,1,1,3)),...(typeof t.padId==='string'&&/^[a-z-]{1,50}$/.test(t.padId)?{padId:t.padId}:{})}));
  for (const id of Object.keys(data.upgrades)) {
    const max = SHOP_ITEMS.find(x => x.id === id).max;
    data.upgrades[id] = Math.floor(finite(raw.upgrades?.[id], 0, 0, max));
  }
  data.settings.sensitivity = finite(raw.settings?.sensitivity, 1, .15, 3);
  data.settings.volume = finite(raw.settings?.volume, .65, 0, 1);
  data.settings.shake = finite(raw.settings?.shake, .35, 0, 1);
  if (['low', 'medium', 'high'].includes(raw.settings?.quality)) data.settings.quality = raw.settings.quality;
  data.victorySeen = data.kills >= GOAL && raw.victorySeen === true;
  data.secrets = Array.isArray(raw.secrets) ? [...new Set(raw.secrets.filter(x => typeof x === 'string').slice(0, 100))] : [];
  return data;
}

export class Progression {
  constructor(storage) {
    this.storageStatus = 'saved';
    this.storage = storage;
    this.data = defaults();
    this.saveTimer = null;
    try {
      this.storage ??= globalThis.localStorage;
      const value = this.storage?.getItem(SAVE_KEY);
      if (value) {
        try { this.data = sanitize(JSON.parse(value)); }
        catch { this.storageStatus = 'recovered'; }
      }
      if (!this.storage) this.storageStatus = 'unavailable';
    } catch { this.storageStatus = 'unavailable'; }
    if (globalThis.addEventListener) {
      globalThis.addEventListener('pagehide', () => this.save());
      globalThis.addEventListener('visibilitychange', () => { if (globalThis.document?.hidden) this.save(); });
    }
  }
  creditKill() {
    this.data.kills++;
    this.data.coins++;
    this.data.totalEarned++;
    const victory = this.data.kills >= GOAL && !this.data.victorySeen;
    if (victory) this.data.victorySeen = true;
    this.scheduleSave();
    if (victory || milestones.has(this.data.kills)) this.save();
    return { milestone: milestones.get(this.data.kills) || null, victory };
  }
  scheduleSave() {
    if (this.saveTimer !== null) return;
    this.saveTimer = setTimeout(() => { this.saveTimer = null; this.save(); }, 1500);
    this.saveTimer?.unref?.();
  }
  getLevel(id) { return this.data.upgrades[id] ?? (this.data.owned.includes(id) ? 1 : 0); }
  getCost(id) {
    const item = SHOP_ITEMS.find(x => x.id === id);
    return item ? Math.round(item.cost * (item.kind === 'upgrade' ? 1.8 ** this.getLevel(id) : 1)) : Infinity;
  }
  canBuy(id) {
    const item = SHOP_ITEMS.find(x => x.id === id);
    return !!item && this.getLevel(id) < (item.max || 1) && this.data.coins >= this.getCost(id);
  }
  purchase(id) {
    const item = SHOP_ITEMS.find(x => x.id === id);
    if (!item) return { ok: false, message: 'Unknown item.' };
    if (this.getLevel(id) >= (item.max || 1)) return { ok: false, message: 'Already fully upgraded.' };
    const cost = this.getCost(id);
    if (this.data.coins < cost) return { ok: false, message: 'Not enough Shekkles. Keep swinging.' };
    this.data.coins -= cost;
    if (item.kind === 'upgrade') this.data.upgrades[id]++;
    else this.data.owned.push(id);
    this.save();
    return { ok: true, message: `${item.name.toUpperCase()} ${item.kind === 'upgrade' ? 'UPGRADED' : 'UNLOCKED'}`, item };
  }
  unlockExcalibur(){
    if(this.data.kills<EXCALIBUR_KILLS||this.data.owned.includes('excalibur'))return false;
    this.data.owned.push('excalibur');this.data.equipped='excalibur';this.save();return true;
  }
  placeTower(type,x,z,padId=null){
    const def=TOWER_TYPES[type];
    if(!def||this.data.coins<def.cost||this.data.towers.length>=16||!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>BUILD_LIMIT||Math.abs(z)>BUILD_LIMIT||padId&&this.data.towers.some(t=>t.padId===padId))return null;
    this.data.coins-=def.cost;const tower={id:Math.max(0,...this.data.towers.map(t=>t.id))+1,type,x,z,level:1,...(padId?{padId}:{})};this.data.towers.push(tower);this.save();return tower;
  }
  towerUpgradeCost(tower){return tower&&tower.level<3?Math.round(TOWER_TYPES[tower.type].cost*.55*tower.level):Infinity;}
  upgradeTower(id){const t=this.data.towers.find(t=>t.id===id),cost=this.towerUpgradeCost(t);if(!t||this.data.coins<cost||t.level>=3)return false;this.data.coins-=cost;t.level++;this.save();return true;}
  save() {
    if (this.saveTimer !== null) { clearTimeout(this.saveTimer); this.saveTimer = null; }
    try {
      if (!this.storage) throw new Error('Storage unavailable');
      this.storage.setItem(SAVE_KEY, JSON.stringify(this.data));
      this.storageStatus = 'saved';
      return true;
    } catch { this.storageStatus = 'unavailable'; return false; }
  }
  reset() { this.data = defaults(); this.save(); }
  exportSave() { return JSON.stringify({ ...this.data, version: 2 }, null, 2); }
  importSave(text) {
    try {
      if (typeof text !== 'string' || text.length > 100000) return false;
      const data = sanitize(JSON.parse(text));
      // Importing progress at the goal may display the ending once if not yet seen.
      this.data = data;
      this.save();
      return true;
    } catch { return false; }
  }
}
