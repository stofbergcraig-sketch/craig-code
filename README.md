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
| F | Purchase a nearby dormant structure; otherwise weapon special (hold/release for Excalibur) |
| B | Inspect and upgrade placed towers |
| Mouse wheel | Cycle unlocked weapons |
| R | Reload; reserve ammunition is unlimited |
| T | Plant a purchased thorn engine |
| E near amber forge | Shop |
| Escape | Pause and release the mouse |

Sensitivity, volume, graphics and camera shake are adjustable in Settings. Click Resume to capture the mouse again. Low quality reduces render resolution, active goblins, particles and corpses.

The play HUD is deliberately minimal: kills, Shekkles, health, current weapon (with a small magazine count for guns), and a discreet Excalibur soul counter. Controls, region, lifetime earnings, trap/dash readiness and special-ability details are under **Escape → Progress & abilities / Controls**. Charging Excalibur brightens the crosshair. Kill rewards briefly tint the Shekkle counter and combine into one small reward line. Notifications replace one another rather than stacking.

## Terrain update

The same districts and routes now sit in a sampled landscape: rolling ridges, a shallow southwestern basin, a sunken Gravewood, a three-metre camp plateau and a five-metre keep terrace. Existing buildings keep level foundations; broad slopes connect them. Rocky shelves mark several ridges without blocking the main lanes. Oath Hill and its original sword remain on the southern causeway.

One 192×192 heightfield supplies the rendered ground and the same height samples used by player movement, goblin spawns/fleeing, corpses, particles, tower foundations and projectiles. Paths follow the ground. Bullets and magic cannot pass through a ridge. Towers can be placed on gentle elevated ground but reject steep footprints. Existing tower purchases/levels are retained; a tower obstructed by a new rock landmark searches a nearby clear position rather than losing the purchase.

## Targeted pursuit, purchasing and impact fixes

The current flee speeds are now **5.625 / 5.895 / 5.355m/s** (normal/runner/brute), a further40% cut from the previously shipped9.375 / 9.825 / 8.925 values. Separation was adding velocity after speed selection: a matched70-goblin test measured the old implementation peaking near17.86m/s. Final voluntary movement is now capped after steering/separation, so detection and crowding cannot boost running speed. Physical knockback remains separate. Player walking10.5 and sprinting15 are unchanged.

**Walk up to a dormant structure and press F.** The first bolt turret purchase point is about14m left of the starting position, at(-14,12). It shows **[F] Purchase Turret — 5,000 Shekkles** within4.8m. Insufficient funds leave everything unchanged. A successful purchase activates the existing tower model immediately, saves its purchase-point ID and charges once. Holding F does not repeat-buy. Purchase interaction takes precedence over weapon specials. After purchase, E inspects/upgrades the tower and F resumes its normal weapon-special role. Existing forge/menu placement remains available.

Other dormant structures use the same system: wizard and frost points in the courtyard, ballista at Splinter Camp, storm tower in Gravewood, Soulforge in the keep and spire in the Witchward. Sites can shift slightly to a clear nearby location. Dormant towers do not fire or award rewards. Normal bolts now lead moving targets rather than firing only at their old positions.

Every genuine enemy death still goes through its individual guarded death callback. Nonlethal hits, corpse hits and despawns award nothing. Same-frame group kills are tested at1/5/10/20/50/100 enemies, including ten from one melee cone and the Excalibur/victory thresholds. The HUD now combines recent kills into one small **+10 Shekkles | 10 Goblins Defeated** line instead of separate popups.

Weapon wind-up/contact/recovery uses smooth curves shared with damage timing; sprint/slide pose changes and reload easing are blended. Earthbreaker applies its damage/effects when its hammer animation reaches contact. Ground hits, hammer shockwaves, air slams and Earthbreaker leave dark branching cracks that fade after about1.8 simulated seconds. These are cosmetic decals, not permanent terrain deformation; at most eight exist and their GPU resources are disposed when they expire.

## Highlands and balance update

The playable dimensions are now315×315m, up from210×210m: exactly1.5× per axis (2.25× area). Original districts stay at their original coordinates. New surroundings include the Ashen March ruins, Broken Crown Ridge arches, Witchward standing stones, scattered woods and southern highlands. Terrain sample spacing remains1.75m, and live enemy caps remain200/400/650. Nearby spawning favours underpopulated sectors; soft inward steering turns goblins away from edges before they reach the boundary.

