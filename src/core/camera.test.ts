import { describe, expect, it } from 'vitest';
import { FIELD } from './field.ts';
import { VIEW_HEIGHT_M, toScreen } from './camera.ts';

const VH = VIEW_HEIGHT_M;

describe('VIEW_HEIGHT_M', () => {
  it('equals halfM + 2 * marginM', () => {
    expect(VH).toBe(FIELD.halfM + 2 * FIELD.marginM);
    expect(VH).toBe(34);
  });
});

describe('toScreen', () => {
  it('canonical origin maps to SVG bottom-left of field area', () => {
    const r = toScreen({ x: 0, y: 0 }, 0, VH);
    expect(r.x).toBe(2);
    expect(r.y).toBe(34);
  });

  it('viewport center maps correctly', () => {
    const r = toScreen({ x: 20, y: 17 }, 0, VH);
    expect(r.x).toBe(22);
    expect(r.y).toBe(17);
  });

  it('top-right corner of default viewport', () => {
    const r = toScreen({ x: 40, y: 34 }, 0, VH);
    expect(r.x).toBe(42);
    expect(r.y).toBe(0);
  });

  it('left margin edge → svgX = 0', () => {
    const r = toScreen({ x: -FIELD.marginM, y: 17 }, 0, VH);
    expect(r.x).toBe(0);
  });

  it('right margin edge → svgX = 44', () => {
    const r = toScreen({ x: FIELD.widthM + FIELD.marginM, y: 17 }, 0, VH);
    expect(r.x).toBe(44);
  });

  it('scrolled view: viewY=-2 shifts y by -2', () => {
    // canonical y=0 is 2m above the window bottom (viewY=-2), so svgY = -2+34-0 = 32
    const r = toScreen({ x: 0, y: 0 }, -FIELD.marginM, VH);
    expect(r.x).toBe(2);
    expect(r.y).toBe(32);
  });

  it('distance is preserved (toScreen is an isometry)', () => {
    const p1 = { x: 5, y: 3 };
    const p2 = { x: 12, y: 8 };
    const expectedDist = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
    const s1 = toScreen(p1, 0, VH);
    const s2 = toScreen(p2, 0, VH);
    const screenDist = Math.sqrt((s2.x - s1.x) ** 2 + (s2.y - s1.y) ** 2);
    expect(screenDist).toBeCloseTo(expectedDist, 10);
  });
});
