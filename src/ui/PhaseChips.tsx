import { useRef, useEffect } from 'react';
import { BTN_H, LABEL_W, DEL_W, STD_W, GAP_IN_GROUP, GAP_BETWEEN_GROUPS, ROW_PAD_X, ROW_PAD_Y } from './layout.ts';

const AT_PHASE_TOLERANCE_MS = 50;

interface PhaseChipsProps {
  markers: number[];
  currentTime: number;
  isPlaying: boolean;
  isEditActive: boolean;
  currentPhaseIdx: number;
  onSelect: (idx: number) => void;
  onDeactivate: () => void;
  onAdd: () => void;
  onDelete: (idx: number) => void;
}

export function PhaseChips({
  markers, currentTime, isPlaying, isEditActive, currentPhaseIdx, onSelect, onDeactivate, onAdd, onDelete,
}: PhaseChipsProps) {
  const phaseTimes = [0, ...markers];
  const scrollRef = useRef<HTMLDivElement>(null);

  // 新チップ追加時に右端までスクロール
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [markers.length]);

  return (
    <div style={{
      background: '#111',
      display: 'flex',
      alignItems: 'center',
      gap: GAP_BETWEEN_GROUPS,
      padding: `${ROW_PAD_Y}px ${ROW_PAD_X}px`,
      flexShrink: 0,
    }}>
      {/* チップ群: 右から溢れず左にスクロール */}
      <div
        ref={scrollRef}
        style={{
          flex: '1 1 0',
          minWidth: 0,
          overflowX: 'auto',
          display: 'flex',
          gap: GAP_IN_GROUP,
          scrollbarWidth: 'none',
        }}
      >
        {phaseTimes.map((t, i) => {
          const isActive = isEditActive && !isPlaying && i === currentPhaseIdx && Math.abs(currentTime - t) <= AT_PHASE_TOLERANCE_MS;
          const hasDelete = i > 0 && isActive;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => isActive ? onDeactivate() : onSelect(i)}
                style={{
                  background: isActive ? '#555500' : 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: 'none',
                  borderRadius: hasDelete ? '4px 0 0 4px' : 4,
                  width: isActive ? LABEL_W : STD_W,
                  height: BTN_H,
                  padding: 0,
                  fontSize: 13,
                  cursor: 'pointer',
                  flexShrink: 0,
                }}
              >
                {'f'}{i + 1}
              </button>
              {hasDelete && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                  style={{
                    background: '#555500',
                    color: 'rgba(255,100,100,0.9)',
                    border: 'none',
                    borderLeft: '1px solid rgba(0,0,0,0.3)',
                    borderRadius: '0 4px 4px 0',
                    width: DEL_W,
                    height: BTN_H,
                    padding: 0,
                    fontSize: 11,
                    cursor: 'pointer',
                    lineHeight: 1,
                    flexShrink: 0,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* + ボタン: 右端固定（共有ボタンと縦に揃う） */}
      <button
        onClick={onAdd}
        style={{
          flexShrink: 0,
          boxSizing: 'border-box',
          width: STD_W,
          height: BTN_H,
          padding: 0,
          background: 'rgba(255,255,255,0.08)',
          color: 'white',
          border: '1px dashed rgba(255,255,255,0.3)',
          borderRadius: 4,
          fontSize: 13,
          cursor: 'pointer',
        }}
      >
        ＋
      </button>
    </div>
  );
}
