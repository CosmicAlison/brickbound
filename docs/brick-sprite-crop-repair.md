# Brick sprite crop repair

The existing eight brick assets were incorrectly cut out from the original artwork sheet: several were cropped through the outer rim or captured partial adjacent art. This patch replaces the eight WebPs in `public/assets/bricks/` with direct re-extractions of the original top row, preserving the approved painted style.

## Extraction rules
- Original source: `colourful_cartoon_game_asset_sheet.png` (1672×941 RGBA concept sheet, transparent)
- Each slot isolated within its own horizontal interval from the first row
- Alpha bounds detected with a modest threshold, expanded by 2–3 px to retain anti-aliased edges
- Exported onto identical **224×176** transparent canvases, centered without rescaling source pixels
- WebP quality 96 with alpha preserved

## Files
`stone`, `armor`, `mirror`, `ember`, `crystal`, `curse`, `portal`, `treasure`.

## Integration notes
- Existing runtime paths remain unchanged.
- CSS/canvas layout uses its existing brick hitbox and sprite draw dimensions; only the WebPs are replaced.
- Uniform transparent padding reduces uneven crop framing, but source-art review at mobile combat scale is still required.
- No procedural changes to enemy AI, projectiles, damage, progression, or purchases.
