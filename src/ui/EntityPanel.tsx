import type { Play } from '../core/types.ts';

interface EntityPanelProps {
  play: Play;
  selectedId: string | null;
  canUndo: boolean;
  canRedo: boolean;
  scrollMode: boolean;
  passMode: boolean;
  onAddAttack: () => void;
  onAddDefence: () => void;
  onEditLabel: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onToggleScroll: () => void;
  onTogglePass: () => void;
}

const btn = (active: boolean, color?: string) => ({
  background: active ? (color ?? 'rgba(255,255,255,0.15)') : 'rgba(255,255,255,0.05)',
  color: active ? 'white' : 'rgba(255,255,255,0.3)',
  border: 'none',
  borderRadius: 4,
  padding: '6px 10px',
  fontSize: 14,
  cursor: active ? 'pointer' : 'default',
  flexShrink: 0,
} as const);

export function EntityPanel({
  play, selectedId, canUndo, canRedo, scrollMode, passMode,
  onAddAttack, onAddDefence, onEditLabel, onUndo, onRedo,
  onToggleScroll, onTogglePass,
}: EntityPanelProps) {
  const selected = play.entities.find(e => e.id === selectedId);

  return (
    <div style={{
      background: '#1a1a1a',
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 10px',
      flexShrink: 0,
    }}>
      <button style={btn(true, '#8B0000')} onClick={onAddAttack}>+A</button>
      <button style={btn(true, '#003580')} onClick={onAddDefence}>+D</button>
      <button style={btn(true, scrollMode ? '#555500' : undefined)} onClick={onToggleScroll}>↕</button>
      <button style={btn(true, passMode ? '#556600' : undefined)} onClick={onTogglePass}>→</button>

      <div style={{ flex: 1, textAlign: 'center', fontSize: 13 }}>
        {selected ? (
          <button
            onClick={onEditLabel}
            style={{
              background: 'none',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: 4,
              color: 'white',
              padding: '3px 10px',
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {selected.label}
          </button>
        ) : (
          <span style={{ color: 'rgba(255,255,255,0.4)' }}>未選択</span>
        )}
      </div>

      <button style={btn(canUndo)} onClick={onUndo} disabled={!canUndo}>↩</button>
      <button style={btn(canRedo)} onClick={onRedo} disabled={!canRedo}>↪</button>
    </div>
  );
}
