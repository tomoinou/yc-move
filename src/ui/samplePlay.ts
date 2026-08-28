import type { Play } from '../core/types.ts';
import { FIELD } from '../core/field.ts';
import { VIEW_HEIGHT_M } from '../core/camera.ts';

const BK_START_X = 8;   // 左タッチラインから 8m
const BK_STEP_X  = 4;   // BK 間の x 間隔
const HW = FIELD.halfM; // ハーフウェイライン y=30

export const samplePlay: Play = {
  schemaVersion: 2,
  id: 'default',
  title: '新規プレイ',
  meta: { tags: [], updatedAt: '2026-08-28T00:00:00Z' },
  durationMs: 10000,
  markers: [],
  viewY: FIELD.halfM - VIEW_HEIGHT_M / 2,
  entities: [
    // A1: ハーフウェイから 1.5m 手前
    { id: 'a1', side: 'attack',  label: 'A1', track: [{ t: 0, p: { x: BK_START_X,              y: HW - 1.5 } }] },
    // A2〜A6: A1 から右へ 4m 間隔、1m/人ずつ斜め下
    { id: 'a2', side: 'attack',  label: 'A2', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X,      y: HW - 2.5 } }] },
    { id: 'a3', side: 'attack',  label: 'A3', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 2,  y: HW - 3.5 } }] },
    { id: 'a4', side: 'attack',  label: 'A4', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 3,  y: HW - 4.5 } }] },
    { id: 'a5', side: 'attack',  label: 'A5', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 4,  y: HW - 5.5 } }] },
    { id: 'a6', side: 'attack',  label: 'A6', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 5,  y: HW - 6.5 } }] },
    // D1: ハーフウェイから 1.5m 奥（A1 と睨み合い）
    { id: 'd1', side: 'defence', label: 'D1', track: [{ t: 0, p: { x: BK_START_X,              y: HW + 1.5 } }] },
    // D2〜D6: D1 から 3m 後退した横一列、4m 間隔
    { id: 'd2', side: 'defence', label: 'D2', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X,      y: HW + 4.5 } }] },
    { id: 'd3', side: 'defence', label: 'D3', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 2,  y: HW + 4.5 } }] },
    { id: 'd4', side: 'defence', label: 'D4', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 3,  y: HW + 4.5 } }] },
    { id: 'd5', side: 'defence', label: 'D5', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 4,  y: HW + 4.5 } }] },
    { id: 'd6', side: 'defence', label: 'D6', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 5,  y: HW + 4.5 } }] },
  ],
  ball: {
    holders: [{ t: 0, holderId: 'a1' }],
  },
  annotations: [],
  nextAttackIdx: 7,
  nextDefenceIdx: 7,
};
