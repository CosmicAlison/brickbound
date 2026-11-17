# World 1 production pass / Rootheart prototype

Scope: first ten Mosswood Ruins levels and their boss, built on `feat/production-core-pass1`.

## Encounter sequence
| Stage | Introduced / reinforced mechanic |
|---|---|
| 1-01 | Drag-release launch; 3 one-hit stones; no enemy damage |
| 1-02 | Bank shots around paired towers |
| 1-03 | First explosive chain |
| 1-04 | Protected target; opening a lane |
| 1-05 | Elite guardian: higher HP and readable intent |
| 1-06 | Staggered ricochet routes |
| 1-07 | Treasure guard / softer reward level |
| 1-08 | Weak point among defensive bricks |
| 1-09 | Three-enemy priority target encounter |
| 1-10 | Rootheart; four root anchors, exposed heart, three HP phases |

## Rootheart rules
- Four special root bricks protect the boss, reducing incoming direct damage by 80%, floored at 0.5.
- Roots can be individually destroyed; the boss status line explicitly says when its heart is exposed.
- Health >70%: phase 1 root regrowth / thorn lash (2 HP).
- Health 35–70%: phase 2 heavier lash (3 HP), two-root regeneration.
- Health <=35%: phase 3 heart burst (4 HP) and board-push pressure.
- Phase transitions regenerate roots to force a fresh choice of angle. The existing Spore Queen illustration is a **temporary Rootheart visual**, not a final bespoke boss asset.

## Technical improvements
- Authored stage 1–10 brick grids bypass generic seed generation.
- One enemy-hit cooldown per ball removes repeat hits within the same overlap.
- Old saves with missing gear/permanentBoosts are migrated into defaults.
- Unit tests cover authored board coordinates, root anchors, phase thresholds.

## Validation status
- `node --check src/game.js` passed.
- `npm test` passed.
- Vite production build and real-device playtesting **not yet verified** in this environment; no dependencies available offline.
- Mechanics require further tuning by observed completion time and player funnel.
- No ad or analytics integration in this pass.