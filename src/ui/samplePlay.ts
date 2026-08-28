import type { Play } from '../core/types.ts';
import { FIELD } from '../core/field.ts';

export const samplePlay: Play = {
  schemaVersion: 1,
  id: 'sample-m4',
  title: 'M4 サンプルプレイ',
  meta: { tags: [], updatedAt: '2026-08-28T00:00:00Z' },
  durationMs: 6000,
  markers: [2000, 4000],
  viewY: -FIELD.marginM,
  entities: [
    // a1 '10': chord1(t=2800→4500) → 12.2m/1.7s ≈ 7.2 m/s → SPEED WARN
    { id: 'a1', side: 'attack',  label: '10',  track: [
      { t: 0,    p: { x: 20, y: 5  } },
      { t: 2800, p: { x: 26, y: 8  } },
      { t: 4500, p: { x: 33, y: 18 } },
    ] },
    // a2 '13': receives pass at t=4800
    { id: 'a2', side: 'attack',  label: '13',  track: [
      { t: 0,    p: { x: 27, y: 7  } },
      { t: 4800, p: { x: 30, y: 12 } },
      { t: 6000, p: { x: 35, y: 20 } },
    ] },
    { id: 'a3', side: 'attack',  label: '12',  track: [
      { t: 0,    p: { x: 13, y: 7  } },
      { t: 3000, p: { x: 16, y: 12 } },
      { t: 6000, p: { x: 18, y: 18 } },
    ] },
    // a4 '9': scrumhalf, releases pass at t=2500
    { id: 'a4', side: 'attack',  label: '9',   track: [
      { t: 0,    p: { x: 20, y: 3 } },
      { t: 2500, p: { x: 21, y: 5 } },
      { t: 6000, p: { x: 22, y: 7 } },
    ] },
    { id: 'a5', side: 'attack',  label: 'WTB', track: [
      { t: 0,    p: { x: 35, y: 6  } },
      { t: 3000, p: { x: 37, y: 12 } },
      { t: 6000, p: { x: 39, y: 20 } },
    ] },
    // d1 'D1': chord0(t=0→1200) → 9m/1.2s = 7.5 m/s → SPEED WARN
    { id: 'd1', side: 'defence', label: 'D1',  track: [
      { t: 0,    p: { x: 18, y: 14 } },
      { t: 1200, p: { x: 18, y: 5  } },
      { t: 6000, p: { x: 20, y: 8  } },
    ] },
    { id: 'd2', side: 'defence', label: 'D2',  track: [
      { t: 0,    p: { x: 25, y: 12 } },
      { t: 3000, p: { x: 27, y: 10 } },
      { t: 6000, p: { x: 28, y: 8  } },
    ] },
    { id: 'd3', side: 'defence', label: 'D3',  track: [
      { t: 0,    p: { x: 12, y: 11 } },
      { t: 3000, p: { x: 14, y: 9  } },
      { t: 6000, p: { x: 15, y: 7  } },
    ] },
    { id: 'd4', side: 'defence', label: 'D4',  track: [
      { t: 0,    p: { x: 32, y: 10 } },
      { t: 3000, p: { x: 34, y: 8  } },
      { t: 6000, p: { x: 35, y: 6  } },
    ] },
  ],
  ball: {
    initialHolder: 'a4',
    events: [
      // FWD: a4 release y=5, a1 receive y=8 → receiveY > releaseY
      { t: 2500, kind: 'pass', from: 'a4', to: 'a1', flightMs: 300 },
      // OK:  a1 release y=18, a2 receive y=12 → receiveY < releaseY
      { t: 4500, kind: 'pass', from: 'a1', to: 'a2', flightMs: 300 },
    ],
  },
  annotations: [
    { id: 'ann1', text: 'スクラム球出し', p: { x: 10, y: 2  }, from: 0,    to: 2000 },
    { id: 'ann2', text: 'フォワードパス', p: { x: 28, y: 10 }, from: 2400, to: 3200 },
  ],
};
