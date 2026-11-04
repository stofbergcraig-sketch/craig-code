export const SAVE_KEY = 'mirebreak.goblin-debt.v1';
export const GOAL = 150000;

export const SHOP_ITEMS = [
  { id: 'axe', name: 'Grudge cleaver', kind: 'weapon', cost: 80, icon: '╱', description: 'A heavy axe. Longer reach, wider cuts, a very bad attitude.', label: 'MELEE · 3' },
  { id: 'shotgun', name: 'Gravelmouth', kind: 'weapon', cost: 120, icon: '═', description: 'A punchy scattergun. Send a whole greeting party backwards.', label: 'SHOTGUN · 5' },
  { id: 'hammer', name: 'Bellbreaker', kind: 'weapon', cost: 220, icon: '┳', description: 'A colossal hammer. Crush crowds and launch the survivors.', label: 'HEAVY MELEE · 4' },
  { id: 'repeater', name: 'The Argument', kind: 'weapon', cost: 600, icon: '»', description: 'A rapid repeater. Settle disagreements at a distance.', label: 'AUTOMATIC · 6' },
  { id: 'damage', name: 'Meaner hands', kind: 'upgrade', cost: 100, max: 5, icon: '✦', description: '+25% weapon damage per rank. More impact. Less negotiation.', label: 'DAMAGE' },
  { id: 'force', name: 'Bad influence', kind: 'upgrade', cost: 80, max: 4, icon: '↗', description: '+25% knockback per rank. Goblins become other goblins’ problem.', label: 'KNOCKBACK' },
  { id: 'capacity', name: 'Deep pockets', kind: 'upgrade', cost: 140, max: 4, icon: '▥', description: '+2 shotgun shells and +8 repeater rounds per rank.', label: 'MAGAZINE SIZE' },
  { id: 'trap', name: 'Thorn engine', kind: 'upgrade', cost: 160, max: 4, icon: '✳', description: 'Press T to plant a deadly crowd-clearing trap. Higher ranks improve its power.', label: 'DEPLOYABLE · T' },
  { id: 'cataclysm', name: 'Ruin covenant', kind: 'weapon', cost: 3000, icon: '◈', description: 'Unleash enormous hammer shockwaves and slam blasts. The debt gets smaller. Fast.', label: 'LATE GAME · HAMMER / SLAM' },
];

const milestones = new Map([
  [100, '100 DOWN · The marsh has noticed.'],
  [500, '500 DOWN · A professional nuisance.'],
  [2000, '2,000 DOWN · The horde grows. Keep swinging.'],
  [10000, '10,000 DOWN · You are the local weather.'],
  [25000, '25,000 DOWN · One sixth of a very bad idea.'],
  [50000, '50,000 DOWN · The bells are getting nervous.'],
  [75000, '75,000 DOWN · Half the debt. All the noise.'],
  [100000, '100,000 DOWN · Six figures. Tiny enemies.'],
  [125000, '125,000 DOWN · The end is in sight.'],
]);

const defaults = () => ({
  version: 1, kills: 0, coins: 0, owned: ['fists', 'sword'],
  upgrades: { damage: 0, force: 0, capacity: 0, trap: 0 },
  settings: { sensitivity: 1, volume: .65, quality: 'medium', shake: .35 },
  victorySeen: false, secrets: [],
});
const finite = (v, fallback, min, max) => typeof v === 'number' && Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : fallback;
const weapons = new Set(['fists', 'sword', 'axe', 'hammer', 'shotgun', 'repeater', 'cataclysm']);

function sanitize(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw) || raw.version !== 1) throw new Error('Unsupported save');
  const data = defaults();
  data.kills = Math.floor(finite(raw.kills, 0, 0, Number.MAX_SAFE_INTEGER));
  data.coins = Math.floor(finite(raw.coins, 0, 0, Number.MAX_SAFE_INTEGER));
  data.owned = [...new Set(['fists', 'sword', ...(Array.isArray(raw.owned) ? raw.owned.filter(x => weapons.has(x)) : [])])];
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
    if (this.data.coins < cost) return { ok: false, message: 'Not enough brass. Keep swinging.' };
    this.data.coins -= cost;
    if (item.kind === 'upgrade') this.data.upgrades[id]++;
    else this.data.owned.push(id);
    this.save();
    return { ok: true, message: `${item.name.toUpperCase()} ${item.kind === 'upgrade' ? 'UPGRADED' : 'UNLOCKED'}`, item };
  }
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
  exportSave() { return JSON.stringify({ ...this.data, version: 1 }, null, 2); }
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
