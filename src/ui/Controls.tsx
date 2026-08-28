interface ControlsProps {
  currentTime: number;
  durationMs: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (t: number) => void;
  onEditDuration?: () => void;
}

export function Controls({
  currentTime, durationMs, isPlaying, onPlay, onPause, onSeek, onEditDuration,
}: ControlsProps) {
  return (
    <div style={{
      background: '#1a1a1a',
      color: 'white',
      padding: '4px 10px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
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
        {isPlaying ? '⏸︎' : '▶'}
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
      <div
        onClick={onEditDuration}
        style={{
          fontSize: 11, color: 'rgba(255,255,255,0.7)', flexShrink: 0,
          cursor: onEditDuration ? 'pointer' : undefined,
          padding: '2px 4px', borderRadius: 3,
          background: onEditDuration ? 'rgba(255,255,255,0.08)' : undefined,
        }}
      >
        {Math.round(currentTime / 1000)}/<u>{Math.round(durationMs / 1000)}</u>
      </div>
    </div>
  );
}
