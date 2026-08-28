import type { PassEvent, Play, Vec2 } from './types.ts';
import { entityPositionAt } from './interpolate.ts';

export type BallState = {
  pos: Vec2;
  holderId: string | null;
  isForward: boolean;
};

export type ForwardPassWarning = {
  event: PassEvent;
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

type BallPhase =
  | { kind: 'held'; holderId: string }
  | { kind: 'flying'; event: PassEvent; releasePos: Vec2; receivePos: Vec2 };

function resolveBallPhase(play: Play, t: number): BallPhase {
  let currentHolder = play.ball.initialHolder;

  for (const event of play.ball.events) {
    if (t < event.t) {
      return { kind: 'held', holderId: currentHolder };
    }
    const receiveTime = event.t + event.flightMs;
    if (t < receiveTime) {
      const from = getEntity(play, event.from);
      const to = getEntity(play, event.to);
      return {
        kind: 'flying',
        event,
        releasePos: entityPositionAt(from, event.t),
        receivePos: entityPositionAt(to, receiveTime),
      };
    }
    currentHolder = event.to;
  }

  return { kind: 'held', holderId: currentHolder };
}

export function ballStateAt(play: Play, t: number): BallState {
  const phase = resolveBallPhase(play, t);

  if (phase.kind === 'held') {
    const holder = getEntity(play, phase.holderId);
    return { pos: entityPositionAt(holder, t), holderId: phase.holderId, isForward: false };
  }

  const { event, releasePos, receivePos } = phase;
  const fraction = (t - event.t) / event.flightMs;
  return {
    pos: lerp2(releasePos, receivePos, fraction),
    holderId: null,
    // Attack direction is +y (fixed). Forward = receiver further in +y than passer.
    isForward: receivePos.y > releasePos.y,
  };
}

export function slowForwardWarnings(play: Play): ForwardPassWarning[] {
  const warnings: ForwardPassWarning[] = [];

  for (const event of play.ball.events) {
    const from = getEntity(play, event.from);
    const to = getEntity(play, event.to);
    const releasePos = entityPositionAt(from, event.t);
    const receivePos = entityPositionAt(to, event.t + event.flightMs);
    if (receivePos.y > releasePos.y) {
      warnings.push({ event, releasePos, receivePos });
    }
  }

  return warnings;
}
