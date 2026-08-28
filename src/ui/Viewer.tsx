import { useRef, useState, useEffect } from 'react';
import type { Play } from '../core/types.ts';
import { Pitch } from './Pitch.tsx';
import { Controls } from './Controls.tsx';
import { usePlayback } from '../state/usePlayback.ts';
import { VIEW_HEIGHT_M, SVG_WIDTH_M } from '../core/camera.ts';

interface ViewerProps {
  play: Play;
}

export function Viewer({ play }: ViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewH, setViewH] = useState(VIEW_HEIGHT_M);
  const lastPhaseTime = play.markers.length > 0 ? play.markers[play.markers.length - 1] + 100 : 0;
  const { currentTime, isPlaying, play: playback, pause, seek } = usePlayback(play.durationMs, lastPhaseTime);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) setViewH(height * SVG_WIDTH_M / width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
        <Pitch
          play={play}
          viewY={play.viewY}
          viewH={viewH}
          currentTime={currentTime}
          selectedId={null}
          onionSkinTimes={[]}
          dragOverride={null}
          scrollMode={false}
          svgRef={svgRef}
          onSvgPointerDown={() => {}}
        />
      </div>
      <Controls
        currentTime={currentTime}
        durationMs={play.durationMs}
        isPlaying={isPlaying}
        onPlay={playback}
        onPause={pause}
        onSeek={seek}
      />
    </div>
  );
}
