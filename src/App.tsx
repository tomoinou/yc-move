import { Pitch } from './ui/Pitch.tsx';
import { Controls } from './ui/Controls.tsx';
import { samplePlay } from './ui/samplePlay.ts';
import { usePlayback } from './state/usePlayback.ts';

export default function App() {
  const { currentTime, isPlaying, play, pause, seek } = usePlayback(samplePlay.durationMs);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: '1 1 0', minHeight: 0 }}>
        <Pitch play={samplePlay} currentTime={currentTime} />
      </div>
      <Controls
        currentTime={currentTime}
        durationMs={samplePlay.durationMs}
        isPlaying={isPlaying}
        onPlay={play}
        onPause={pause}
        onSeek={seek}
      />
    </div>
  );
}
