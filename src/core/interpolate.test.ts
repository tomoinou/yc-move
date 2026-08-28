import { describe, expect, it } from 'vitest';
import { entityPositionAt, segmentWarnings } from './interpolate.ts';
import type { Entity } from './types.ts';

function makeEntity(track: Entity['track']): Entity {
  return { id: 'p1', side: 'attack', label: 'A', track };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }) {
  return Math.sqrt((b.x - a.x) ** 2 + (b.y - a.y) ** 2);
}

describe('entityPositionAt', () => {
  it('single key: always returns that position', () => {
    const e = makeEntity([{ t: 0, p: { x: 5, y: 10 } }]);
    expect(entityPositionAt(e, 0)).toEqual({ x: 5, y: 10 });
    expect(entityPositionAt(e, 9999)).toEqual({ x: 5, y: 10 });
  });

  it('two keys: straight line interpolation at midpoint', () => {
    const e = makeEntity([
      { t: 0, p: { x: 0, y: 0 } },
      { t: 1000, p: { x: 10, y: 0 } },
    ]);
    const mid = entityPositionAt(e, 500);
    expect(mid.x).toBeCloseTo(5, 1);
    expect(mid.y).toBeCloseTo(0, 1);
  });

  it('hold: position stays frozen during hold interval', () => {
    const e = makeEntity([
      { t: 0, p: { x: 0, y: 0 } },
      { t: 1000, p: { x: 5, y: 5 }, hold: true },
      { t: 2000, p: { x: 10, y: 10 } },
    ]);
    // During hold interval [0, 1000) → stays at key[0].p
    expect(entityPositionAt(e, 1)).toEqual({ x: 0, y: 0 });
    expect(entityPositionAt(e, 500)).toEqual({ x: 0, y: 0 });
    expect(entityPositionAt(e, 999)).toEqual({ x: 0, y: 0 });
    // At exactly t=1000 → hold key's own position
    expect(entityPositionAt(e, 1000)).toEqual({ x: 5, y: 5 });
    // After hold → moving toward key[2]
    const p1500 = entityPositionAt(e, 1500);
    expect(p1500.x).toBeGreaterThan(5);
  });

  it('arc-length parameterization: equal time steps → approximately equal distances', () => {
    // Curved path: three keys forming an arc
    const e = makeEntity([
      { t: 0,    p: { x: 0, y: 0 } },
      { t: 1000, p: { x: 5, y: 8 } },
      { t: 2000, p: { x: 10, y: 0 } },
    ]);
    const steps = 20;
    const positions = Array.from({ length: steps + 1 }, (_, i) =>
      entityPositionAt(e, (i / steps) * 2000),
    );
    const dists = positions.slice(1).map((p, i) => dist(positions[i], p));
    const max = Math.max(...dists);
    const min = Math.min(...dists);
    // Without arc-length parameterization, Catmull-Rom bunches at endpoints, ratio >> 1.05
    expect(max / min).toBeLessThan(1.05);
  });

  it('corner: C1 discontinuity at corner key', () => {
    const e = makeEntity([
      { t: 0,    p: { x: 0, y: 0 } },
      { t: 1000, p: { x: 5, y: 5 }, corner: true },
      { t: 2000, p: { x: 10, y: 0 } },
    ]);
    // Approach direction just before corner
    const before0 = entityPositionAt(e, 990);
    const before1 = entityPositionAt(e, 995);
    const approachDx = before1.x - before0.x;
    const approachDy = before1.y - before0.y;
    // Departure direction just after corner
    const after0 = entityPositionAt(e, 1005);
    const after1 = entityPositionAt(e, 1010);
    const departDx = after1.x - after0.x;
    const departDy = after1.y - after0.y;
    // Cross product ≠ 0 means angle difference exists
    const cross = approachDx * departDy - approachDy * departDx;
    // Normalised dot product < cos(5°) ≈ 0.996 means > 5° turn
    const dot = approachDx * departDx + approachDy * departDy;
    const lenA = Math.sqrt(approachDx ** 2 + approachDy ** 2);
    const lenD = Math.sqrt(departDx ** 2 + departDy ** 2);
    const cosAngle = dot / (lenA * lenD);
    expect(Math.abs(cross)).toBeGreaterThan(0);
    expect(cosAngle).toBeLessThan(Math.cos((5 * Math.PI) / 180));
  });

  it('out-of-bounds t: clamps to start/end position', () => {
    const e = makeEntity([
      { t: 500,  p: { x: 1, y: 2 } },
      { t: 1500, p: { x: 3, y: 4 } },
    ]);
    expect(entityPositionAt(e, 0)).toEqual({ x: 1, y: 2 });
    expect(entityPositionAt(e, 9999)).toEqual({ x: 3, y: 4 });
  });
});

describe('segmentWarnings', () => {
  it('10 m/s segment triggers warning', () => {
    const e = makeEntity([
      { t: 0,    p: { x: 0, y: 0 } },
      { t: 1000, p: { x: 10, y: 0 } }, // 10 m in 1 s = 10 m/s
    ]);
    const w = segmentWarnings(e);
    expect(w.length).toBe(1);
    expect(w[0].avgSpeedMs).toBeGreaterThan(6);
  });

  it('4 m/s segment does not trigger warning', () => {
    const e = makeEntity([
      { t: 0,    p: { x: 0, y: 0 } },
      { t: 1000, p: { x: 4, y: 0 } }, // 4 m in 1 s = 4 m/s
    ]);
    expect(segmentWarnings(e).length).toBe(0);
  });

  it('hold segment is excluded from speed check', () => {
    const e = makeEntity([
      { t: 0,    p: { x: 0, y: 0 } },
      { t: 1,    p: { x: 999, y: 0 }, hold: true }, // would be insane speed but hold
    ]);
    expect(segmentWarnings(e).length).toBe(0);
  });
});
