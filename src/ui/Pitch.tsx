import type { Play, Vec2, Entity } from '../core/types.ts';
import type { RefObject } from 'react';
import { FIELD } from '../core/field.ts';
import { toScreen, VIEW_HEIGHT_M, SVG_WIDTH_M, fromScreen } from '../core/camera.ts';
import { entityPositionAt } from '../core/interpolate.ts';
import { ballStateAt } from '../core/ball.ts';

// ドラッグ中のエンティティに対し、currentTime のキーをドラッグ位置で仮置換したコピーを返す
function withDragPos(entity: Entity, dragOverride: { entityId: string; pos: Vec2 } | null | undefined, t: number): Entity {
  if (!dragOverride || dragOverride.entityId !== entity.id) return entity;
  const existing = entity.track.findIndex(k => k.t === t);
  if (existing >= 0) {
    return { ...entity, track: entity.track.map((k, i) => i === existing ? { ...k, p: dragOverride.pos } : k) };
  }
  const newTrack = [...entity.track];
  const ins = newTrack.findIndex(k => k.t > t);
  if (ins === -1) newTrack.push({ t, p: dragOverride.pos });
  else newTrack.splice(ins, 0, { t, p: dragOverride.pos });
  return { ...entity, track: newTrack };
}

const TOKEN_RADIUS = 1.2;
const MAX_FONT = 1.0;
const MIN_FONT = 0.5;
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
  const scale = SVG_WIDTH_M / rect.width;
  return {
    x: (clientX - rect.left) * scale,
    y: (clientY - rect.top) * scale,
  };
}

interface PitchProps {
  play: Play;
  viewY?: number;
  viewH?: number;
  currentTime?: number;
  // Editor props (all optional — omit for viewer mode)
  selectedId?: string | null;
  onionSkinTimes?: number[];
  dragOverride?: { entityId: string; pos: Vec2 } | null;
  scrollMode?: boolean;
  svgRef?: RefObject<SVGSVGElement | null>;
  onSvgPointerDown?: (canonical: Vec2, clientX: number, clientY: number) => void;
}

