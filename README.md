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
| Mouse wheel | Cycle unlocked weapons |
| R | Reload; reserve ammunition is unlimited |
| T | Plant a purchased thorn engine |
| E near amber forge | Shop |
| Escape | Pause and release the mouse |

Sensitivity, volume, graphics and camera shake are adjustable in Settings. Click Resume to capture the mouse again. Low quality reduces render resolution, active goblins, particles and corpses.

## Progression

Begin with fists and Rustbite. Find floating weapon relics on the routes west, east and toward the keep, or spend brass at the amber forge to the left of the starting courtyard. Each defeated goblin earns exactly one kill and one brass. Explosive barrels, collisions, slam attacks and traps share that same guarded death-credit path. Distant despawns grant nothing.

Buy knockback, damage and magazine upgrades; plant thorn engines with T. Higher trap ranks improve radius, damage, cooldown and lifetime. Bellbreaker clears crowds; the Ruin Covenant turns its shockwave into a 23-metre attack. Enemy density increases with progress. Explore Gravewood, Splinter Camp, the Hollow Keep and the old causeway; three hidden treasure chests award brass, never fictitious kills.

Health regenerates after four seconds without damage; kills restore a little health. Death costs 10% of current brass, preserving kills and purchases. Respawn returns you to the courtyard. At 150,000 kills the ending appears, and you can continue playing.

The intended completion window is **45–60 active minutes across sessions**, an estimate rather than a measured full playthrough: 150000 / (45×60) = 55.6 kills/second, or 41.7 for 60 minutes. Early unlocks take the first few minutes; late medium-quality spawning can replenish 90 real enemies/second, high 120, low 60. A 23m hammer blast and several overlapping traps are designed to sustain that pace. Actual completion depends heavily on time exploring, upgrade choices and performance; low quality or casual play can take longer. There are never 150,000 active entities: caps are 200/400/650.

## Saves and backups

Autosaves use browser localStorage under `mirebreak.goblin-debt.v1`. Kills, brass, purchases, found secrets and settings persist; position, health and deployed traps reset on a new session. Saves belong to that browser/profile/device and web origin. Private browsing or clearing site data can erase them. Settings provides Export and Import backup files and a confirmed Reset. If local storage is blocked the game keeps running and warns you to export. Malformed backups do not replace valid progress.

## Development and validation

`npm test` runs the movement, collision, progression, storage and kill-credit tests. `npm run build` makes `dist/`. `node tests/browser.mjs` runs integration checks against an already running development server; this environment's script expects `/usr/bin/chromium` and uses software WebGL. It exercises pointer lock, keyboard, melee, purchases, reloads, traps, pause, settings, persistence and the ending. Browser diagnostics are exposed **only** by the Vite development server with `?test=1`; the production build strips them. Victory testing sets a development save to 149,999, then defeats a spawned goblin through the real damage path.

All art, textures, map geometry, character designs, weapon models and audio are generated in the project. Three.js (MIT) and Vite (MIT) are open-source dependencies; see their installed license files. No reference-game assets or code are included.

Current scope: simple crowd steering and stylized tumbling deaths, not full skeletal ragdolls or navigation meshes. No wall-jump, executions, multiplayer, controller support or aim-down-sights. Windows hardware performance and a full 150,000-kill human playthrough have not been measured in this Linux cloud environment.

## Files

`player.js`: movement/collision. `enemies.js`: pooled crowds, damage and death. `world.js`: districts and procedural art. `weapons.js`: animated first-person models. `audio.js`: synthesized effects. `progression.js`: purchases and saves. `ui.js`/`style.css`: menus and HUD. `main.js`: integration, combat, traps and exploration. `effects.js`: capped particles and shockwaves.
