import type { BallHolder, Play } from './types.ts';

type V1PassEvent = {
  t: number;
  kind: 'pass';
  from: string;
  to: string;
  flightMs: number;
};

type V1Play = Omit<Play, 'schemaVersion' | 'ball'> & {
  schemaVersion: 1;
  ball: {
    initialHolder: string;
    events: V1PassEvent[];
  };
};

export function migrateV1ToV2(v1: V1Play): Play {
  const holders: BallHolder[] = [{ t: 0, holderId: v1.ball.initialHolder }];

  for (const event of v1.ball.events) {
    const releaseT = event.t;
    const receiveT = event.t + event.flightMs;

    const releaseIdx = holders.findIndex(h => h.t === releaseT);
    if (releaseIdx >= 0) {
      holders[releaseIdx].holderId = event.from;
    } else {
      const ins = holders.findIndex(h => h.t > releaseT);
      if (ins === -1) holders.push({ t: releaseT, holderId: event.from });
      else holders.splice(ins, 0, { t: releaseT, holderId: event.from });
    }

    const receiveIdx = holders.findIndex(h => h.t === receiveT);
    if (receiveIdx >= 0) {
      holders[receiveIdx].holderId = event.to;
    } else {
      const ins = holders.findIndex(h => h.t > receiveT);
      if (ins === -1) holders.push({ t: receiveT, holderId: event.to });
      else holders.splice(ins, 0, { t: receiveT, holderId: event.to });
    }
  }

  return { ...v1, schemaVersion: 2, ball: { holders } };
}

export function migrateToLatest(data: unknown): Play {
  const d = data as { schemaVersion?: number };
  if (d.schemaVersion === 1) return migrateV1ToV2(d as V1Play);
  return data as Play;
}
