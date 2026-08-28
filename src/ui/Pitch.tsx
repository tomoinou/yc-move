import type { Play, Vec2 } from '../core/types.ts';
import type { RefObject } from 'react';
import { FIELD } from '../core/field.ts';
import { toScreen, VIEW_HEIGHT_M, fromScreen } from '../core/camera.ts';
import { entityPositionAt } from '../core/interpolate.ts';
import { ballStateAt } from '../core/ball.ts';

const VH = VIEW_HEIGHT_M;
const TOKEN_RADIUS = 1.5;
const MAX_FONT = 1.2;
const MIN_FONT = 0.6;
const TRACK_SAMPLES = 20;

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

function pointerToSvgCoords(clientX: number, clientY: number, rect: DOMRect): Vec2 {
  return {
    x: (clientX - rect.left) * (44 / rect.width),
    y: (clientY - rect.top) * (VH / rect.height),
  };
}

interface PitchProps {
  play: Play;
  viewY?: number;
  currentTime?: number;
  // Editor props (all optional — omit for viewer mode)
  selectedId?: string | null;
  onionSkinTimes?: number[];
  dragOverride?: { entityId: string; pos: Vec2 } | null;
  svgRef?: RefObject<SVGSVGElement | null>;
  onPitchPointerDown?: (canonical: Vec2) => void;
  onTokenPointerDown?: (entityId: string) => void;
}

export function Pitch({
  play,
  viewY = -FIELD.marginM,
  currentTime = 0,
  selectedId,
  onionSkinTimes,
  dragOverride,
  svgRef,
  onPitchPointerDown,
  onTokenPointerDown,
}: PitchProps) {
  const ts = (p: Vec2) => toScreen(p, viewY, VH);

  // Hit radius: 44 screen-px converted to SVG meters.
  // Falls back to 5 on first render (before svgRef is set).
  const hitR = svgRef?.current
    ? Math.max(5, 44 * VH / svgRef.current.getBoundingClientRect().height)
    : 5;

  // Finger-offset in SVG meters (36 screen-px upward) for drag display.
  const fingerOffsetM = svgRef?.current
    ? 36 * VH / svgRef.current.getBoundingClientRect().height
    : 2;

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
  const bs = ballStateAt(play, currentTime);
  const bp = ts(bs.pos);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 44 ${VH}`}
      width="100%"
      style={{ display: 'block', aspectRatio: `44/${VH}`, touchAction: 'none' }}
      onPointerDown={(e) => {
        if (!onPitchPointerDown) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const svgPt = pointerToSvgCoords(e.clientX, e.clientY, rect);
        onPitchPointerDown(fromScreen(svgPt, viewY, VH));
      }}
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

      {/* 軌跡オーバーレイ */}
      {play.entities.map(entity =>
        entity.track.slice(0, -1).map((k, i) => {
          const k2 = entity.track[i + 1];
          if (k2.hold) return null;
          const d = Array.from({ length: TRACK_SAMPLES + 1 }, (_, s) => {
            const t = k.t + (k2.t - k.t) * (s / TRACK_SAMPLES);
            const sp = ts(entityPositionAt(entity, t));
            return `${s === 0 ? 'M' : 'L'}${sp.x},${sp.y}`;
          }).join(' ');
          return (
            <path
              key={`tr-${entity.id}-${i}`}
              d={d}
              fill="none"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth={0.12}
            />
          );
        }),
      )}

      {/* オニオンスキン: 前後フェーズのゴースト */}
      {onionSkinTimes?.flatMap(t =>
        play.entities.map(entity => {
          const pos = ts(entityPositionAt(entity, t));
          return (
            <circle
              key={`onion-${entity.id}-${t}`}
              cx={pos.x} cy={pos.y}
              r={TOKEN_RADIUS}
              fill={SIDE_COLOR[entity.side]}
              opacity={0.25}
              pointerEvents="none"
            />
          );
        })
      )}

      {/* トークン */}
      {play.entities.map(entity => {
        const rawPos = entityPositionAt(entity, currentTime);
        const isSelected = selectedId === entity.id;

        // ドラッグ中は指先位置 + 上オフセットで表示
        const displayCanonical = dragOverride?.entityId === entity.id
          ? { x: dragOverride.pos.x, y: dragOverride.pos.y + fingerOffsetM }
          : rawPos;
        const pos = ts(displayCanonical);
        const fs = tokenFontSize(entity.label);

        return (
          <g key={entity.id}>
            {/* 選択リング */}
            {isSelected && (
              <circle
                cx={pos.x} cy={pos.y}
                r={TOKEN_RADIUS + 0.35}
                fill="none"
                stroke="white"
                strokeWidth={0.25}
                pointerEvents="none"
              />
            )}
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
            {/* ヒット判定用透明サークル (編集モード時のみ) */}
            {onTokenPointerDown && (
              <circle
                cx={pos.x} cy={pos.y}
                r={hitR}
                fill="transparent"
                onPointerDown={(e) => {
                  e.stopPropagation();
                  onTokenPointerDown(entity.id);
                }}
              />
            )}
          </g>
        );
      })}

      {/* ボール */}
      <circle
        cx={bp.x} cy={bp.y}
        r={0.6}
        fill={bs.isForward ? '#FF8C00' : '#F5F5DC'}
        stroke="rgba(0,0,0,0.6)"
        strokeWidth={0.08}
      />
      {bs.isForward && (
        <text
          x={bp.x} y={bp.y - 1.2}
          fontSize={0.8}
          fill="#FF8C00"
          textAnchor="middle"
          pointerEvents="none"
        >
          FWD
        </text>
      )}

      {/* 注釈: from/to でフィルタ */}
      {play.annotations
        .filter(a => currentTime >= (a.from ?? 0) && currentTime <= (a.to ?? play.durationMs))
        .map(a => {
          const pos = ts(a.p);
          return (
            <text
              key={a.id}
              x={pos.x} y={pos.y}
              fontSize={0.9}
              fill="yellow"
              textAnchor="middle"
              dominantBaseline="central"
              stroke="rgba(0,0,0,0.7)"
              strokeWidth={0.15}
              paintOrder="stroke"
              pointerEvents="none"
            >
              {a.text}
            </text>
          );
        })}
    </svg>
  );
}
