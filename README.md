# MIREBREAK: Goblin Debt

A complete original first-person WebGL action game. One sunken fortress. Very small goblins. An outstanding balance of **150,000 genuine kills**.

## Play on Windows

Install **Node.js 22.12 or newer** (Node 24 LTS recommended), download/clone this repository, then open Terminal in its folder:

```powershell
npm ci
npm run dev -- --port 5173
```

Open **http://localhost:5173** in current Chrome or Edge with hardware acceleration enabled. Click **Enter the Mire** to capture the mouse. Keep the terminal running. Alternatively, double-click `play-windows.cmd` after installing Node. No account, backend, paid assets or subscription is needed. The first dependency installation requires Internet access; the running game uses local assets and synthesized audio.

For the optimized version: `npm run build`, then `npm run preview -- --port 5173`. Always use the same browser and address/port to retain the same save. Opening index.html directly does not work.

## Controls

| Input | Action |
|---|---|
| WASD / mouse | Move / look |
| Shift | Sprint |
| Space, Space | Jump, double jump |
| Q | Dash |
| Ctrl | Ground slide / downward air slam |
| Left mouse / right mouse | Current weapon / quick punch |
| 1 / 2 / 3 / 4 | Fists / sword / axe / hammer |
| 5 / 6 | Shotgun / automatic repeater |
| 7 / 8 / 9 / 0 | Gravehook / Gravebreaker / Eclipse Sigil / Excalibur |
| Tab | Owned weapon arsenal; equip from anywhere |
| F | Weapon special; hold at least 0.6 seconds and release for Excalibur |
| B | Inspect and upgrade placed towers |
| Mouse wheel | Cycle unlocked weapons |
| R | Reload; reserve ammunition is unlimited |
| T | Plant a purchased thorn engine |
| E near amber forge | Shop |
| Escape | Pause and release the mouse |

Sensitivity, volume, graphics and camera shake are adjustable in Settings. Click Resume to capture the mouse again. Low quality reduces render resolution, active goblins, particles and corpses.

The play HUD is deliberately minimal: kills, Shekkles, health, current weapon (with a small magazine count for guns), and a discreet Excalibur soul counter. Controls, region, lifetime earnings, trap/dash readiness and special-ability details are under **Escape → Progress & abilities / Controls**. Charging Excalibur brightens the crosshair. Kill rewards briefly tint the Shekkle counter instead of spawning text. Notifications replace one another rather than stacking.

## Terrain update

The same districts and routes now sit in a sampled landscape: rolling ridges, a shallow southwestern basin, a sunken Gravewood, a three-metre camp plateau and a five-metre keep terrace. Existing buildings keep level foundations; broad slopes connect them. Rocky shelves mark several ridges without blocking the main lanes. Oath Hill and its original sword remain on the southern causeway.

One 128×128 heightfield supplies the rendered ground and the same height samples used by player movement, goblin spawns/fleeing, corpses, particles, tower foundations and projectiles. Paths follow the ground. Bullets and magic cannot pass through a ridge. Towers can be placed on gentle elevated ground but reject steep footprints. Existing tower purchases/levels are retained; a tower obstructed by a new rock landmark searches a nearby clear position rather than losing the purchase.

## Progression

Begin with fists and Rustbite. All other ordinary weapons are permanently purchased at the amber forge to the left of the starting courtyard. There are **no ordinary world weapon pickups**. Every defeated goblin earns exactly one kill and **one Shekkle**. Explosive barrels, collisions, slam attacks, magic, traps and towers all use that same guarded death-credit path. Distant despawns grant nothing. Goblins flee at roughly 12.5m/s (variants 11.9–13.1), faster than walking (10.5) but slower than sprinting (15). At close range they hesitate and periodically stumble. Stable heading selection avoids nearby obstacles and map edges; panic spreads to nearby goblins.

Buy knockback, damage and magazine upgrades; plant thorn engines with T. Higher trap ranks improve radius, damage, cooldown and lifetime. Bellbreaker clears crowds; the Ruin Covenant turns its shockwave into a 23-metre attack. Enemy density increases with progress. Explore the preserved Gravewood, Splinter Camp, Hollow Keep and old causeway; three hidden caches award one-time Shekkles, never fictitious kills.

