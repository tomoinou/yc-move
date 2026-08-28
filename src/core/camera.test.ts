import { describe, expect, it } from 'vitest';
import { FIELD } from './field.ts';
import { VIEW_HEIGHT_M, toScreen, fromScreen } from './camera.ts';
import type { Vec2 } from './types.ts';

const VH = VIEW_HEIGHT_M; // 30 + 2*1 = 32

describe('VIEW_HEIGHT_M', () => {
  it('equals halfM + 2 * marginM', () => {
    expect(VH).toBe(FIELD.halfM + 2 * FIELD.marginM);
    expect(VH).toBe(32);
  });
});

describe('toScreen', () => {
  it('canonical origin maps to SVG bottom-left of field area', () => {
    const r = toScreen({ x: 0, y: 0 }, 0, VH);
    expect(r.x).toBe(1);
    expect(r.y).toBe(32);
  });

  it('viewport center maps correctly', () => {
    const r = toScreen({ x: 20, y: 16 }, 0, VH);
    expect(r.x).toBe(21);
    expect(r.y).toBe(16);
  });

  it('top-right corner of default viewport', () => {
    const r = toScreen({ x: 40, y: 32 }, 0, VH);
    expect(r.x).toBe(41);
    expect(r.y).toBe(0);
  });

  it('left margin edge → svgX = 0', () => {
    const r = toScreen({ x: -FIELD.marginM, y: 16 }, 0, VH);
    expect(r.x).toBe(0);
  });

  it('right margin edge → svgX = SVG_WIDTH_M', () => {
    const r = toScreen({ x: FIELD.widthM + FIELD.marginM, y: 16 }, 0, VH);
    expect(r.x).toBe(42);
  });

  it('scrolled view: viewY=-marginM shifts y by -marginM', () => {
    // canonical y=0 is marginM above the window bottom (viewY=-marginM)
    const r = toScreen({ x: 0, y: 0 }, -FIELD.marginM, VH);
    expect(r.x).toBe(1);
    expect(r.y).toBe(31);
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

describe('fromScreen', () => {
  const cases: Vec2[] = [
    { x: 0, y: 0 },
    { x: 20, y: 15 },
    { x: FIELD.widthM, y: FIELD.halfM },
    { x: -FIELD.marginM, y: -FIELD.marginM },
  ];

  it('is the inverse of toScreen (roundtrip)', () => {
    const vy = -FIELD.marginM;
    for (const p of cases) {
      const back = fromScreen(toScreen(p, vy, VH), vy, VH);
      expect(back.x).toBeCloseTo(p.x, 10);
      expect(back.y).toBeCloseTo(p.y, 10);
    }
  });

  it('toScreen is the inverse of fromScreen (roundtrip)', () => {
    const vy = 10;
    const svgPoints: Vec2[] = [
      { x: 1, y: 32 },
      { x: 21, y: 16 },
      { x: 41, y: 0 },
    ];
    for (const s of svgPoints) {
      const back = toScreen(fromScreen(s, vy, VH), vy, VH);
      expect(back.x).toBeCloseTo(s.x, 10);
      expect(back.y).toBeCloseTo(s.y, 10);
    }
  });

  it('scrolled view roundtrip', () => {
    const vy = 20;
    const p = { x: 15, y: 25 };
    const back = fromScreen(toScreen(p, vy, VH), vy, VH);
    expect(back.x).toBeCloseTo(p.x, 10);
    expect(back.y).toBeCloseTo(p.y, 10);
  });
});
