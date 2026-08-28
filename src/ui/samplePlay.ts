import type { Play } from '../core/types.ts';
import { FIELD } from '../core/field.ts';
import { VIEW_HEIGHT_M } from '../core/camera.ts';

export const samplePlay: Play = {
  schemaVersion: 2,
  id: 'default',
  title: '新規プレイ',
  meta: { tags: [], updatedAt: '2026-08-28T00:00:00Z' },
  durationMs: 10000,
  markers: [],
  viewY: FIELD.halfM - VIEW_HEIGHT_M / 2,
  entities: [
    { id: 'a1', side: 'attack',  label: 'A1', track: [{ t: 0, p: { x: FIELD.widthM / 2, y: 25 } }] },
    { id: 'd1', side: 'defence', label: 'D1', track: [{ t: 0, p: { x: FIELD.widthM / 2, y: 35 } }] },
  ],
  ball: {
    holders: [{ t: 0, holderId: 'a1' }],
  },
  annotations: [],
  nextAttackIdx: 2,
  nextDefenceIdx: 2,
};
