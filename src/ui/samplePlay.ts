import type { Play } from '../core/types.ts';
import { FIELD } from '../core/field.ts';

export const samplePlay: Play = {
  schemaVersion: 1,
  id: 'sample-m2',
  title: 'M2 サンプルプレイ',
  meta: { tags: [], updatedAt: '2026-08-28T00:00:00Z' },
  durationMs: 0,
  markers: [],
  viewY: -FIELD.marginM,
  entities: [
    { id: 'a1', side: 'attack',  label: '10',  track: [{ t: 0, p: { x: 20, y: 5  } }] },
    { id: 'a2', side: 'attack',  label: '13',  track: [{ t: 0, p: { x: 27, y: 7  } }] },
    { id: 'a3', side: 'attack',  label: '12',  track: [{ t: 0, p: { x: 13, y: 7  } }] },
    { id: 'a4', side: 'attack',  label: '9',   track: [{ t: 0, p: { x: 20, y: 3  } }] },
    { id: 'a5', side: 'attack',  label: 'WTB', track: [{ t: 0, p: { x: 35, y: 6  } }] },
    { id: 'd1', side: 'defence', label: 'D1',  track: [{ t: 0, p: { x: 18, y: 12 } }] },
    { id: 'd2', side: 'defence', label: 'D2',  track: [{ t: 0, p: { x: 25, y: 12 } }] },
    { id: 'd3', side: 'defence', label: 'D3',  track: [{ t: 0, p: { x: 12, y: 11 } }] },
    { id: 'd4', side: 'defence', label: 'D4',  track: [{ t: 0, p: { x: 32, y: 10 } }] },
  ],
  ball: { initialHolder: 'a4', events: [] },
  annotations: [],
};
