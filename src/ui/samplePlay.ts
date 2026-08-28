import type { Play } from '../core/types.ts';
import { FIELD } from '../core/field.ts';
import { VIEW_HEIGHT_M } from '../core/camera.ts';

const BK_START_X = 8;   // 左タッチラインから 8m
const BK_STEP_X  = 5;   // BK 間の x 間隔
const HW = FIELD.halfM; // ハーフウェイライン y=30
const Y_SHIFT    = 5;   // 全体を y 方向 +5m

// A ライン角度: 水平線から 45°
// x 方向 5m ごとに y が 5*tan(45°) = 5m 下がる
const A_STEP_Y = BK_STEP_X * Math.tan(Math.PI / 4);

const A1_Y = HW - 2 + Y_SHIFT;                   // 33
const aY   = (n: number) => A1_Y - A_STEP_Y * n; // A1 起点から n 人分右下
const D_LINE_Y = HW + 4.5 + Y_SHIFT;             // 39.5

export const samplePlay: Play = {
  schemaVersion: 2,
  id: 'default',
  title: '新規プレイ',
  meta: { tags: [], updatedAt: '2026-08-28T00:00:00Z' },
  durationMs: 10000,
  markers: [],
  viewY: FIELD.halfM - VIEW_HEIGHT_M / 2,
  entities: [
    // A1 起点。左右 60° で A2〜A6 / A5 が広がる
    { id: 'a1', side: 'attack',  label: 'A1', track: [{ t: 0, p: { x: BK_START_X,                 y: A1_Y    } }] },
    { id: 'a2', side: 'attack',  label: 'A2', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X,     y: aY(1)   } }] },
    { id: 'a3', side: 'attack',  label: 'A3', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 2, y: aY(2)   } }] },
    { id: 'a4', side: 'attack',  label: 'A4', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 3, y: aY(3)   } }] },
    { id: 'a5', side: 'attack',  label: 'A5', track: [{ t: 0, p: { x: 3,                           y: aY(1)   } }] },
    { id: 'a6', side: 'attack',  label: 'A6', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 4, y: aY(4)   } }] },
    // D1: A1 と 4m 間隔で睨み合い
    { id: 'd1', side: 'defence', label: 'D1', track: [{ t: 0, p: { x: BK_START_X,                 y: HW + 2 + Y_SHIFT } }] },
    { id: 'd2', side: 'defence', label: 'D2', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X,     y: D_LINE_Y } }] },
    { id: 'd3', side: 'defence', label: 'D3', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 2, y: D_LINE_Y } }] },
    { id: 'd4', side: 'defence', label: 'D4', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 3, y: D_LINE_Y } }] },
    { id: 'd5', side: 'defence', label: 'D5', track: [{ t: 0, p: { x: 3,                           y: D_LINE_Y } }] },
    { id: 'd6', side: 'defence', label: 'D6', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 4, y: D_LINE_Y } }] },
  ],
  ball: {
    holders: [{ t: 0, holderId: 'a1' }],
  },
  annotations: [],
  nextAttackIdx: 7,
  nextDefenceIdx: 7,
};
