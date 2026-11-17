/** Determine a sharp backing store for a fixed-coordinate Canvas2D game.
 * Keep the gameplay coordinate system unchanged while matching physical display pixels.
 * A capped DPR and pixel budget prevent excessive allocations on unusual displays.
 */
export function computeCanvasResolution({ cssWidth, cssHeight, logicalWidth = 420, logicalHeight = 610, devicePixelRatio = 1 }) {
  const dpr = Math.min(3, Math.max(1, Number(devicePixelRatio) || 1));
  const widthCss = Math.max(1, Number(cssWidth) || logicalWidth);
  const heightCss = Math.max(1, Number(cssHeight) || logicalHeight);
  let width = Math.max(1, Math.round(widthCss * dpr));
  let height = Math.max(1, Math.round(heightCss * dpr));
  const maxPixels = 4096 * 1024;
  if (width * height > maxPixels) {
    const ratio = Math.sqrt(maxPixels / (width * height));
    width = Math.max(1, Math.floor(width * ratio));
    height = Math.max(1, Math.floor(height * ratio));
  }
  return {
    width,
    height,
    scaleX: width / logicalWidth,
    scaleY: height / logicalHeight
  };
}
