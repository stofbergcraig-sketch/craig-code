# GoatClient 0.1.0 — Minecraft 1.8.9 Forge mod

## Downloads for Minecraft Launcher

- [Download the Minecraft 1.8.9 mod JAR](https://github.com/stofbergcraig-sketch/craig-code/blob/goatclient-0.1.0/goatclient/downloads/GoatClient-1.8.9-0.1.0.jar?raw=true)
- [Download the install ZIP with instructions](https://github.com/stofbergcraig-sketch/craig-code/blob/goatclient-0.1.0/goatclient/downloads/GoatClient-1.8.9-0.1.0-install.zip?raw=true)
- [Download the complete source ZIP](https://github.com/stofbergcraig-sketch/craig-code/blob/goatclient-0.1.0/goatclient/downloads/GoatClient-source-0.1.0.zip?raw=true)
- [Installation instructions](INSTALL.md) and [verification report](VERIFICATION.md).

Use **Forge 1.8.9 — 11.15.1.2318** and **64-bit Java 8**. Put the **JAR**, not
the ZIP, in your Forge profile's Game Directory under `mods/1.8.9/`. Launch that
Forge profile, enter a world, and press **Right Shift**. Modules start disabled.
If GitHub displays a file page, choose **Download raw file**. A private repository
requires signing into the GitHub account that can access it.

The files below are an experimental development build. The development game
launch and 69 runtime assertions passed; not all modules or a production launcher
launch are verified. See the report before relying on a feature.


An original Java utility mod with a custom main menu, dark category/search GUI,
keybinds, numerical setting controls, HUD, profile storage and named waypoints.
This is an **experimental build with partial functional verification**. It is not
claimed to be a perfected client or to have all 45 modules individually verified.

Read [INSTALL.md](INSTALL.md) for launcher installation and controls, and
[VERIFICATION.md](VERIFICATION.md) for exact checks and limitations.

## Install

Use **Minecraft 1.8.9 + Forge 11.15.1.2318 + 64-bit Java 8**. Place
`GoatClient-1.8.9-0.1.0.jar` in that Forge profile's Game Directory under
`mods/1.8.9/`. Enter a world, then press **Right Shift**. Modules start disabled.
The JAR is a Forge mod; it is not a standalone launcher or a replacement game JAR.
Normal launcher authentication remains with Minecraft's launcher.

## Module catalog

- Combat: Aim Assist, AutoClicker, TriggerBot, Criticals, AutoSword, Bow Assist,
  AutoBlock, Reach Display.
- Movement: Sprint, Sneak, AutoWalk, Step, SafeWalk, Parkour, BunnyHop, AutoJump,
  Jesus, Fly, Spider.
- Player: AutoTool, FastPlace, AutoEat, AutoFish, AutoRespawn, Inventory Cleaner,
  Chest Sorter, AutoArmor, NoFall.
- Render: Fullbright, Freecam, Tracers, ESP, Chest ESP, NameTags, HUD, Coordinates,
  Zoom, NoHurtCam.
- World: Ore Prospector, Nuker, Scaffold Preview, Timer Display, AutoMine,
  Waypoints, ForceOP.

That is **45 registered modules including one explicit alternative**: Ore
Prospector draws ore wireframes rather than hiding terrain like X-Ray. Registration
and compilation do not establish that all gameplay behavior works.

ForceOP uses only the owned integrated server's authorisation; it cannot grant
remote OP. Fly operates in owned singleplayer worlds or when a remote server
already grants flight. Step, Freecam, FastPlace, Ore Prospector, Nuker, Jesus,
NoFall and Spider are restricted to singleplayer. Other interactions use normal
Minecraft controller actions; server rules and game permissions still apply.
Combat target selection currently targets hostile mobs, not players. There are
no anti-cheat evasion modules or account/password collection code.

## Configuration

`/goat` lists commands. Profiles include module state, keybinds and numeric
settings and are saved under `goatclient/profiles/` in the Game Directory. The
selected profile loads on world entry; a loaded profile saves periodically and
before leaving a world. Invalid profiles are not silently overwritten by autosave.
A profile switch disables modules first so they can restore their owned state.
A valid profile whose enable callback fails is not rolled back transactionally.

`/goat waypoint add NAME`, `remove NAME`, and `list` manage the separate waypoint
file. This initial implementation shares waypoints across worlds, filtered only
by dimension; use distinct names per world. Profiles do not include waypoint
files. Inventory Cleaner currently drops only rotten flesh and does not yet have
customisable rules. AutoArmor compares base protection, not enchantment value.
Chest Sorter has not been verified with server latency. AutoFish uses a downward
bobber-motion heuristic and needs gameplay verification. The GUI has numeric bars
and module toggles but no mode dropdowns or independently draggable category windows.

## Build from source

Linux requires Python 3.12+ and a normal CA trust store. The build helper downloads
pinned Temurin Java 8 and Gradle archives, verifies their SHA-256, uses the inherited
proxy and (in cloud environments) trusts the session's public CA. It does not edit
cloud configuration or publish anything.

```sh
python3 tools/build.py setupDecompWorkspace
python3 tools/build.py clean build
```

Output: `build/libs/GoatClient-1.8.9-0.1.0.jar`.
In this cloud instance use `GOAT_TOOLCHAIN_DIR=/workspace/toolchains` to reuse the
verified existing downloads. The helper keeps dependencies in `.gradle-home/`.
Mojang client/server artifacts use the current official HTTPS endpoint with their
original manifest hashes enforced. `tools/fetch-assets.py` repairs ForgeGradle 2's
obsolete HTTP asset downloads over HTTPS and checks every index hash.

On Windows, install JDK 8, set `JAVA_HOME`, and run `gradlew.bat
setupDecompWorkspace build`. That Windows build path has not been tested here.
The bundled old Gradle wrapper does not itself enforce a distribution checksum;
use the verified Python bootstrap on Linux or independently verify the official
Gradle distribution when building elsewhere. ForgeGradle 2 is obsolete and emits
an unsupported-version warning; it is used for this legacy Minecraft target.

## Tests

Core checks (the standalone ECJ compiler requires a Java 17+ runtime; Forge itself uses the separate Java 8 toolchain):

```sh
bash tools/fetch-compiler.sh
bash tools/test-core.sh
```

The development-only runtime harness creates a disposable flat singleplayer
world, runs state/physics/configuration checks, writes `run/goat-runtime-smoke.txt`
and captures screenshots in `run/screenshots/`. It requires an X display and
working OpenGL (the cloud run used Xvfb and software rendering).

```sh
DISPLAY=:77 python3 tools/build.py -PgoatSmoke runClient
```

Require **both** a successful process exit and `GOAT_SMOKE_RESULT=PASS` in the
runtime output. A Minecraft process can shut down normally after a test failure,
so its exit status alone is insufficient. Do not distribute a smoke build: finish
with `python3 tools/build.py clean build`. Normal builds exclude `src/smoke/`.

## Source and licences

Original GoatClient implementation: GPL-3.0-only, see `LICENSE`. No Wurst or
LiquidBounce implementation code is incorporated. Their architecture/version
research is documented in `RESEARCH.md`. The supplied Wurst MC1.8 ZIP exceeded the
attachment tool's 32 MiB transfer limit, so it could not be inspected or reused.
This build does not establish compatibility with that archive.

Minecraft/game assets are not included in the source or release packages. Forge
and MCP are external development/runtime prerequisites, not relicensed GoatClient
code. The ECJ compiler is a build-only dependency (EPL-2.0); Temurin/OpenJDK and
Gradle retain their upstream licences. Neither credentials nor toolchain binaries
are included in the source ZIP.
