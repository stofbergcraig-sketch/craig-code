# Expansion validation

## Minimal HUD and varied terrain update

- All17 named code-level scenarios pass (4 core, 7 expansion, 6 terrain). Terrain checks cover sampled mesh heights, bounded slopes, sprint/dash/slide/jump/landing on grades, elevated and sunken goblin navigation, ridge ray obstruction, raised tower placement and preserving upgrades when a saved tower needs a nearby clear spot.
- `tests/terrain-browser.mjs` passes: no always-visible controls/ability rows/streak/earnings text, working pause progress, actual-map sprint from near0m to the3m camp plateau without losing ground contact, grounded barrels/caches, raised tower placement and reload restoration. Screenshots inspected from the camp approach and the southwestern valley.
- Original, expansion and special-ability browser suites pass after the terrain/UI changes, including the150,000-kill ending and confirmed reset. Excalibur charging now uses a visual crosshair cue; detailed readiness text is in pause progress.
- The updated16-tower/200-goblin fixed-step actual-map simulation passes: max9 active projectiles, max432 particles,357 genuine kills over19.2 simulated seconds, all enemy transforms finite, about1.42ms CPU/update. This is a simulation sample, not a rendered FPS or memory endurance claim.
- Remaining practical limits: local obstacle steering rather than global pathfinding, tower placement on gentle ground only, simplified ragdolls. Windows GPU performance, extended-session testing and a full human playthrough are not verified in this Linux cloud.

The preceding expansion results below describe the prior validation baseline.

Validated in the Linux cloud with Node 24 and Chromium software WebGL. These results do not establish a Windows laptop frame rate or a full-session completion time.

- Four preserved core scenarios passed: saves/purchases/settings/reset, exact victory threshold/storage failure, exactly-once enemy credit/wall obstruction, movement/jumps/dash/slide/collision.
- Seven expansion scenarios passed: v1 migration/equipped weapon persistence, non-purchasable lifetime-kill Excalibur lock, walk-versus-sprint pursuit, safe placement, autonomous kills and rewards for all five tower types with upgrade persistence, projectile obstruction/hit callbacks, traversable hill/no goblin spawns inside it.
- Original browser pass succeeded: launch, pointer lock, keyboard, pursuit/slash, purchases, gun reloads, traps, Escape, settings, reload persistence, 200-goblin low-quality simulation, ending, confirmed reset and new-game respawns. That crowd sample averaged about 2.95ms CPU simulation/update; it is not a rendered FPS measurement.
- Expansion browser pass succeeded: arsenal and model previews, new purchases, green placement/cost, tower upgrades, real tower projectile kill rewards, Eclipse F input, 19,999-kill denial, 20,000-kill extraction, equipped Excalibur and upgraded tower restoration after reload.
- Ability browser pass succeeded using actual F input: Gravehook pulls a surviving target, Gravebreaker defeats a target, Eclipse volley defeats a target, Excalibur requires a held charge then defeats a target. Real pooled-projectile collisions are exercised.
- A 19.2-second fixed-step actual-map simulation with sixteen mixed towers passed: 200 live goblins, maximum15 active projectiles, maximum249 particles, 190 genuine kills, all transforms finite, about1.77ms CPU per simulation update. This verifies bounded workload, not long-session GPU or memory performance.
- Production build passes. Its bundle does not contain `__MIREBREAK__` development diagnostics. `git diff --check` passes.

Run the development server at port5173 before browser scripts. Run browser scripts sequentially and avoid changing imported source during them (Vite reloads pages when source changes). They use isolated browser contexts and development-only diagnostics, preserving normal user saves. Use `node tests/core.test.js` and `node tests/expansion.test.js` for detailed named assertion output. Use `node tests/browser.mjs`, `node tests/expansion-browser.mjs`, `node tests/abilities-browser.mjs`, and `node tests/performance-browser.mjs` for browser validation. The performance script runs a fixed-step actual-map simulation with sixteen mixed towers; this is bounded-load validation, not a long-duration memory or GPU benchmark.

Known practical limits: steering uses scored local clearance rather than a navigation mesh; crowded corners can still bunch goblins briefly. Tower capacity is sixteen, projectile capacity96, enemy capacities200/400/650. Placement is flat-ground only. Tower arrows turn at firing time rather than continuously tracking. Physics is stylized knockback/tumbling, not full skeletal ragdolls. Excalibur extraction is a short scripted focus and lift, not a hand-authored cinematic. Long-session memory behavior, subjective audio quality on real speakers, Windows GPU performance and a full 150,000-kill human playthrough remain for in-game evaluation.