All purchasable weapon prices are reduced20%: axe64, shotgun96, Bellbreaker176, repeater480, Gravehook2,400, Gravebreaker6,000, Eclipse Sigil12,000, Ruin Covenant2,400 Shekkles. Existing tower and ordinary upgrade prices are unchanged. Excalibur is never purchasable. Existing saves, purchases and earnings are retained; there is no automatic refund for previous purchases.

Oversized foreground swords, axe and hammers are scaled to80% of their previous visual size, with a slight lower/right offset. Fists, guns, Gravehook and the Sigil keep their scales. Damage, reach and animations remain unchanged. Goblin death particles are crimson for every variant; frost magic remains blue and other spell colours remain distinct.

Oath Hill is now a30m-high mountain with a marked318.7m winding route beginning at the old(18,60) entrance. A normal walk using the actual Player code reaches the sword interaction zone in about29.9 simulated seconds on the real map. Sprinting, sliding, dashes and jumps remain available and can shorten the trip. Natural steep rock grades discourage simply walking straight up the mountain; there is no forced climbing animation or speed penalty. The20,000-kill lock and brief extraction remain unchanged.

The mandated25% reduction makes every straight-line fleeing speed lower than walking speed. Long unobstructed walking pursuits can now catch up, while turning, obstacles and initial distance still make sprinting the practical choice. The player sprint speed was not changed.

## Progression

Start with **100,000 Shekkles** to buy weapons, upgrades and towers immediately. Existing saves receive a **one-time top-up to at least 100,000**, preserving kills and purchases; balances already above that stay intact. Spending is saved normally, so reloading does not refill the grant. This gift awards no kills or lifetime earnings. Goblin attacks cannot damage or kill you in the current power-fantasy balance.

Both guns now carry **three times their previous magazine size**: Gravelmouth holds 24 shells and The Argument 96 rounds. Deep Pockets adds 6/24 per rank, up to 48/192 at maximum rank; reserve ammunition remains unlimited. Reload timing, recoil and animations are preserved. Starting crowds aim for 140 actual goblins instead of 52 and replenish faster, growing with genuine kills while respecting the existing quality caps.

Begin with fists and Rustbite. All other ordinary weapons are permanently purchased at the amber forge to the left of the starting courtyard. There are **no ordinary world weapon pickups**. Every defeated goblin earns exactly one kill and **one Shekkle**. Explosive barrels, collisions, slam attacks, magic, traps and towers all use that same guarded death-credit path. Distant despawns grant nothing. Goblins flee at normal5.625m/s, runner5.895, brute5.355 after the latest correction. Walking stays10.5 and sprinting15; sprint pursuit closes much faster. At close range they hesitate and periodically stumble. Stable heading selection avoids nearby obstacles and map edges; panic spreads to nearby goblins.

Buy knockback, damage and magazine upgrades; plant thorn engines with T. Higher trap ranks improve radius, damage, cooldown and lifetime. Bellbreaker clears crowds; the Ruin Covenant turns its shockwave into a 23-metre attack. Enemy density increases with progress. Explore the preserved Gravewood, Splinter Camp, Hollow Keep and old causeway; three hidden caches award one-time Shekkles, never fictitious kills.

New weapons: **Gravehook** (2,400 Shekkles) slashes quickly; F launches a visible chain-hook that pulls a goblin closer. **Gravebreaker** (6,000) delivers heavy sweeps; F unleashes Earthbreaker, a 22m blast on a 7-second cooldown. **Eclipse Sigil** (12,000) launches spinning rune-discs with occasional ricochets; F sends a seeking volley on a 5-second cooldown. **Excalibur** is exclusive to Oath Hill, the expanded southern mountain reached from the original trail entrance at map(18,60). Follow stone markers and blue torches to its summit near(65,105). It requires 20,000 lifetime kills, regardless of current Shekkles. Press E at the stone to claim it in a brief extraction sequence. Its F attack charges a short-range magical wave. It cannot be bought. All weapons have model previews and stats in the shop/arsenal; new melee combo poses have wind-up, contact and follow-through, with damage delayed to their contact phase.

