import type { Play } from '../core/types.ts';

interface EntityPanelProps {
  play: Play;
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  scrollMode: boolean;
  addMode: 'attack' | 'defence' | null;
  currentFrameHolderId: string | null;
  onAddAttack: () => void;
  onAddDefence: () => void;
  onEditLabel: () => void;
  onDeleteEntity: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleScroll: () => void;
  onAssignBall: () => void;
  onShare: () => void;
}

const btn = (active: boolean, color?: string) => ({
  background: active ? (color ?? 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.05)',
  color: active ? 'white' : 'rgba(255,255,255,0.3)',
  border: 'none',
  borderRadius: 4,
  padding: '6px 12px',
  fontSize: 14,
  cursor: active ? 'pointer' : 'default',
  flexShrink: 0,
} as const);

export function EntityPanel({
  play, selectedId, canUndo, canRedo, scrollMode, addMode, currentFrameHolderId,
  onAddAttack, onAddDefence, onEditLabel, onDeleteEntity, onUndo, onRedo,
  onToggleScroll, onAssignBall, onShare,
}: EntityPanelProps) {
  const selected = play.entities.find(e => e.id === selectedId);
  const ballActive = selected !== undefined && currentFrameHolderId === selected.id;

  return (
    <div style={{
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      gap: 4,
      padding: '3px 10px',
      flexShrink: 0,
    }}>
      <button style={btn(true, addMode === 'attack' ? '#E8272A' : 'rgba(232,39,42,0.4)')} onClick={onAddAttack}>+A</button>
      <button style={btn(true, addMode === 'defence' ? '#1755B8' : 'rgba(23,85,184,0.4)')} onClick={onAddDefence}>+D</button>
      <button style={btn(true, scrollMode ? '#555500' : undefined)} onClick={onToggleScroll}>▲▼</button>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, fontSize: 13 }}>
        {selected ? (
          <>
            <button
              onClick={onAssignBall}
              style={{
                ...btn(ballActive, '#BB6600'),
                padding: '3px 8px',
                display: 'flex',
                alignItems: 'center',
              }}
              title="このフレームでボールを保持"
            >
              <svg width="21" height="21" viewBox="-1 -1 2 2">
                <g transform="rotate(-45)">
                  <ellipse rx={0.75} ry={0.42} fill="#FFE600" stroke="rgba(0,0,0,0.2)" strokeWidth={0.04} />
                  <line x1={-0.70} y1={0} x2={0.70} y2={0} stroke="rgba(0,0,0,0.3)" strokeWidth={0.08} />
                  {[-0.25, 0, 0.25].map(x => (
                    <line key={x} x1={x} y1={-0.32} x2={x} y2={0.32} stroke="rgba(0,0,0,0.45)" strokeWidth={0.065} />
                  ))}
                </g>
              </svg>
            </button>
            <button
              onClick={onEditLabel}
              style={{
                background: '#555500',
                border: 'none',
                borderRadius: '4px 0 0 4px',
                color: 'white',
                padding: '4px 13px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {selected.label}
            </button>
            <button
              onClick={onDeleteEntity}
              style={{
                background: '#555500',
                border: 'none',
                borderLeft: '1px solid rgba(0,0,0,0.3)',
                borderRadius: '0 4px 4px 0',
                color: 'rgba(255,100,100,0.9)',
                padding: '4px 6px',
                cursor: 'pointer',
                fontSize: 11,
                lineHeight: 1,
              }}
            >
              ×
            </button>
          </>
        ) : null}
      </div>

      <button style={btn(canUndo)} onClick={onUndo} disabled={!canUndo}>←</button>
      <button style={btn(canRedo)} onClick={onRedo} disabled={!canRedo}>→</button>
      <button style={btn(true)} onClick={onShare} title="共有URLをコピー">🔗</button>
    </div>
  );
}
