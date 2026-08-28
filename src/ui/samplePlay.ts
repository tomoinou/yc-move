import type { Play } from '../core/types.ts';
import { FIELD } from '../core/field.ts';
import { VIEW_HEIGHT_M } from '../core/camera.ts';

const BK_START_X = 8;   // 左タッチラインから 8m
const BK_STEP_X  = 5;   // BK 間の x 間隔
const HW = FIELD.halfM; // ハーフウェイライン y=30

// A ライン角度: 攻撃方向（y 軸）から 60° = 水平線から 30°
// x 方向 5m ごとに y が 5*tan(30°) = 5/√3 ≈ 2.89m 下がる
const A_STEP_Y = BK_STEP_X * Math.tan(Math.PI / 6);

// A2〜A4 の y 位置（60° ライン基準）
const aY = (n: number) => HW - 1.5 - A_STEP_Y * n;

export const samplePlay: Play = {
  schemaVersion: 2,
  id: 'default',
  title: '新規プレイ',
  meta: { tags: [], updatedAt: '2026-08-28T00:00:00Z' },
  durationMs: 10000,
  markers: [],
  viewY: FIELD.halfM - VIEW_HEIGHT_M / 2,
  entities: [
    // A1: ハーフウェイから 2m 手前（D1 と 4m 間隔で睨み合い）
    { id: 'a1', side: 'attack',  label: 'A1', track: [{ t: 0, p: { x: BK_START_X,                 y: HW - 2 } }] },
    { id: 'a2', side: 'attack',  label: 'A2', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X,     y: aY(1) } }] },
    { id: 'a3', side: 'attack',  label: 'A3', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 2, y: aY(2) } }] },
    { id: 'a4', side: 'attack',  label: 'A4', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 3, y: aY(3) } }] },
    // A5: 左タッチから 3m、A2 と同じ y
    { id: 'a5', side: 'attack',  label: 'A5', track: [{ t: 0, p: { x: 3,                           y: aY(1) } }] },
    // A6: A5 の旧位置（x=28）
    { id: 'a6', side: 'attack',  label: 'A6', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 4, y: aY(4) } }] },
    // D1: ハーフウェイから 2m 奥（A1 と 4m 間隔で睨み合い）
    { id: 'd1', side: 'defence', label: 'D1', track: [{ t: 0, p: { x: BK_START_X,                 y: HW + 2 } }] },
    { id: 'd2', side: 'defence', label: 'D2', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X,     y: HW + 4.5 } }] },
    { id: 'd3', side: 'defence', label: 'D3', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 2, y: HW + 4.5 } }] },
    { id: 'd4', side: 'defence', label: 'D4', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 3, y: HW + 4.5 } }] },
    // D5: 左タッチから 3m
    { id: 'd5', side: 'defence', label: 'D5', track: [{ t: 0, p: { x: 3,                           y: HW + 4.5 } }] },
    // D6: D5 の旧位置（x=28）
    { id: 'd6', side: 'defence', label: 'D6', track: [{ t: 0, p: { x: BK_START_X + BK_STEP_X * 4, y: HW + 4.5 } }] },
  ],
  ball: {
    holders: [{ t: 0, holderId: 'a1' }],
  },
  annotations: [],
  nextAttackIdx: 7,
  nextDefenceIdx: 7,
};
