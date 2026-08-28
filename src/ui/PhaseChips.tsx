interface PhaseChipsProps {
  markers: number[];
  currentPhaseIdx: number;
  currentTime: number;
  onSelect: (idx: number) => void;
  onAdd: () => void;
}

export function PhaseChips({
  markers, currentPhaseIdx, currentTime, onSelect, onAdd,
}: PhaseChipsProps) {
  const phaseTimes = [0, ...markers];
  const canAdd = !phaseTimes.includes(currentTime) && currentTime > 0;

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
        <button
          key={t}
          onClick={() => onSelect(i)}
          style={{
            background: currentPhaseIdx === i ? '#E8272A' : 'rgba(255,255,255,0.15)',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            padding: '4px 10px',
            fontSize: 13,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {'KF'}{i + 1}
          <span style={{ fontSize: 10, opacity: 0.7, marginLeft: 4 }}>
            {(t / 1000).toFixed(1)}{'s'}
          </span>
        </button>
      ))}
      <button
        onClick={onAdd}
        disabled={!canAdd}
        style={{
          background: 'rgba(255,255,255,0.08)',
          color: canAdd ? 'white' : 'rgba(255,255,255,0.3)',
          border: '1px dashed rgba(255,255,255,0.3)',
          borderRadius: 4,
          padding: '4px 10px',
          fontSize: 13,
          cursor: canAdd ? 'pointer' : 'default',
          flexShrink: 0,
        }}
      >
        ＋
      </button>
    </div>
  );
}