export function Pitch({
  play,
  viewY = FIELD.halfM - VIEW_HEIGHT_M / 2,
  viewH = VIEW_HEIGHT_M,
  currentTime = 0,
  selectedId,
  onionSkinTimes,
  dragOverride,
  scrollMode = false,
  svgRef,
  onSvgPointerDown,
}: PitchProps) {
  const ts = (p: Vec2) => toScreen(p, viewY, viewH);

  const boundaryStroke = scrollMode ? 'rgba(255,255,100,0.8)' : 'white';

  const hLine = (y: number, strokeWidth: number, strokeDasharray?: string, stroke?: string) => {
    const p1 = ts({ x: 0, y });
    const p2 = ts({ x: FIELD.widthM, y });
    return (
      <line
        key={`h-${y}`}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={stroke ?? 'white'}
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
      />
    );
  };

  const vLine = (x: number, strokeWidth: number, stroke?: string) => {
    const p1 = ts({ x, y: -FIELD.inGoalM });
    const p2 = ts({ x, y: FIELD.lengthM + FIELD.inGoalM });
    return (
      <line
        key={`v-${x}`}
        x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
        stroke={stroke ?? 'white'}
        strokeWidth={strokeWidth}
      />
    );
  };

  const playAreaOrigin = ts({ x: 0, y: FIELD.lengthM });
  const inGoalBottomOrigin = ts({ x: 0, y: 0 });
  const inGoalTopOrigin = ts({ x: 0, y: FIELD.lengthM + FIELD.inGoalM });
  const bs = ballStateAt(play, currentTime);
  // ドラッグ中のキャリア位置を上書き（保持時のみ）
  const basePos = bs.holderId !== null && dragOverride?.entityId === bs.holderId
    ? dragOverride.pos
    : bs.pos;
  // 攻撃: 円上部(+)、守備: 円下部(-)
  const BALL_OFFSET = TOKEN_RADIUS + 0.6;
  const sideOffset = (side: 'attack' | 'defence') => side === 'defence' ? -BALL_OFFSET : BALL_OFFSET;
  const yOffset = bs.flightInfo
    ? sideOffset(bs.flightInfo.fromSide) * (1 - bs.flightInfo.fraction) + sideOffset(bs.flightInfo.toSide) * bs.flightInfo.fraction
    : sideOffset(bs.holderSide ?? 'attack');
  const ballCanonical = { x: basePos.x, y: basePos.y + yOffset };
  const bp = ts(ballCanonical);

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${SVG_WIDTH_M} ${viewH}`}
      width="100%"
      height="100%"
      style={{ display: 'block', touchAction: 'pinch-zoom', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' } as React.CSSProperties}
      onContextMenu={(e) => e.preventDefault()}
      onPointerDown={(e) => {
        if (!onSvgPointerDown) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const svgPt = pointerToSvgCoords(e.clientX, e.clientY, rect);
        onSvgPointerDown(fromScreen(svgPt, viewY, viewH), e.clientX, e.clientY);
      }}
    >
      {/* 茶色（ハードコート）: タッチライン外マージン（全背景） */}
      <rect x={0} y={0} width={SVG_WIDTH_M} height={viewH} fill="#7B3A1E" />

      {/* 暗い緑: インゴールエリア */}
      <rect x={inGoalBottomOrigin.x} y={inGoalBottomOrigin.y} width={FIELD.widthM} height={FIELD.inGoalM} fill="#1a5c1a" />
      <rect x={inGoalTopOrigin.x} y={inGoalTopOrigin.y} width={FIELD.widthM} height={FIELD.inGoalM} fill="#1a5c1a" />

      {/* 明るい緑: プレーエリア */}
      <rect
        x={playAreaOrigin.x}
        y={playAreaOrigin.y}
        width={FIELD.widthM}
        height={FIELD.lengthM}
        fill="#2d8a2d"
      />

      {/* 太実線: デッドボールライン */}
      {hLine(-FIELD.inGoalM, 0.3, undefined, boundaryStroke)}
      {hLine(FIELD.lengthM + FIELD.inGoalM, 0.3, undefined, boundaryStroke)}

      {/* 太実線: トライライン */}
      {hLine(0, 0.3, undefined, boundaryStroke)}
      {hLine(FIELD.lengthM, 0.3, undefined, boundaryStroke)}

      {/* 太実線: ハーフウェイライン（半透明） */}
      {hLine(FIELD.halfM, 0.3, undefined, 'rgba(255,255,255,0.5)')}

      {/* 太実線: タッチライン（デッドボールラインまで延長） */}
      {vLine(0, 0.3, boundaryStroke)}
      {vLine(FIELD.widthM, 0.3, boundaryStroke)}

      {/* 細実線: 10m ライン（半透明） */}
      {hLine(10, 0.15, undefined, 'rgba(255,255,255,0.5)')}
      {hLine(50, 0.15, undefined, 'rgba(255,255,255,0.5)')}

      {/* 破線: 5m ライン（半透明） */}
      {hLine(25, 0.15, '1 0.5', 'rgba(255,255,255,0.5)')}
      {hLine(35, 0.15, '1 0.5', 'rgba(255,255,255,0.5)')}

      {/* 交線ティック（半透明） */}
      {TICK_XS.flatMap(tx =>
        LINE_YS.map(ly => {
          const p1 = ts({ x: tx, y: ly - 0.5 });
          const p2 = ts({ x: tx, y: ly + 0.5 });
          return (
            <line
              key={`tick-${tx}-${ly}`}
              x1={p1.x} y1={p1.y} x2={p2.x} y2={p2.y}
              stroke="rgba(255,255,255,0.5)"
              strokeWidth={0.15}
            />
          );
        }),
      )}

      {/* 軌跡オーバーレイ */}
      {play.entities.map(entity => {
        const eff = withDragPos(entity, dragOverride, currentTime);
        return eff.track.slice(0, -1).map((k, i) => {
          const k2 = eff.track[i + 1];
          if (k2.hold) return null;
          if (k.t >= currentTime) return null;
          const endT = Math.min(k2.t, currentTime);
          const d = Array.from({ length: TRACK_SAMPLES + 1 }, (_, s) => {
            const t = k.t + (endT - k.t) * (s / TRACK_SAMPLES);
            const sp = ts(entityPositionAt(eff, t));
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
        });
      })}

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

        const displayCanonical = dragOverride?.entityId === entity.id
          ? dragOverride.pos
          : rawPos;
        const pos = ts(displayCanonical);
        const fs = tokenFontSize(entity.label);

        return (
          <g key={entity.id} opacity={scrollMode ? 0.4 : 1}>
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
              fontFamily="sans-serif"
              pointerEvents="none"
            >
              {entity.label}
            </text>
          </g>
        );
      })}

      {/* ボール: SVG 図形（絵文字はデバイス依存のため使用しない） */}
      <g transform={`translate(${bp.x},${bp.y}) rotate(-45) scale(1.2)`} pointerEvents="none">
        <ellipse rx={0.62} ry={0.35} fill="#FFE600" stroke="rgba(0,0,0,0.2)" strokeWidth={0.03} />
        <line x1={-0.57} y1={0} x2={0.57} y2={0} stroke="rgba(0,0,0,0.3)" strokeWidth={0.055} />
        {([-0.18, 0, 0.18] as const).map(x => (
          <line key={x} x1={x} y1={-0.25} x2={x} y2={0.25} stroke="rgba(0,0,0,0.45)" strokeWidth={0.045} />
        ))}
      </g>

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
              fontFamily="sans-serif"
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
