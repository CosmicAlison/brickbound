# First playable-art slice

This commit replaces the previous flat placeholder direction with **33 new, independent SVG masters** (not a sliced collage).

## Included
- Pyromancer: idle, aim, cast, hurt, victory, defeat poses.
- Skeleton: idle, windup, attack, hurt, death poses.
- Stone, Armor, Ember: intact, cracked, critical damage states.
- Six elemental projectiles; four environmental props.
- Whispering Woods layered background: far, mid, near.
- `preview/art-slice.html`: zero-dependency browser review page. Run `python -m http.server 8080` from repository root and open `http://localhost:8080/preview/art-slice.html`.

## Known limitations
This is an **art implementation candidate**, not finished production art. Pose states aren't timed animation frames; no sprite atlases, sound, particles or browser integration yet. The background and character layout is for visual QA, not proof of playable combat. SVG structure was checked; native-scale visual signoff is pending.

## Next action
Review preview at desktop and mobile widths; tune scale/silhouettes, add impact/break animation, then hook into the Phaser/Pixi/Canvas board.
