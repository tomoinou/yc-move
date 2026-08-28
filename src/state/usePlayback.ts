import { useCallback, useEffect, useRef, useState } from 'react';

export function usePlayback(durationMs: number) {
  const [currentTime, setCurrentTime] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const isPlayingRef  = useRef(false);
  const currentTimeRef = useRef(0);
  const lastTsRef     = useRef<number | null>(null);
  const rafIdRef      = useRef<number | null>(null);

  // tickRef holds the latest tick closure so RAF always calls the up-to-date version.
  const tickRef = useRef<(ts: number) => void>(() => {});

  useEffect(() => {
    tickRef.current = (ts: number) => {
      if (!isPlayingRef.current) return;

      if (lastTsRef.current !== null) {
        const dt = ts - lastTsRef.current;
        const next = Math.min(currentTimeRef.current + dt, durationMs);
        currentTimeRef.current = next;
        setCurrentTime(next);
        if (next >= durationMs) {
          isPlayingRef.current = false;
          setIsPlaying(false);
          lastTsRef.current = null;
          return;
        }
      }

      lastTsRef.current = ts;
      rafIdRef.current = requestAnimationFrame(tickRef.current);
    };
  }, [durationMs]);

  const play = useCallback(() => {
    if (isPlayingRef.current) return;
    // Restart from beginning if already at end
    if (currentTimeRef.current >= durationMs) {
      currentTimeRef.current = 0;
      setCurrentTime(0);
    }
    isPlayingRef.current = true;
    setIsPlaying(true);
    lastTsRef.current = null;
    rafIdRef.current = requestAnimationFrame(tickRef.current);
  }, [durationMs]);

  const pause = useCallback(() => {
    isPlayingRef.current = false;
    setIsPlaying(false);
    lastTsRef.current = null;
    if (rafIdRef.current !== null) {
      cancelAnimationFrame(rafIdRef.current);
      rafIdRef.current = null;
    }
  }, []);

  const seek = useCallback((t: number) => {
    const clamped = Math.max(0, Math.min(t, durationMs));
    currentTimeRef.current = clamped;
    setCurrentTime(clamped);
    lastTsRef.current = null; // prevent jump on next RAF tick
  }, [durationMs]);

  // Cancel RAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current !== null) cancelAnimationFrame(rafIdRef.current);
    };
  }, []);

  return { currentTime, isPlaying, play, pause, seek };
}
