import type { Play, Vec2 } from '../core/types.ts';
import { FIELD } from '../core/field.ts';
import { toScreen, VIEW_HEIGHT_M } from '../core/camera.ts';
import { entityPositionAt } from '../core/interpolate.ts';

const VH = VIEW_HEIGHT_M;

const TOKEN_RADIUS = 1.5;
const MAX_FONT = 1.2;
const MIN_FONT = 0.6;

const SIDE_COLOR: Record<'attack' | 'defence', string> = {
  attack: '#E8272A',
  defence: '#1755B8',
};

const TICK_XS = [3, 8, 32, 37] as const;
const LINE_YS = [0, 10, 25, 30, 35, 50, 60] as const;

function labelDisplayWidth(text: string): number {
  let w = 0;
  for (const cp of text) {
    w += (cp.codePointAt(0) ?? 0) <= 0xff ? 0.5 : 1.0;
  }
  return w;
}

function tokenFontSize(label: string): number {
  const W = labelDisplayWidth(label);
  return Math.max(MIN_FONT, Math.min(MAX_FONT, (TOKEN_RADIUS * 1.6) / W));
}

interface PitchProps {
  play: Play;
  viewY?: number;
}

export function Pitch({ play, viewY = -FIELD.marginM }: PitchProps) {
  const ts = (p: Vec2) => toScreen(p, viewY, VH);

  const hLine = (y: number, strokeWidth: number, strokeDasharray?: string) => {
    const p1 = ts({ x: -FIELD.marginM, y });
    const p2 = ts({ x: FIELD.widthM + FIELD.marginM, y });
    return (
      <line
        key={`h-${y}`}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    );
  };

  const vLine = (x: number, strokeWidth: number) => {
    const p1 = ts({ x, y: -FIELD.marginM });
    const p2 = ts({ x, y: FIELD.lengthM + FIELD.marginM });
    return (
      <line
        key={`v-${x}`}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke="white"
        strokeWidth={strokeWidth}
      />
    );
  };

  const playAreaOrigin = ts({ x: 0, y: FIELD.lengthM });

  return (
    <svg
      viewBox={`0 0 44 ${VH}`}
      width="100%"
      style={{ display: 'block', aspectRatio: `44/${VH}`, touchAction: 'none' }}
    >
      {/* 暗い緑: マージン含む全背景 */}
      <rect x={0} y={0} width={44} height={VH} fill="#1a5c1a" />

      {/* 明るい緑: プレーエリア */}
      <rect
        x={playAreaOrigin.x}
        y={playAreaOrigin.y}
        width={FIELD.widthM}
        height={FIELD.lengthM}
        fill="#2d8a2d"
      />

      {/* 太実線: トライライン・ハーフウェイ */}
      {hLine(0, 0.3)}
      {hLine(FIELD.lengthM, 0.3)}
      {hLine(FIELD.halfM, 0.3)}

      {/* 太実線: タッチライン */}
      {vLine(0, 0.3)}
      {vLine(FIELD.widthM, 0.3)}

      {/* 細実線: 10m ライン */}
      {hLine(10, 0.15)}
      {hLine(50, 0.15)}

      {/* 破線: 5m ライン */}
      {hLine(25, 0.15, '1 0.5')}
      {hLine(35, 0.15, '1 0.5')}

      {/* 交線ティック */}
      {TICK_XS.flatMap(tx =>
        LINE_YS.map(ly => {
          const p1 = ts({ x: tx, y: ly - 0.5 });
          const p2 = ts({ x: tx, y: ly + 0.5 });
          return (
            <line
              key={`tick-${tx}-${ly}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="white"
              strokeWidth={0.15}
            />
          );
        }),
      )}

      {/* トークン */}
      {play.entities.map(entity => {
        const pos = ts(entityPositionAt(entity, 0));
        const fs = tokenFontSize(entity.label);
        return (
          <g key={entity.id}>
            <circle
              cx={pos.x} cy={pos.y}
              r={TOKEN_RADIUS}
              fill={SIDE_COLOR[entity.side]}
              stroke="white"
              strokeWidth={0.1}
            />
            <text
              x={pos.x} y={pos.y}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={fs}
              fontWeight="bold"
              pointerEvents="none"
            >
              {entity.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
