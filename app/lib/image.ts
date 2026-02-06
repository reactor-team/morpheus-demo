/**
 * Compute source crop region for a "cover fit" (like CSS object-fit: cover).
 * Returns the source rectangle {x, y, w, h} to draw from, so the source
 * fills the target dimensions without letterboxing.
 */
export function coverFit(
  sourceW: number,
  sourceH: number,
  targetW: number,
  targetH: number
): { x: number; y: number; w: number; h: number } {
  const sourceAspect = sourceW / sourceH;
  const targetAspect = targetW / targetH;

  let x = 0,
    y = 0,
    w = sourceW,
    h = sourceH;

  if (sourceAspect > targetAspect) {
    w = sourceH * targetAspect;
    x = (sourceW - w) / 2;
  } else {
    h = sourceW / targetAspect;
    y = (sourceH - h) / 2;
  }

  return { x, y, w, h };
}
