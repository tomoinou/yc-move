import type { Play, Vec2 } from './types.ts';
import { entityPositionAt } from './interpolate.ts';

export type BallState = {
  pos: Vec2;
  holderId: string | null;
  holderSide: 'attack' | 'defence' | null;
  flightInfo: { fromSide: 'attack' | 'defence'; toSide: 'attack' | 'defence'; fraction: number } | null;
  isForward: boolean;
};

export type ForwardPassWarning = {
  fromId: string;
  toId: string;
  releasePos: Vec2;
  receivePos: Vec2;
};

function lerp2(a: Vec2, b: Vec2, t: number): Vec2 {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

function getEntity(play: Play, id: string) {
  const e = play.entities.find(en => en.id === id);
  if (!e) throw new Error(`Entity not found: ${id}`);
  return e;
}

export function ballStateAt(play: Play, t: number): BallState {
  const { holders } = play.ball;
  if (holders.length === 0) {
    return { pos: { x: 20, y: 30 }, holderId: null, holderSide: null, flightInfo: null, isForward: false };
  }

  let curIdx = 0;
  for (let i = 1; i < holders.length; i++) {
    if (holders[i].t <= t) curIdx = i;
    else break;
  }

  const cur = holders[curIdx];
  const next = holders[curIdx + 1];

  // 連続するエントリで異なる保持者 + 現時刻がリリース後 → フライ中
  if (next && next.holderId !== cur.holderId && t > cur.t) {
    try {
      const from = getEntity(play, cur.holderId);
      const to = getEntity(play, next.holderId);
      const releasePos = entityPositionAt(from, cur.t);
      const receivePos = entityPositionAt(to, next.t);
      const fraction = (t - cur.t) / (next.t - cur.t);
      return {
        pos: lerp2(releasePos, receivePos, fraction),
        holderId: null,
        holderSide: null,
        flightInfo: { fromSide: from.side, toSide: to.side, fraction },
        isForward: receivePos.y > releasePos.y,
      };
    } catch {
      // エンティティが見つからない場合は保持扱い
    }
  }

  try {
    const holder = getEntity(play, cur.holderId);
    return { pos: entityPositionAt(holder, t), holderId: cur.holderId, holderSide: holder.side, flightInfo: null, isForward: false };
  } catch {
    return { pos: { x: 20, y: 30 }, holderId: null, holderSide: null, flightInfo: null, isForward: false };
  }
}

export function forwardPassWarnings(play: Play): ForwardPassWarning[] {
  const warnings: ForwardPassWarning[] = [];
  const { holders } = play.ball;

  for (let i = 0; i < holders.length - 1; i++) {
    const cur = holders[i];
    const next = holders[i + 1];
    if (next.holderId === cur.holderId) continue;

    try {
      const from = getEntity(play, cur.holderId);
      const to = getEntity(play, next.holderId);
      const releasePos = entityPositionAt(from, cur.t);
      const receivePos = entityPositionAt(to, next.t);
      if (receivePos.y > releasePos.y) {
        warnings.push({ fromId: cur.holderId, toId: next.holderId, releasePos, receivePos });
      }
    } catch {
      // エンティティが見つからない場合はスキップ
    }
  }

  return warnings;
}
