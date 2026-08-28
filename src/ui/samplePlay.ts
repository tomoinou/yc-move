import type { Play } from '../core/types.ts';
import { FIELD } from '../core/field.ts';

export const samplePlay: Play = {
  schemaVersion: 1,
  id: 'default',
  title: '新規プレイ',
  meta: { tags: [], updatedAt: '2026-08-28T00:00:00Z' },
  durationMs: 10000,
  markers: [],
  viewY: -FIELD.marginM,
  entities: [
    { id: 'a1', side: 'attack',  label: 'A1', track: [{ t: 0, p: { x: FIELD.widthM / 2, y: 5  } }] },
    { id: 'd1', side: 'defence', label: 'D1', track: [{ t: 0, p: { x: FIELD.widthM / 2, y: 15 } }] },
  ],
  ball: {
    initialHolder: 'a1',
    events: [],
  },
  annotations: [],
  nextAttackIdx: 2,
  nextDefenceIdx: 2,
};
