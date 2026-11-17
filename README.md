# BRICKBOUND: Dungeon Volley — Web vertical slice

Original illustrated raster art, extracted into separate WebP files. A browser-first vertical slice using Canvas + HTML/CSS, backed by `levels.json` (60 authored levels). Runs without accounts or backend.

## Run

```bash
npm install
npm run dev
```

Open the URL Vite prints. For production: `npm run build`; upload `dist/` to a static host such as Cloudflare Pages.

## Current feature coverage
- Home, map, stage selection, hero & gear, shop, settings, pause, upgrade choice, victory, defeat.
- 60 stages read from existing design JSON; 6 world cards, boss every tenth level.
- Aimed volleys with wall bounces, multi-ball spawning, damageable bricks, destructible enemy hitboxes, enemy turn retaliation, HP, level rewards and local save.
- 59 raster art entries, including 6 hero poses, 6 enemy sprites, 4 bosses, 8 brick materials, 6 elements, 6 effect sprites, 4 arenas, 13 UI slices and scenery props.

## Not production-complete
- This is an alpha: gameplay balance, boss mechanics, special brick interactions, animation strips, world 4–6 illustrated arenas, sound, monetization SDK, complete equipment system and accessibility QA are not yet finished.
- Art is carefully cropped from generated sheets, but **not** approved frame-by-frame by an artist. Some sprites may contain neighboring elements or edge contamination. Inspect visually before shipping.
- Portal ads are not wired. Never pay out an ad reward until the portal SDK verifies completion.
- This intentionally has no required login and no forced ads.
