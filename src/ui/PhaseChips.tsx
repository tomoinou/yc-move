import { useRef, useEffect } from 'react';

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
          gap: 4,
          padding: '3px 0 3px 8px',
          scrollbarWidth: 'none',
        }}
      >
        {phaseTimes.map((t, i) => {
          const isActive = isEditActive && !isPlaying && i === currentPhaseIdx && Math.abs(currentTime - t) <= AT_PHASE_TOLERANCE_MS;
          return (
            <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
              <button
                onClick={() => isActive ? onDeactivate() : onSelect(i)}
                style={{
                  background: isActive ? '#555500' : 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: 'none',
                  borderRadius: (i === 0 || !isActive) ? 4 : '4px 0 0 4px',
                  padding: isActive ? '4px 13px' : '4px 10px',
                  fontSize: 13,
                  cursor: 'pointer',
                }}
              >
                {'F'}{i + 1}
              </button>
              {i > 0 && isActive && (
                <button
                  onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                  style={{
                    background: '#555500',
                    color: 'rgba(255,255,255,0.7)',
                    border: 'none',
                    borderLeft: '1px solid rgba(0,0,0,0.3)',
                    borderRadius: '0 4px 4px 0',
                    padding: '4px 6px',
                    fontSize: 11,
                    cursor: 'pointer',
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* + ボタン: 右端固定 */}
      <button
        onClick={onAdd}
        style={{
          flexShrink: 0,
          background: 'rgba(255,255,255,0.08)',
          color: 'white',
          border: '1px dashed rgba(255,255,255,0.3)',
          borderRadius: 4,
          padding: '4px 10px',
          fontSize: 13,
          cursor: 'pointer',
          margin: '0 10px',
        }}
      >
        ＋
      </button>
    </div>
  );
}
