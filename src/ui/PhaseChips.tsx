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

  return (
    <div style={{
      background: '#111',
      display: 'flex',
      gap: 6,
      padding: '6px 10px',
      overflowX: 'auto',
      flexShrink: 0,
      alignItems: 'center',
    }}>
      {phaseTimes.map((t, i) => (
        <div key={t} style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
          <button
            onClick={() => onSelect(i)}
            style={{
              background: currentPhaseIdx === i ? '#E8272A' : 'rgba(255,255,255,0.15)',
              color: 'white',
              border: 'none',
              borderRadius: i === 0 || phaseTimes.length === 1 ? 4 : '4px 0 0 4px',
              padding: '4px 10px',
              fontSize: 13,
              cursor: 'pointer',
            }}
          >
            {'F'}{i + 1}
            <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
              {i}
            </span>
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
      <button
        onClick={onAdd}
        style={{
          background: 'rgba(255,255,255,0.08)',
          color: 'white',
          border: '1px dashed rgba(255,255,255,0.3)',
          borderRadius: 4,
          padding: '4px 10px',
          fontSize: 13,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        ＋
      </button>
    </div>
  );
}
