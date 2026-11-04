import './style.css';
import './hud.css';
import { SHOP_ITEMS, GOAL, TOWER_TYPES } from './progression.js';
import {WEAPONS} from './weapons.js';

const format = value => Math.floor(Number(value) || 0).toLocaleString('en-US');
const weaponNames = Object.fromEntries(Object.entries(WEAPONS).map(([id,w])=>[id,w.name]));

export class GameUI {
  constructor(progression, callbacks = {}) {
    this.progression = progression;
    this.callbacks = callbacks;
    this.screen = 'title';
    this.last = {};
    this.root = document.createElement('div');
    this.root.id = 'game-ui';
    this.root.innerHTML = `
      <div id="vignette"></div><div id="hurt-flash"></div>
      <div id="hud" hidden>
        <header class="hud-top">
          <div class="debt-box"><div><b id="kill-number">0</b><span class="goal-number"> / 150,000</span></div><div class="progress-track"><i id="debt-progress"></i></div><small id="excalibur-progress"></small></div>
          <div class="brass-box"><span class="tiny-label">SHEKKLES</span><b>◈ <span id="coin-number">0</span></b></div>
        </header>
        <div id="crosshair"><i></i><i></i><i></i><i></i><b></b></div><div id="hitmarker">×</div>
        <div id="interact-prompt" hidden></div><div id="placement-prompt" hidden></div>
        <footer class="hud-bottom"><div class="vital-box"><div class="health-row"><span class="health-icon">+</span><b id="health-number">100</b></div><div class="health-track"><i id="health-bar"></i></div></div><div class="weapon-box"><b id="weapon-name">Rustbite</b><div id="ammo-display" hidden></div></div></footer>
      </div>
      <div id="notifications" aria-live="polite"></div>
      <main id="menu-layer"></main>
      <input id="save-file" type="file" accept="application/json,.json" hidden>
    `;
    document.body.appendChild(this.root);
    this.menu = this.root.querySelector('#menu-layer');
    this.hud = this.root.querySelector('#hud');
    this.root.addEventListener('click', e => {
      const target = e.target.closest('[data-action]');
      if (!target || target.disabled) return;
      this.action(target.dataset.action, target.dataset.id);
    });
    this.root.addEventListener('input', e => {
      const setting = e.target.dataset.setting;
      if (!setting) return;
      const value = setting === 'quality' ? e.target.value : Number(e.target.value);
      this.progression.data.settings[setting] = value;
      const out = this.menu.querySelector(`[data-output="${setting}"]`);
      if (out) out.textContent = setting === 'sensitivity' ? `${value.toFixed(2)}×` : `${Math.round(value * 100)}%`;
      this.callbacks.onSettings?.({ ...this.progression.data.settings });
      this.progression.save();
    });
    this.root.querySelector('#save-file').addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      if (file.size > 100000) { this.notify('That backup is too large.', 'error'); return; }
      if (!confirm('Replace your current progress with this backup?')) { e.target.value = ''; return; }
      try {
        const text = await file.text();
        const ok = this.callbacks.onImport ? this.callbacks.onImport(text) : this.progression.importSave(text);
        this.notify(ok === false ? 'Could not read that save backup.' : 'BACKUP RESTORED', ok === false ? 'error' : 'good');
        this.show(this.screen);
      } catch { this.notify('Could not read that file.', 'error'); }
      e.target.value = '';
    });
    this.show('title');
  }
  action(action, id) {
    if (action === 'play') this.callbacks.onPlay?.();
    if (action === 'resume') this.callbacks.onResume?.();
    if (action === 'pause') this.callbacks.onPause?.();
    if (action === 'arsenal') this.callbacks.onArsenal?.();
    if (action === 'towers') this.callbacks.onTowers?.();
    if (action === 'equip') this.callbacks.onEquip?.(id);
    if (action === 'tower-upgrade') {this.callbacks.onTowerUpgrade?.(Number(id));this.show('towers');}
    if (action === 'shop') this.show('shop');
    if (action === 'purchase') {
      if (this.callbacks.onPurchase) {const result=this.callbacks.onPurchase(id);if(result?.placing)return;}
      else { const result = this.progression.purchase(id); this.notify(result.message, result.ok ? 'good' : 'error'); }
      this.show('shop');
    }
    if (action === 'settings') { this.settingsOpen = !this.settingsOpen; this.show(this.screen); }
    if (action === 'import') this.root.querySelector('#save-file').click();
    if (action === 'export') {
      if (this.callbacks.onExport) { this.callbacks.onExport(); return; }
      const blob = new Blob([this.progression.exportSave()], { type: 'application/json' });
      const url = URL.createObjectURL(blob), a = document.createElement('a');
      a.href = url; a.download = 'mirebreak-save.json'; a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      this.notify('SAVE BACKUP EXPORTED', 'good');
    }
    if (action === 'reset' && confirm('Erase all goblin kills, Shekkles and unlocks? This cannot be undone. Export a backup first if you want to keep them.')) {
      if (this.callbacks.onReset) this.callbacks.onReset(); else this.progression.reset();
      this.notify('A fresh debt. A fresh start.');
      this.show('title');
    }
  }
  settingsMarkup() {
    const s = this.progression.data.settings;
    return `<section class="settings-panel"><div class="settings-heading">MAKE YOURSELF COMFORTABLE</div>
      <label>Mouse sensitivity <output data-output="sensitivity">${s.sensitivity.toFixed(2)}×</output><input aria-label="Mouse sensitivity" data-setting="sensitivity" type="range" min="0.15" max="3" step="0.05" value="${s.sensitivity}"></label>
      <label>Sound volume <output data-output="volume">${Math.round(s.volume * 100)}%</output><input aria-label="Sound volume" data-setting="volume" type="range" min="0" max="1" step="0.05" value="${s.volume}"></label>
      <label>Camera shake <output data-output="shake">${Math.round(s.shake * 100)}%</output><input aria-label="Camera shake" data-setting="shake" type="range" min="0" max="1" step="0.05" value="${s.shake}"></label>
      <label>Graphics quality <select aria-label="Graphics quality" data-setting="quality"><option value="low" ${s.quality === 'low' ? 'selected' : ''}>Low · lighter crowds & effects</option><option value="medium" ${s.quality === 'medium' ? 'selected' : ''}>Medium · recommended</option><option value="high" ${s.quality === 'high' ? 'selected' : ''}>High · maximum mayhem</option></select></label>
      <div class="save-buttons"><button data-action="export">Export save</button><button data-action="import">Import save</button><button class="danger-link" data-action="reset">Reset progress</button></div></section>`;
  }
  controlsMarkup() {
    return `<div class="controls-grid"><span><kbd>W A S D</kbd> Move</span><span><kbd>MOUSE</kbd> Look</span><span><kbd>LMB</kbd> Attack</span><span><kbd>RMB</kbd> Quick punch</span><span><kbd>SHIFT</kbd> Sprint</span><span><kbd>SPACE</kbd> Double jump</span><span><kbd>Q</kbd> Dash</span><span><kbd>CTRL</kbd> Slide / air slam</span><span><kbd>R</kbd> Reload</span><span><kbd>1–0</kbd> Switch weapon</span><span><kbd>F</kbd> Special (hold for Excalibur)</span><span><kbd>TAB</kbd> Weapon arsenal</span><span><kbd>B</kbd> Inspect towers</span><span><kbd>T</kbd> Plant trap</span><span><kbd>E</kbd> Forge / interact</span></div>`;
  }
  saveNote() {
    return this.progression.storageStatus === 'unavailable' ? '<span class="save-warning">Browser saving is unavailable. Export a backup before leaving.</span>' : this.progression.storageStatus === 'recovered' ? '<span class="save-warning">An unreadable save was recovered with fresh progress.</span>' : 'Auto-saved in this browser, on this device. Export a backup to take it with you.';
  }
  show(screen) {
    this.screen = screen;
    this.root.dataset.screen = screen || 'playing';
    this.hud.hidden = screen !== null;
    this.menu.hidden = screen === null;
    if (screen === null) { this.menu.innerHTML = ''; return; }
    const d = this.progression.data;
    if(screen==='arsenal'){
      this.menu.innerHTML=`<section class="panel shop-panel"><header class="shop-header"><div><span class="tiny-label">PERMANENTLY YOURS</span><h2>The arsenal.</h2></div><button class="secondary" data-action="resume">Back to the mire ↗</button></header><div class="shop-grid">${Object.entries(WEAPONS).map(([id,w])=>`<article class="shop-card ${d.owned.includes(id)?'owned':''}">${this.previewMarkup(id)}<h3>${w.name}</h3><p>${w.damage} damage · ${(1/w.cooldown).toFixed(1)} attacks/s · ${w.range}m range<br>${w.special?`F · ${w.special}`:'Reliable bad intentions.'}</p><button data-action="equip" data-id="${id}" ${d.owned.includes(id)?'':'disabled'}>${d.equipped===id?'✓ EQUIPPED':d.owned.includes(id)?'EQUIP':id==='excalibur'?'20,000 SOULS · OATH HILL':'NOT OWNED · AMBER FORGE'}</button></article>`).join('')}</div></section>`;return;
    }
    if(screen==='towers'){
      this.menu.innerHTML=`<section class="panel shop-panel"><header class="shop-header"><div><span class="tiny-label">PERSISTENT DEFENCES · ${d.towers.length} / 16</span><h2>Your watchtowers.</h2><p>Shekkles ${format(d.coins)}</p></div><button class="secondary" data-action="resume">Return ↗</button></header><div class="shop-grid">${d.towers.length?d.towers.map(t=>`<article class="shop-card"><h3>${TOWER_TYPES[t.type].name}</h3><p>Level ${t.level} / 3 · map ${t.x.toFixed(0)}, ${t.z.toFixed(0)}<br>${TOWER_TYPES[t.type].description}</p><button data-action="tower-upgrade" data-id="${t.id}" ${t.level===3||d.coins<this.progression.towerUpgradeCost(t)?'disabled':''}>${t.level===3?'MAX LEVEL':`UPGRADE · ${format(this.progression.towerUpgradeCost(t))} Shekkles`}</button></article>`).join(''):'<p>No towers yet. Purchase and place one at the amber forge.</p>'}</div></section>`;return;
    }
    if (screen === 'title') {
      this.menu.innerHTML = `<div class="title-layout"><section class="title-main"><div class="edition-mark"><span class="seal">✳</span> A VERY SMALL APOCALYPSE</div><h1>MIRE<span>BREAK</span></h1><div class="subtitle"><i></i> GOBLIN DEBT <i></i></div><p class="tagline">Tiny goblins.<br>Enormous outstanding balance.</p><div class="title-actions"><button class="primary" data-action="play">${d.kills ? 'CONTINUE THE DEBT' : 'ENTER THE MIRE'} <span>↗</span></button><button class="secondary" data-action="settings">${this.settingsOpen ? 'Close settings' : 'Settings & saves'}</button></div>${this.settingsOpen ? this.settingsMarkup() : `<div class="title-progress"><b>${format(d.kills)}</b><span> / 150,000 GOBLINS</span><div class="progress-track"><i style="width:${Math.min(100, d.kills / GOAL * 100)}%"></i></div></div>`}<div class="save-note">${this.saveNote()}</div></section><aside class="field-guide"><span class="tiny-label">YOUR ONLY ASSIGNMENT</span><h2>Clear the mire.<br>Enjoy the mess.</h2><p>Run fast. Hit hard. Turn Shekkles into better problems at the amber forge.</p><div class="guide-divider"></div><span class="tiny-label">NO LESSONS. JUST BUTTONS.</span>${this.controlsMarkup()}<p class="mouse-note">Click Play to capture your mouse.<br><kbd>ESC</kbd> releases it and pauses the game.</p></aside></div><div class="menu-bottom"><span>ORIGINAL FANTASY MAYHEM</span><span>ONE MIRE. 150,000 BAD NEIGHBOURS.</span></div>`;
    } else if (screen === 'pause') {
      this.menu.innerHTML = `<section class="panel pause-panel"><span class="tiny-label">THE GOBLINS CAN WAIT</span><h2>Catch your breath.</h2><p class="muted">${format(d.kills)} down. ${format(Math.max(0, GOAL - d.kills))} to go.</p><button class="primary" data-action="resume">BACK TO IT <span>↗</span></button><div class="save-buttons"><button data-action="arsenal">Weapon arsenal · Tab</button><button data-action="towers">Inspect towers · B</button></div>${this.progressMarkup()}${this.settingsMarkup()}<details class="controls-details"><summary>Controls</summary>${this.controlsMarkup()}</details><p class="save-note">${this.saveNote()}</p></section>`;
    } else if (screen === 'shop') {
      this.menu.innerHTML = `<section class="panel shop-panel"><header class="shop-header"><div><span class="tiny-label">THE AMBER FORGE</span><h2>Spend Shekkles.<br>Make trouble.</h2></div><div class="shop-balance"><span class="tiny-label">YOUR SHEKKLES</span><b>◈ ${format(d.coins)}</b><button class="secondary" data-action="resume">Back to the mire ↗</button></div></header><div class="shop-grid">${SHOP_ITEMS.map(item => {
        const level = this.progression.getLevel(item.id), maxed = level >= (item.max || 1), afford = this.progression.canBuy(item.id);
        return `<article class="shop-card ${maxed ? 'owned' : ''}"><div class="item-heading"><span class="item-icon">${item.icon}</span><span class="tiny-label">${item.label}</span></div>${WEAPONS[item.id]?this.previewMarkup(item.id):''}<h3>${item.name}</h3><p>${item.description}${WEAPONS[item.id]?`<br><strong>${WEAPONS[item.id].damage} damage · ${(1/WEAPONS[item.id].cooldown).toFixed(1)} attacks/s</strong>`:''}</p><div class="item-footer">${item.max ? `<span class="ranks" aria-label="Rank ${level} of ${item.max}">${'▰'.repeat(level)}<span>${'▱'.repeat(item.max - level)}</span></span>` : '<span></span>'}<button data-action="purchase" data-id="${item.id}" ${maxed || !afford ? 'disabled' : ''} class="${afford ? 'affordable' : ''}">${maxed ? '✓ OWNED' : `◈ ${format(this.progression.getCost(item.id))}`}</button></div></article>`;
      }).join('')}</div><h3>Build a watch. Keep the hunt moving.</h3><p class="muted">Choose a defence, then click a green placement preview. No Shekkles spent until placement. Maximum 16 towers.</p><div class="shop-grid">${Object.entries(TOWER_TYPES).map(([id,t])=>`<article class="shop-card"><div class="item-heading"><span class="item-icon">♜</span><span class="tiny-label">DEFENCE · ${t.range}m RANGE</span></div><h3>${t.name}</h3><p>${t.description}</p><button data-action="purchase" data-id="tower:${id}" ${d.coins<t.cost||d.towers.length>=16?'disabled':''}>PLACE · ${format(t.cost)} Shekkles</button></article>`).join('')}</div><p class="save-note">Excalibur is exclusive to Oath Hill. Earn 20,000 lifetime kills, then pull it from the stone. Purchases are permanent.</p></section>`;
    } else if (screen === 'death') {
      this.menu.innerHTML = `<section class="panel ending-panel"><span class="tiny-label">A MINOR INCONVENIENCE</span><div class="ending-symbol">✛</div><h2>Briefly horizontal.</h2><p>The goblins took a few Shekkles.<br>Your kills and unlocks are yours forever.</p><div class="ending-stat">${format(d.kills)}<span>GOBLINS STILL VERY DEAD</span></div><button class="primary" data-action="play">GET BACK UP <span>↗</span></button></section>`;
    } else if (screen === 'victory') {
      this.menu.innerHTML = `<section class="panel ending-panel victory-panel"><span class="tiny-label">THE MIRE IS YOURS</span><div class="ending-symbol">✳</div><h2>Debt.<br>Obliterated.</h2><p>150,000 goblins. One spectacular accounting error.<br>For the first time in centuries, the bells are quiet.</p><div class="ending-stat">${format(d.kills)}<span>GENUINE GOBLINS. GENUINELY GONE.</span></div><button class="primary" data-action="resume">TAKE A VICTORY LAP <span>↗</span></button><p class="save-note">Your victory and progress are saved. The mire remains open.</p></section>`;
    }
  }
  previewMarkup(id){const src=this.previews?.[id];return src?`<img class="weapon-preview" src="${src}" alt="${WEAPONS[id].name} weapon model">`:'';}
  reward(){this.rewardUntil=performance.now()+180;}
  progressMarkup(){
    const d=this.progression.data,s=this.last,w=WEAPONS[d.equipped];
    return `<details class="progress-details"><summary>Progress & abilities</summary><dl><dt>Region</dt><dd>${s.zone||'The Sunken March'}</dd><dt>Shekkles earned</dt><dd>${format(d.totalEarned)}</dd><dt>Excalibur</dt><dd>${d.owned.includes('excalibur')?'Claimed':format(Math.min(20000,d.kills))+' / 20,000 souls · Oath Hill'}</dd><dt>Defences</dt><dd>${d.towers.length} / 16 placed · B to inspect</dd><dt>Dash</dt><dd>Q · ${s.dash>0?s.dash.toFixed(1)+'s':'Ready'}</dd><dt>Thorn engine</dt><dd>${d.upgrades.trap?'T · '+(s.trapCooldown>0?s.trapCooldown.toFixed(1)+'s':'Ready'):'Buy at the amber forge'}</dd><dt>Weapon special</dt><dd>${w.special?s.special||'F · '+w.special:'None · RMB quick punch'}</dd></dl></details>`;
  }
  update(state) {
    this.last={...this.last,...state};const s=this.last;
    const write=(id,value)=>{const el=this.root.querySelector('#'+id);if(el&&el.textContent!==String(value))el.textContent=value;};
    write('kill-number',format(s.kills??this.progression.data.kills));write('coin-number',format(s.coins??this.progression.data.coins));
    this.root.querySelector('.brass-box').classList.toggle('reward',performance.now()<(this.rewardUntil||0));
    write('health-number',Math.max(0,Math.ceil(s.health??100)));write('weapon-name',weaponNames[s.weaponId]||s.weapon||'Rustbite');
    const excal=this.root.querySelector('#excalibur-progress');excal.hidden=this.progression.data.owned.includes('excalibur');write('excalibur-progress','✦ '+format(Math.min(20000,s.kills||0))+' / 20,000');
    const ammo=this.root.querySelector('#ammo-display');ammo.hidden=s.ammo===undefined||s.ammo===null;
    if(!ammo.hidden)write('ammo-display',s.reloading?'Reloading':String(s.ammo));
    this.root.querySelector('#health-bar').style.width=Math.min(100,Math.max(0,s.health??100))+'%';
    this.root.querySelector('.vital-box').classList.toggle('critical',(s.health??100)<30);
    this.root.querySelector('#debt-progress').style.width=Math.min(100,(s.kills??0)/GOAL*100)+'%';
    const interact=this.root.querySelector('#interact-prompt');interact.hidden=!s.interact||!!s.placement;
    if(s.interact&&this.lastInteract!==s.interact){interact.replaceChildren();const key=document.createElement('kbd');key.textContent='E';interact.append(key,document.createTextNode(' '+s.interact));this.lastInteract=s.interact;}
    const place=this.root.querySelector('#placement-prompt');place.hidden=!s.placement;if(s.placement)place.textContent=s.placement;
    const crosshair=this.root.querySelector('#crosshair');crosshair.classList.toggle('charging',!!s.charging);crosshair.style.setProperty('--charge',s.charge||0);
  }
  notify(text, kind = '') {
    const box = document.createElement('div'); box.className = `notification ${kind}`; box.textContent = text;
    const container = this.root.querySelector('#notifications'); container.appendChild(box);
    while (container.children.length > 1) container.firstChild.remove();
    setTimeout(() => box.remove(), 2400);
  }
  hit(killed = false) {
    const el = this.root.querySelector('#hitmarker'); el.classList.remove('flash', 'kill'); void el.offsetWidth;
    if (killed) el.classList.add('kill'); el.classList.add('flash');
  }
  damage() {
    const el = this.root.querySelector('#hurt-flash'); el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
  }
  setSettings(settings) { Object.assign(this.progression.data.settings, settings); if (this.screen) this.show(this.screen); }
}