New weapons: **Gravehook** (3,000 Shekkles) slashes quickly; F launches a visible chain-hook that pulls a goblin closer. **Gravebreaker** (7,500) delivers heavy sweeps; F unleashes Earthbreaker, a 22m blast on a 7-second cooldown. **Eclipse Sigil** (15,000) launches spinning rune-discs with occasional ricochets; F sends a seeking volley on a 5-second cooldown. **Excalibur** is exclusive to Oath Hill, the terraced hill beside the existing southern causeway at map (18,60). It requires 20,000 lifetime kills, regardless of current Shekkles. Press E at the stone to claim it in a brief extraction sequence. Its F attack charges a short-range magical wave. It cannot be bought. All weapons have model previews and stats in the shop/arsenal; new melee combo poses have wind-up, contact and follow-through, with damage delayed to their contact phase.

Defences: Wooden Bolt Turret (5,000), Arcane Wizard Tower (12,500), Cursed Ballista (25,000), Stormcaller Tower (50,000), Obsidian Death Spire (100,000). Choose one at the forge, leave the shop and aim its ground preview. Green = valid; red = blocked. Click to place, right-click or Escape to cancel. Currency is deducted only on successful placement. Place on level or gently sloping ground, away from walls, shops, Oath Hill and other structures. The preview follows the terrain. There is a 16-tower cap. B opens the inspection/upgrade menu; E beside a tower also opens it. Levels 2 and 3 improve fire rate, range and damage, adding visible runes and a crown. Positions and levels persist across sessions. Towers use the same enemy damage/death path as weapons; bolts pierce, orbs explode, and storm attacks chain between targets. Projectiles use a fixed 96-object pool.

Health regenerates after four seconds without damage; kills restore a little health. Cornered goblins can still lash out. Death costs 10% of current Shekkles, preserving kills, lifetime earnings and purchases. Respawn returns you to the courtyard. At 150,000 kills the original ending appears, and you can continue playing.

The original **45–60 active-minute** completion target remains a tuning estimate, **not a measured full playthrough**, and the new chase loop may lengthen it. That window requires 55.6–41.7 kills/second. Late medium-quality spawning can replenish 90 real enemies/second, high 120, low 60. Large hammer blasts, Excalibur waves, traps and tower coverage provide repeatable crowd clearing. Actual completion depends on exploration, pursuit, purchases and hardware. There are never 150,000 active entities: caps remain 200/400/650.

## Saves and backups

Autosaves retain the original localStorage key `mirebreak.goblin-debt.v1`. Schema version 2 migrates old kills, balances, purchases and upgrades automatically. Kills, current Shekkles, lifetime Shekkles earned, equipped weapon, Excalibur ownership, tower positions/levels, found caches and settings persist. Legacy lifetime earnings initialize from kills because old saves did not track spending history. Internally `coins` remains the balance field for migration compatibility; the UI calls it Shekkles. Position, health and temporary thorn engines reset on a new session. Saves belong to that browser/profile/device and web origin. Keep using the same localhost address and port when updating, and export a backup first. Settings provides Export/Import and confirmed Reset. Blocked storage does not stop play; malformed backups do not overwrite valid progress.

## Development and validation

`npm test` runs gameplay, migration, fleeing/sprint balance, soul-gate, tower, projectile, placement, storage and exactly-once reward tests. `npm run build` makes `dist/`. With the development server running on port5173, `node tests/browser.mjs` exercises the preserved game loop and `node tests/expansion-browser.mjs` exercises the expansion. The cloud scripts use `/usr/bin/chromium` and software WebGL; expansion tests accept a CHROMIUM_PATH override. Browser diagnostics are exposed **only** with `?test=1` under the development server, and stripped from production. Victory testing starts a development save at149,999 and defeats a real spawned goblin. Production play has no kill-award shortcut.

All art, textures, map geometry, character designs, weapon models and audio are generated in the project. Three.js (MIT) and Vite (MIT) are open-source dependencies; see their installed license files. No reference-game assets or code are included.

Current scope: simple crowd steering and stylized tumbling deaths, not full skeletal ragdolls or navigation meshes. No wall-jump, executions, multiplayer, controller support or aim-down-sights. Windows hardware performance and a full 150,000-kill human playthrough have not been measured in this Linux cloud environment.

## Files

`player.js`: movement/collision. `enemies.js`: pooled fleeing crowds, damage and death. `world.js`: preserved districts and procedural art. `terrain.js`: sampled landscape and shared height/ray queries. `weapons.js`: animated models and previews. `audio.js`: synthesized effects. `progression.js`: currency, purchases and saves. `ui.js`/`style.css`/`hud.css`: menus/minimal HUD. `main.js`: integration/combat/abilities. `effects.js`: capped particles/shockwaves. `arcana.js`: pooled projectiles and targeting. `defences.js`: placement/towers. `legendary.js`: hill, soul lock and extraction.
