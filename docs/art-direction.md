# Brickbound — art direction v0.2

Status: **approved direction for a production trial, NOT approved final sprites**.

## Intent
Hand-crafted fantasy arcade, not glossy mobile-gacha UI. The latest two illustrative contact sheets are visual references only; their embedded text and colored backgrounds must never ship as character sprites.

## Camera and graphic rules
- Flat front-facing combat board. Character sprites in 3/4 view facing center; side-to-side reads must remain consistent.
- Materials: 3 tonal planes per surface, selective 1–2 px accent edges, no full-scene bloom, no plastic bevels.
- Hero silhouette: large bent pointed hat, asymmetric cloak, flame-tipped wand. At 64 px tall all three must separate.
- Enemy silhouettes: skeleton thin angular, slime squat rounded, wisp floating tapered, guardian wide rectangular, spore mushroom cap, bat spread wings.
- Bosses: minimum 2.2× standard enemy silhouette; maintain core weak-point with strong shape+light contrast.
- Brick faces: 96×52 source, common 4 px rim/border and consistent damage hotspot. Gameplay IDs never encoded in baked art.
- Light from upper-left, muted cool ambient shadow, warm magical rim only for fire/loot.
- Battle arena center kept visually quiet (low detail and saturation). Decoration confined to side gutters and rear corners.

## Palette
| Role | Hex |
|--|--|
| Ink / deep dungeon | #182232 |
| Slate surfaces | #253145 |
| Stone | #737B83 |
| Parchment text | #E6D4B1 |
| Antique gold interactive | #D9B47E |
| Fire | #C8785F |
| Ice | #91BDC9 |
| Poison | #86AC9B |
| Arcane | #9385AA |
| Danger | #C27A70 |

Avoid 100% white UI highlights, glossy full-card gradients, neon-purple glows, and independent lighting directions.

## Typography
- Display: a separately licensed/angular serif with distinctive wedges, used for brand, worlds and bosses only.
- Game controls: humanist sans with robust numerals at small sizes. Keep all gameplay words DOM/canvas text, NEVER rasterize in artwork.
- Test 200% text scaling, 4.5:1 contrast, and German +30% strings before final lock.
- Font selection remains pending licensing; do not bundle copyrighted font files.

## Export contract (web)
- Original editable master as SVG or layered editable source; optimized raster derivative as WebP/PNG with genuine transparency.
- Frame padding 4px and extruded edge 2px when atlas-packed.
- Hero source canvas 256×320, pivot bottom-center (128,300).
- Standard enemy source 192×160, pivot bottom-center (96,148).
- Boss source 384×320, pivot bottom-center (192,296).
- Brick source 192×104, centered pivot, collision shape separate.
- Ball source 64×64, centered pivot; collision radius engine-defined.
- Background 1280×720, separately exported far/mid/near layers; no gameplay bricks baked into backdrop.
- UI artwork 9-slice where appropriate. Label/value/interactive state is runtime.
- Keep main interaction elements within safe inset 32px desktop / device safe-area mobile.
- Preview at 1280×720, 360×640 and 1080×2340. Assess native-scale silhouette, not just zoomed sheets.

## Quality gates
1. Real alpha, no checkerboard matte or dark halo; premultiplication policy explicit.
2. Stable light, palette, camera, proportions and baseline across frames.
3. Native-scale silhouette readable and collision cues unambiguous.
4. Sprite atlas trim/anchors and animation playbacks pass visual QA.
5. Compression and browser memory verified; no font or license omissions.
6. Final production-ready requires a screen capture from running browser renderer, not only concept sheet.
