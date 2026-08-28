import { describe, expect, it } from 'vitest';
import { ballStateAt, slowForwardWarnings } from './ball.ts';
import type { Entity, Play } from './types.ts';

function makeEntity(id: string, x: number, y: number): Entity {
  return { id, side: 'attack', label: 'X', track: [{ t: 0, p: { x, y } }] };
}

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    schemaVersion: 1,
    id: 'test',
    title: 'Test',
    meta: { tags: [], updatedAt: '2026-01-01T00:00:00Z' },
    durationMs: 5000,
    markers: [],
    viewY: 0,
    entities: [makeEntity('p1', 5, 10), makeEntity('p2', 5, 5)],
    ball: { initialHolder: 'p1', events: [] },
    annotations: [],
    nextAttackIdx: 1,
    nextDefenceIdx: 1,
    ...overrides,
  };
}

describe('ballStateAt', () => {
  it('initial holder before any pass', () => {
    const play = makePlay();
    const state = ballStateAt(play, 500);
    expect(state.holderId).toBe('p1');
    expect(state.isForward).toBe(false);
  });

  it('holder transitions: held → flying → held', () => {
    const play = makePlay({
      ball: {
        initialHolder: 'p1',
        events: [{ t: 1000, kind: 'pass', from: 'p1', to: 'p2', flightMs: 500 }],
      },
    });
    // Before release
    expect(ballStateAt(play, 999).holderId).toBe('p1');
    // In flight
    expect(ballStateAt(play, 1001).holderId).toBeNull();
    expect(ballStateAt(play, 1499).holderId).toBeNull();
    // After receive
    expect(ballStateAt(play, 1500).holderId).toBe('p2');
    expect(ballStateAt(play, 2000).holderId).toBe('p2');
  });

  it('ball position linearly interpolated during flight', () => {
    const play: Play = {
      schemaVersion: 1,
      id: 'test',
      title: 'T',
      meta: { tags: [], updatedAt: '2026-01-01T00:00:00Z' },
      durationMs: 5000,
      markers: [],
      viewY: 0,
      // p1 stays at (0,0), p2 stays at (10,10)
      entities: [
        { id: 'p1', side: 'attack', label: 'A', track: [{ t: 0, p: { x: 0, y: 0 } }] },
        { id: 'p2', side: 'attack', label: 'B', track: [{ t: 0, p: { x: 10, y: 10 } }] },
      ],
      ball: {
        initialHolder: 'p1',
        events: [{ t: 0, kind: 'pass', from: 'p1', to: 'p2', flightMs: 1000 }],
      },
      annotations: [],
      nextAttackIdx: 1,
      nextDefenceIdx: 1,
    };
    // At t=0: release. At t=500: midpoint. At t=1000: receive.
    const mid = ballStateAt(play, 500);
    expect(mid.pos.x).toBeCloseTo(5, 0);
    expect(mid.pos.y).toBeCloseTo(5, 0);
  });

  it('multiple passes: holder chain is correct', () => {
    const p3 = makeEntity('p3', 0, 0);
    const play = makePlay({
      entities: [makeEntity('p1', 5, 10), makeEntity('p2', 5, 5), p3],
      ball: {
        initialHolder: 'p1',
        events: [
          { t: 0,   kind: 'pass', from: 'p1', to: 'p2', flightMs: 100 },
          { t: 500, kind: 'pass', from: 'p2', to: 'p3', flightMs: 100 },
        ],
      },
    });
    expect(ballStateAt(play, 200).holderId).toBe('p2');
    expect(ballStateAt(play, 550).holderId).toBeNull(); // p2→p3 in flight
    expect(ballStateAt(play, 700).holderId).toBe('p3');
  });
});

describe('slowForwardWarnings', () => {
  it('forward pass: receiveY > releaseY triggers warning', () => {
    // p1 at y=10, p2 at y=15: receiver is further in +y = forward
    const play: Play = {
      schemaVersion: 1,
      id: 'test',
      title: 'T',
      meta: { tags: [], updatedAt: '2026-01-01T00:00:00Z' },
      durationMs: 5000,
      markers: [],
      viewY: 0,
      entities: [
        { id: 'p1', side: 'attack', label: 'A', track: [{ t: 0, p: { x: 5, y: 10 } }] },
        { id: 'p2', side: 'attack', label: 'B', track: [{ t: 0, p: { x: 5, y: 15 } }] },
      ],
      ball: {
        initialHolder: 'p1',
        events: [{ t: 1000, kind: 'pass', from: 'p1', to: 'p2', flightMs: 200 }],
      },
      annotations: [],
      nextAttackIdx: 1,
      nextDefenceIdx: 1,
    };
    const warnings = slowForwardWarnings(play);
    expect(warnings.length).toBe(1);
    expect(warnings[0].receivePos.y).toBeGreaterThan(warnings[0].releasePos.y);
  });

  it('backward pass: receiveY < releaseY produces no warning', () => {
    const play: Play = {
      schemaVersion: 1,
      id: 'test',
      title: 'T',
      meta: { tags: [], updatedAt: '2026-01-01T00:00:00Z' },
      durationMs: 5000,
      markers: [],
      viewY: 0,
      entities: [
        { id: 'p1', side: 'attack', label: 'A', track: [{ t: 0, p: { x: 5, y: 15 } }] },
        { id: 'p2', side: 'attack', label: 'B', track: [{ t: 0, p: { x: 5, y: 10 } }] },
      ],
      ball: {
        initialHolder: 'p1',
        events: [{ t: 1000, kind: 'pass', from: 'p1', to: 'p2', flightMs: 200 }],
      },
      annotations: [],
      nextAttackIdx: 1,
      nextDefenceIdx: 1,
    };
    expect(slowForwardWarnings(play).length).toBe(0);
  });
});
