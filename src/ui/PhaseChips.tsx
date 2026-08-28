import { useRef, useEffect } from 'react';

interface PhaseChipsProps {
  markers: number[];
  currentPhaseIdx: number;
  onSelect: (idx: number) => void;
  onAdd: () => void;
  onDelete: (idx: number) => void;
}

export function PhaseChips({
  markers, currentPhaseIdx, onSelect, onAdd, onDelete,
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
          gap: 6,
          padding: '6px 0 6px 10px',
          scrollbarWidth: 'none',
        }}
      >
        {phaseTimes.map((_t, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
            <button
              onClick={() => onSelect(i)}
              style={{
                background: currentPhaseIdx === i ? '#E8272A' : 'rgba(255,255,255,0.15)',
                color: 'white',
                border: 'none',
                borderRadius: i === 0 ? 4 : '4px 0 0 4px',
                padding: '4px 10px',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {'F'}{i}
            </button>
            {i > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); onDelete(i); }}
                style={{
                  background: currentPhaseIdx === i ? '#E8272A' : 'rgba(255,255,255,0.15)',
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
        ))}
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
