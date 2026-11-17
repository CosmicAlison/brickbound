# Asset quality notes
The original generated asset compendium and sprite sheets are **concept art grids**, not cleanly separated production sprite sheets. Some extraction boxes were estimated and accidentally included narrow vertical fragments of adjacent objects or clipped the intended object.

## Confirmed in the sprite contact-sheet inspection
- `bricks/curse.webp`: a thin adjacent brick strip remains on the right
- `bricks/ember.webp`: stray neighboring strips at sheet boundaries
- `bricks/portal.webp`: a bright gold neighboring edge is visible on the right
- `bricks/armor.webp`: neighboring content is present along the left edge
- `bricks/mirror.webp`: part of the adjacent sprite is visible along the left edge
- `bricks/stone.webp`: cropped tightly into the right-facing stone edge
- Some hero / enemy cutouts similarly include fragments, demonstrating this was an extraction workflow issue rather than only mobile display scaling.

Do **not** fix this by increasing DPR, stretching, or indiscriminately upscaling the existing crop. Re-slice using validated object boundaries (or isolate each brick anew from the original concept), normalize to a common transparent canvas with clean alpha edges, and inspect each brick against light and dark backgrounds. Keep collision bounds independent of transparent padding. Only approve replacements after an actual in-game render at desktop and phone sizes.

The high-DPI canvas rendering fix improves presentation sharpness but cannot reconstruct missing source pixels or remove contamination from the cropped artwork.
