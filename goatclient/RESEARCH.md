# Foundation research

Inspected 2026-11-06 using public HTTPS Git access. Reference clones are outside
this project under `/workspace/references` and have not been modified.

| Reference | Revision | Finding |
| --- | --- | --- |
| [Wurst7](https://github.com/Wurst-Imperium/Wurst7) | `5667613769172e776267194bd90050b8052c7162` | Current properties target Minecraft 26.3 with Fabric; GPLv3. Not a 1.8.9 drop-in foundation. |
| [LiquidBounce legacy](https://github.com/CCBlueX/LiquidBounce/tree/legacy) | `03bc91a3c34031d1ea7400ef3b67c00adf6a4c6e` | Forge `1.8.9-11.15.1.2318-1.8.9`, stable_22 mappings, GPLv3; predominantly Kotlin, legacy branch discontinued. |
| Wurst-MC-1.8 | unavailable | GitHub refused access with a DMCA takedown notice; not used or fetched elsewhere. |

Reviewed Wurst's typed listener dispatch and snapshot iteration, LiquidBounce's
module registry, priority event hooks, key handling, file configuration abstraction
and Sprint settings/integration. The reusable architectural ideas are separate
module lifecycles, typed event integration, persisted settings and stable keybind
handling. Minecraft-specific method names and rendering cannot be copied across
versions unchanged.

LiquidBounce legacy is version-compatible but adopting it wholesale would inherit
Kotlin, account integrations, HTTP/Discord dependencies and modules outside this
prompt's scope. It has not been rebranded or selected as an implementation base.
The proposed Java route is an official Forge 1.8.9 MDK with a separate original
core. This differs from the preference to adapt an existing client: that decision
remains open pending a buildable, audited Java-compatible foundation. No claim is
made that this partial project is a completed fork.

ForceOP must be an honest permission display/admin action, never an exploit.
Remote operator assignment requires an authorised server-side command/service.
Fly, water walking, wall climbing and fall protection require either integrated
server implementation or declared server support; a client toggle alone cannot
guarantee authoritative movement or damage behaviour. Do not use anti-cheat
evasion or falsify support status.

The live dependency probes to `maven.minecraftforge.net`,
`libraries.minecraft.net` and `repo.spongepowered.org` returned proxy CONNECT 403.
GitHub and Maven Central downloads succeeded. No credential is needed for these
public dependencies; the unresolved prerequisite is destination access.

## Published-environment continuation

After the user published the environment, the configured Forge/Mojang hosts were
available. The official Forge 1.8.9 MDK was retrieved and a Java-only implementation
was built on Forge 11.15.1.2318 with stable_22 mappings. Legacy download URLs were
updated to Mojang's current HTTPS object endpoint with original hashes enforced.
Java 8/Gradle downloads were independently checksum-verified. The earlier network
blocker is resolved for this workflow. The supplied Wurst ZIP remains inaccessible
because it exceeds the attachment transfer tool's 32 MiB limit; no implementation
from it was reused. See the current README and verification report for results.
