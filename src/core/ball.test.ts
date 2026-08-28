import { describe, expect, it } from 'vitest';
import { ballStateAt, forwardPassWarnings } from './ball.ts';
import type { Entity, Play } from './types.ts';

function makeEntity(id: string, x: number, y: number): Entity {
  return { id, side: 'attack', label: 'X', track: [{ t: 0, p: { x, y } }] };
}

function makePlay(overrides: Partial<Play> = {}): Play {
  return {
    schemaVersion: 2,
    id: 'test',
    title: 'Test',
    meta: { tags: [], updatedAt: '2026-01-01T00:00:00Z' },
    durationMs: 5000,
    markers: [],
    viewY: 0,
    entities: [makeEntity('p1', 5, 10), makeEntity('p2', 5, 5)],
    ball: { holders: [{ t: 0, holderId: 'p1' }] },
    annotations: [],
    nextAttackIdx: 1,
    nextDefenceIdx: 1,
    ...overrides,
  };
}

describe('ballStateAt', () => {
  it('初期保持者を返す', () => {
    const play = makePlay();
    const state = ballStateAt(play, 500);
    expect(state.holderId).toBe('p1');
    expect(state.isForward).toBe(false);
  });

  it('フレーム時刻では保持（フライ開始は > cur.t から）', () => {
    const play = makePlay({
      ball: { holders: [{ t: 0, holderId: 'p1' }, { t: 1500, holderId: 'p2' }] },
    });
    expect(ballStateAt(play, 0).holderId).toBe('p1');
    expect(ballStateAt(play, 1500).holderId).toBe('p2');
  });

  it('異なる保持者間でボールがフライ', () => {
    const play = makePlay({
      ball: { holders: [{ t: 0, holderId: 'p1' }, { t: 1500, holderId: 'p2' }] },
    });
    expect(ballStateAt(play, 750).holderId).toBeNull();
    expect(ballStateAt(play, 2000).holderId).toBe('p2');
  });

  it('同じ保持者が続く区間ではフライしない', () => {
    const play = makePlay({
      ball: {
        holders: [
          { t: 0, holderId: 'p1' },
          { t: 1000, holderId: 'p1' },
          { t: 1500, holderId: 'p2' },
        ],
      },
    });
    expect(ballStateAt(play, 500).holderId).toBe('p1');
    expect(ballStateAt(play, 1250).holderId).toBeNull();
    expect(ballStateAt(play, 2000).holderId).toBe('p2');
  });

  it('フライ中の位置を線形補間する', () => {
    const play: Play = {
      schemaVersion: 2,
      id: 'test',
      title: 'T',
      meta: { tags: [], updatedAt: '2026-01-01T00:00:00Z' },
      durationMs: 5000,
      markers: [],
      viewY: 0,
      entities: [
        { id: 'p1', side: 'attack', label: 'A', track: [{ t: 0, p: { x: 0, y: 0 } }] },
        { id: 'p2', side: 'attack', label: 'B', track: [{ t: 0, p: { x: 10, y: 10 } }] },
      ],
      ball: { holders: [{ t: 0, holderId: 'p1' }, { t: 1000, holderId: 'p2' }] },
      annotations: [],
      nextAttackIdx: 1,
      nextDefenceIdx: 1,
    };
    const mid = ballStateAt(play, 500);
    expect(mid.pos.x).toBeCloseTo(5, 0);
    expect(mid.pos.y).toBeCloseTo(5, 0);
  });
});

describe('forwardPassWarnings', () => {
  it('レシーバーが +y 側にいる場合は警告', () => {
    const play: Play = {
      schemaVersion: 2,
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
      ball: { holders: [{ t: 0, holderId: 'p1' }, { t: 1200, holderId: 'p2' }] },
      annotations: [],
      nextAttackIdx: 1,
      nextDefenceIdx: 1,
    };
    const warnings = forwardPassWarnings(play);
    expect(warnings.length).toBe(1);
    expect(warnings[0].receivePos.y).toBeGreaterThan(warnings[0].releasePos.y);
  });

  it('バックパスは警告なし', () => {
    const play: Play = {
      schemaVersion: 2,
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
      ball: { holders: [{ t: 0, holderId: 'p1' }, { t: 1200, holderId: 'p2' }] },
      annotations: [],
      nextAttackIdx: 1,
      nextDefenceIdx: 1,
    };
    expect(forwardPassWarnings(play).length).toBe(0);
  });
});
