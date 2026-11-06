# Install GoatClient 0.1.0 for Minecraft 1.8.9

This is a **Forge mod**, not a standalone launcher or a replacement Minecraft game
JAR. It requires your normal Minecraft Java Edition installation/account.

1. In the official Minecraft Launcher, install and launch vanilla **1.8.9** once,
   then close the game.
2. Install Forge **1.8.9 — 11.15.1.2318** using the installer from
   <https://files.minecraftforge.net/net/minecraftforge/forge/index_1.8.9.html>.
   Choose **Install client**, then select the Forge profile in the launcher.
3. Put `GoatClient-1.8.9-0.1.0.jar` in the Forge installation's
   `mods/1.8.9/` folder (create it if needed). If that installation uses a custom
   Game Directory, use its `mods/1.8.9/` folder.
4. Launch the Forge 1.8.9 profile. GoatClient should appear in **Mods**, and its
   main menu should replace the vanilla title screen.
5. Enter a test singleplayer world and press **Right Shift**. All modules start
   disabled. Left click a module to toggle it; right click to inspect it. Search
   searches all categories. Scroll the module list to reach more modules.

Use a **64-bit Java 8** runtime for this Forge version. Modern launcher runtimes
such as Java 21 are not interchangeable with Java 8 for this legacy setup.
Do not place the supplied Wurst MC1.8 ZIP in the mods folder alongside GoatClient;
that archive has not been inspected for compatibility.

Common game directories:

| System | Default directory |
| --- | --- |
| Windows | `%APPDATA%\.minecraft` |
| macOS | `~/Library/Application Support/minecraft` |
| Linux | `~/.minecraft` |

## Controls and settings

- Right Shift opens/closes the module menu. Escape also closes it.
- Drag the panel header to reposition it.
- Right click a module, then click its keybind label and press a key. Escape while
  binding clears that module's binding. Right Shift remains reserved for the GUI.
- Drag a numeric setting's bar to change it. Scroll over the settings area to
  reach additional settings on small screens.
- HUD X/Y settings use scaled GUI pixels. A lower GUI scale gives more space.
- `/goat profile save NAME` saves and selects a named profile.
- `/goat profile load NAME` loads a named profile.
- `/goat reset` disables modules and restores setting defaults.
- `/goat waypoint add NAME`, `/goat waypoint remove NAME`, `/goat waypoint list`.

Profiles and waypoints are stored under `goatclient/` in the active Game Directory.
Back up that folder before installing an update. Waypoints currently share one
list across worlds and are filtered only by dimension; use distinct names per world.

## Limits of this release

Read `VERIFICATION.md` before relying on a feature. This is an experimental
development build with partial gameplay verification, not a fully tested release.
Several movement/world changes operate only in singleplayer. Fly on a remote
server requires server-granted flight. ForceOP acts only on your owned integrated
server; it cannot grant permissions on a remote server. Ore Prospector is the
documented alternative to terrain-hiding X-Ray. NoFall does not prevent remote
server damage. Modules do not include anti-cheat evasion.

To uninstall, close Minecraft and remove the GoatClient JAR. Your saves remain in
Minecraft's normal saves directory and GoatClient configuration remains in its
own folder.
