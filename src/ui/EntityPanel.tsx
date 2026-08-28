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
  onToggleScroll, onAssignBall,
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
      <button style={btn(true, addMode === 'attack' ? '#E8272A' : '#8B0000')} onClick={onAddAttack}>+A</button>
      <button style={btn(true, addMode === 'defence' ? '#1755B8' : '#003580')} onClick={onAddDefence}>+D</button>
      <button style={btn(true, scrollMode ? '#555500' : undefined)} onClick={onToggleScroll}>↕</button>

      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 4, fontSize: 13 }}>
        {selected ? (
          <>
            <button
              onClick={onAssignBall}
              style={{
                ...btn(ballActive, '#BB6600'),
                padding: '3px 8px',
                fontSize: 15,
              }}
              title="このフレームでボールを保持"
            >
              🏉
            </button>
            <button
              onClick={onEditLabel}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.35)',
                borderRadius: '4px 0 0 4px',
                color: 'white',
                padding: '3px 10px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              {selected.label}
            </button>
            <button
              onClick={onDeleteEntity}
              style={{
                background: 'none',
                border: '1px solid rgba(255,255,255,0.35)',
                borderLeft: 'none',
                borderRadius: '0 4px 4px 0',
                color: 'rgba(255,100,100,0.9)',
                padding: '3px 8px',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              ×
            </button>
          </>
        ) : null}
      </div>

      <button style={btn(canUndo)} onClick={onUndo} disabled={!canUndo}>↩</button>
      <button style={btn(canRedo)} onClick={onRedo} disabled={!canRedo}>↪</button>
    </div>
  );
}
