import { FIELD } from './field.ts';
import type { Vec2 } from './types.ts';

export const SVG_WIDTH_M = FIELD.widthM + 2 * FIELD.marginM;
export const VIEW_HEIGHT_M = FIELD.halfM + 2 * FIELD.marginM;

// Canonical (y-up, m) → SVG viewBox units (y-down, m).
// viewY: bottom edge of visible window in canonical meters.
// viewportH: height of visible window in meters (= VIEW_HEIGHT_M by default).
export function toScreen(p: Vec2, viewY: number, viewportH: number): Vec2 {
  return {
    x: p.x + FIELD.marginM,
    y: viewY + viewportH - p.y,
  };
}

// SVG viewBox units → canonical (inverse of toScreen).
export function fromScreen(svgPt: Vec2, viewY: number, viewportH: number): Vec2 {
  return {
    x: svgPt.x - FIELD.marginM,
    y: viewY + viewportH - svgPt.y,
  };
}
