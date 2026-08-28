import { useRef, useState, useEffect, useCallback } from 'react';
import type { Play } from '../core/types.ts';
import { Pitch } from './Pitch.tsx';
import { Controls } from './Controls.tsx';
import { usePlayback } from '../state/usePlayback.ts';
import { VIEW_HEIGHT_M, SVG_WIDTH_M } from '../core/camera.ts';
import { FIELD } from '../core/field.ts';

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

interface ViewerProps {
  play: Play;
}

export function Viewer({ play }: ViewerProps) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [viewH, setViewH] = useState(VIEW_HEIGHT_M);
  const [viewY, setViewY] = useState(FIELD.halfM - VIEW_HEIGHT_M / 2);
  const initialCenteredRef = useRef(false);
  const lastPhaseTime = play.markers.length > 0 ? play.markers[play.markers.length - 1] + 100 : 0;
  const { currentTime, isPlaying, play: playback, pause, seek } = usePlayback(play.durationMs, lastPhaseTime);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0) {
        const vh = height * SVG_WIDTH_M / width;
        setViewH(vh);
        if (!initialCenteredRef.current) {
          initialCenteredRef.current = true;
          setViewY(FIELD.halfM - vh / 2);
        }
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const scrollRef = useRef<{ startClientY: number; startViewY: number } | null>(null);
  const activePointerIds = useRef<Set<number>>(new Set());
  const viewYRef = useRef(viewY);
  useEffect(() => { viewYRef.current = viewY; }, [viewY]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    activePointerIds.current.add(e.pointerId);
    if (activePointerIds.current.size === 1) {
      scrollRef.current = { startClientY: e.clientY, startViewY: viewYRef.current };
    } else {
      // 2本目の指が来たらスクロールをキャンセルしてブラウザのピンチズームに委ねる
      scrollRef.current = null;
    }
  }, []);

  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (!scrollRef.current) return;
      const rect = svgRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0) return;
      const scale = SVG_WIDTH_M / rect.width;
      const vh = rect.height * scale;
      const deltaM = (e.clientY - scrollRef.current.startClientY) * scale;
      const minViewY = -(FIELD.inGoalM + FIELD.marginM);
      const maxViewY = Math.max(minViewY, FIELD.lengthM + FIELD.inGoalM + FIELD.marginM - vh);
      setViewY(clamp(scrollRef.current.startViewY + deltaM, minViewY, maxViewY));
    };
    const handleUp = (e: PointerEvent) => {
      activePointerIds.current.delete(e.pointerId);
      if (activePointerIds.current.size === 0) scrollRef.current = null;
    };
    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    window.addEventListener('pointercancel', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
      window.removeEventListener('pointercancel', handleUp);
    };
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div
        style={{ flex: '1 1 0', minHeight: 0, position: 'relative', touchAction: 'pinch-zoom' }}
        onPointerDown={handlePointerDown}
      >
        <Pitch
          play={play}
          viewY={viewY}
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
