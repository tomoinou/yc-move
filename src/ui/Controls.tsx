interface ControlsProps {
  currentTime: number;
  durationMs: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (t: number) => void;
}

export function Controls({
  currentTime, durationMs, isPlaying, onPlay, onPause, onSeek,
}: ControlsProps) {
  return (
    <div style={{
      background: '#1a1a1a',
      color: 'white',
      padding: '8px 12px',
      flexShrink: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: 4,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={isPlaying ? onPause : onPlay}
          style={{
            background: 'none',
            border: '1px solid rgba(255,255,255,0.4)',
            color: 'white',
            fontSize: 18,
            width: 40,
            height: 40,
            borderRadius: 4,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>
        <input
          type="range"
          min={0}
          max={durationMs}
          step={16}
          value={currentTime}
          onInput={(e) => onSeek(e.currentTarget.valueAsNumber)}
          onChange={() => {}}
          style={{ flex: 1, accentColor: '#E8272A' }}
        />
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', paddingLeft: 48 }}>
        {(currentTime / 1000).toFixed(1)}s / {(durationMs / 1000).toFixed(1)}s
      </div>
    </div>
  );
}