Defences: Wooden Bolt Turret (5,000), Arcane Wizard Tower (12,500), Cursed Ballista (25,000), Stormcaller Tower (50,000), Obsidian Death Spire (100,000). Choose one at the forge, leave the shop and aim its ground preview. Green = valid; red = blocked. Click to place, right-click or Escape to cancel. Currency is deducted only on successful placement. Place on level or gently sloping ground, away from walls, shops, Oath Hill and other structures. The preview follows the terrain. There is a 16-tower cap. B opens the inspection/upgrade menu; E beside a tower also opens it. Levels 2 and 3 improve fire rate, range and damage, adding visible runes and a crown. Positions and levels persist across sessions. The Frostbound Watchtower (35,000) adds icy seekers and slowing pulses; level2 improves projectile speed and slow strength, level3 expands the pulse. The Soulforge Obelisk (75,000) floats within rotating rings, fires2/4/6 independent beams by rank, and periodically releases a crimson area pulse. Towers use the same enemy damage/death path as weapons; bolts pierce, orbs explode, and storm attacks chain between targets. Projectiles use a fixed 96-object pool.

Cornered goblins still animate their attacks, but those attacks cause no damage or death. The original health, regeneration and respawn systems remain available for future balancing. At 150,000 genuine kills the ending appears, and you can continue playing.

The original **45–60 active-minute** completion target remains a tuning estimate, **not a measured full playthrough**, and the chase loop may lengthen it. That window requires 55.6–41.7 kills/second. Late medium-quality spawning can replenish up to 110 real enemies/second, high 150, low 80, subject to clear spawn locations and the live cap. Large hammer blasts, Excalibur waves, traps and tower coverage provide repeatable crowd clearing. Actual completion depends on exploration, pursuit, purchases and hardware. There are never 150,000 active entities: caps remain 200/400/650. A short mixed-weapon playtest does not establish the full-run completion time.

## Saves and backups

Autosaves retain the original localStorage key `mirebreak.goblin-debt.v1`. Schema version 2 migrates old kills, balances, purchases and upgrades automatically. Kills, current Shekkles, lifetime Shekkles earned, equipped weapon, Excalibur ownership, tower positions/levels, found caches and settings persist. Legacy lifetime earnings initialize from kills because old saves did not track spending history. Internally `coins` remains the balance field for migration compatibility; the UI calls it Shekkles. Position, health and temporary thorn engines reset on a new session. Saves belong to that browser/profile/device and web origin. Keep using the same localhost address and port when updating, and export a backup first. Settings provides Export/Import and confirmed Reset. Blocked storage does not stop play; malformed backups do not overwrite valid progress.

## Development and validation

`npm test` runs gameplay, migration, fleeing/sprint balance, soul-gate, tower, projectile, placement, storage and exactly-once reward tests. `npm run build` makes `dist/`. With the development server running on port5173, `node tests/browser.mjs` exercises the preserved game loop and `node tests/expansion-browser.mjs` exercises the expansion. The cloud scripts use `/usr/bin/chromium` and software WebGL; expansion tests accept a CHROMIUM_PATH override. Browser diagnostics are exposed **only** with `?test=1` under the development server, and stripped from production. Victory testing starts a development save at149,999 and defeats a real spawned goblin. Production play has no kill-award shortcut.

All art, textures, map geometry, character designs, weapon models and audio are generated in the project. Three.js (MIT) and Vite (MIT) are open-source dependencies; see their installed license files. No reference-game assets or code are included.

Current scope: simple crowd steering and stylized tumbling deaths, not full skeletal ragdolls or navigation meshes. No wall-jump, executions, multiplayer, controller support or aim-down-sights. Windows hardware performance and a full 150,000-kill human playthrough have not been measured in this Linux cloud environment.

## Files

`player.js`: movement/collision. `enemies.js`: pooled fleeing crowds, damage and death. `world.js`: preserved districts and procedural art. `terrain.js`: sampled landscape and shared height/ray queries. `weapons.js`: animated models and previews. `audio.js`: synthesized effects. `progression.js`: currency, purchases and saves. `ui.js`/`style.css`/`hud.css`: menus/minimal HUD. `main.js`: integration/combat/abilities. `effects.js`: capped particles/shockwaves. `arcana.js`: pooled projectiles and targeting. `defences.js`: placement/towers. `legendary.js`: hill, soul lock and extraction.
