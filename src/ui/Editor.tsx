import { useRef, useState, useEffect, useCallback } from 'react';
import { Pitch } from './Pitch.tsx';
import { Controls } from './Controls.tsx';
import { PhaseChips } from './PhaseChips.tsx';
import { EntityPanel } from './EntityPanel.tsx';
import { usePlayStore } from '../state/playStore.ts';
import { useEditorStore } from '../state/editorStore.ts';
import { usePlayback } from '../state/usePlayback.ts';
import { FIELD } from '../core/field.ts';
import { VIEW_HEIGHT_M, fromScreen } from '../core/camera.ts';
import type { Vec2, Entity } from '../core/types.ts';

const VH = VIEW_HEIGHT_M;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function clampCanonical(p: Vec2): Vec2 {
  return {
    x: clamp(p.x, -FIELD.marginM, FIELD.widthM + FIELD.marginM),
    y: clamp(p.y, -FIELD.marginM, FIELD.lengthM + FIELD.marginM),
  };
}

function setTrackKey(entity: Entity, t: number, p: Vec2): void {
  const idx = entity.track.findIndex(k => k.t === t);
  if (idx >= 0) {
    entity.track[idx].p = p;
  } else {
    const ins = entity.track.findIndex(k => k.t > t);
    if (ins === -1) entity.track.push({ t, p });
    else entity.track.splice(ins, 0, { t, p });
  }
}

function nextAttackLabel(entities: Entity[]): string {
  const used = new Set(entities.filter(e => e.side === 'attack').map(e => e.label));
  for (let i = 1; i <= 9; i++) {
    if (!used.has(String(i))) return String(i);
  }
  return String(entities.filter(e => e.side === 'attack').length + 1);
}

function nextDefenceLabel(entities: Entity[]): string {
  const used = new Set(entities.filter(e => e.side === 'defence').map(e => e.label));
  for (let i = 1; i <= 9; i++) {
    const label = `D${i}`;
    if (!used.has(label)) return label;
  }
  return `D${entities.filter(e => e.side === 'defence').length + 1}`;
}

export function Editor() {
  const { play, canUndo, canRedo, commit, undo, redo } = usePlayStore();
  const { selectedId, currentPhaseIdx, select, setPhaseIdx } = useEditorStore();
  const { currentTime, isPlaying, play: playback, pause, seek } = usePlayback(play.durationMs);

  const svgRef = useRef<SVGSVGElement>(null);

  // Drag state — local only, not in Zustand
  const dragRef = useRef<{ entityId: string; moved: boolean } | null>(null);
  const [dragOverride, setDragOverride] = useState<{ entityId: string; pos: Vec2 } | null>(null);

  // Mutable ref so window listeners always read the latest values without re-registration
  const latestRef = useRef({ play, currentPhaseIdx, selectedId });
  useEffect(() => {
    latestRef.current = { play, currentPhaseIdx, selectedId };
  });

  const phaseTimes = [0, ...play.markers];
  const currentPhaseTime = phaseTimes[currentPhaseIdx] ?? 0;

  // Onion skin: show adjacent phase positions
  const onionSkinTimes: number[] = [];
  if (currentPhaseIdx > 0) onionSkinTimes.push(phaseTimes[currentPhaseIdx - 1]);
  if (currentPhaseIdx < phaseTimes.length - 1) onionSkinTimes.push(phaseTimes[currentPhaseIdx + 1]);

  function pointerToCanonical(clientX: number, clientY: number): Vec2 | null {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const svgPt: Vec2 = {
      x: (clientX - rect.left) * (44 / rect.width),
      y: (clientY - rect.top) * (VH / rect.height),
    };
    return clampCanonical(fromScreen(svgPt, latestRef.current.play.viewY, VH));
  }

  // Global pointer move/up for drag tracking
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const canonical = pointerToCanonical(e.clientX, e.clientY);
      if (!canonical) return;
      if (!drag.moved) dragRef.current = { ...drag, moved: true };
      setDragOverride({ entityId: drag.entityId, pos: canonical });
    };

    const handleUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) { setDragOverride(null); return; }

      if (drag.moved) {
        const canonical = pointerToCanonical(e.clientX, e.clientY);
        if (canonical) {
          const { currentPhaseIdx: idx, play: currentPlay } = latestRef.current;
          const t = [0, ...currentPlay.markers][idx] ?? 0;
          commit(draft => {
            const entity = draft.entities.find(en => en.id === drag.entityId);
            if (entity) setTrackKey(entity, t, canonical);
          });
        }
      }

      dragRef.current = null;
      setDragOverride(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [commit]);

  const handleTokenPointerDown = useCallback((entityId: string) => {
    select(entityId);
    dragRef.current = { entityId, moved: false };
  }, [select]);

  const handlePitchPointerDown = useCallback((canonical: Vec2) => {
    const { selectedId: sel, currentPhaseIdx: idx, play: currentPlay } = latestRef.current;
    if (!sel) return;
    const t = [0, ...currentPlay.markers][idx] ?? 0;
    commit(draft => {
      const entity = draft.entities.find(e => e.id === sel);
      if (entity) setTrackKey(entity, t, clampCanonical(canonical));
    });
  }, [commit]);

  const handleAddEntity = useCallback((side: 'attack' | 'defence') => {
    let newId = '';
    commit(draft => {
      const id = `${side[0]}${Date.now()}`;
      newId = id;
      const label = side === 'attack'
        ? nextAttackLabel(draft.entities)
        : nextDefenceLabel(draft.entities);
      const defaultY = side === 'attack' ? 5 : 10;
      draft.entities.push({
        id,
        side,
        label,
        track: [{ t: 0, p: { x: FIELD.widthM / 2, y: defaultY } }],
      });
      if (side === 'attack' && draft.entities.filter(e => e.side === 'attack').length === 1) {
        draft.ball.initialHolder = id;
      }
    });
    // select after commit (newId is set synchronously before re-render)
    setTimeout(() => select(newId), 0);
  }, [commit, select]);

  const handleEditLabel = useCallback(() => {
    if (!selectedId) return;
    const entity = play.entities.find(e => e.id === selectedId);
    if (!entity) return;
    const newLabel = window.prompt('ラベルを入力 (1〜3文字)', entity.label);
    if (!newLabel) return;
    const codepoints = Array.from(newLabel);
    if (codepoints.length < 1 || codepoints.length > 3) {
      window.alert('ラベルは 1〜3 文字で入力してください');
      return;
    }
    commit(draft => {
      const e = draft.entities.find(en => en.id === selectedId);
      if (e) e.label = newLabel;
    });
  }, [selectedId, play.entities, commit]);

  const handlePhaseAdd = useCallback(() => {
    const times = [0, ...play.markers];
    if (times.includes(currentTime) || currentTime <= 0) return;
    commit(draft => {
      draft.markers = [...draft.markers, currentTime].sort((a, b) => a - b);
    });
    // Select the new chip index
    const newIdx = [0, ...play.markers, currentTime].sort((a, b) => a - b).indexOf(currentTime);
    setPhaseIdx(newIdx);
  }, [currentTime, play.markers, commit, setPhaseIdx]);

  const handlePhaseSelect = useCallback((idx: number) => {
    setPhaseIdx(idx);
    const t = [0, ...play.markers][idx] ?? 0;
    seek(t);
  }, [play.markers, setPhaseIdx, seek]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: '1 1 0', minHeight: 0 }}>
        <Pitch
          play={play}
          viewY={play.viewY}
          currentTime={currentPhaseTime}
          selectedId={selectedId}
          onionSkinTimes={onionSkinTimes}
          dragOverride={dragOverride}
          svgRef={svgRef}
          onPitchPointerDown={handlePitchPointerDown}
          onTokenPointerDown={handleTokenPointerDown}
        />
      </div>
      <PhaseChips
        markers={play.markers}
        currentPhaseIdx={currentPhaseIdx}
        currentTime={currentTime}
        onSelect={handlePhaseSelect}
        onAdd={handlePhaseAdd}
      />
      <Controls
        currentTime={currentTime}
        durationMs={play.durationMs}
        isPlaying={isPlaying}
        onPlay={playback}
        onPause={pause}
        onSeek={seek}
      />
      <EntityPanel
        play={play}
        selectedId={selectedId}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddAttack={() => handleAddEntity('attack')}
        onAddDefence={() => handleAddEntity('defence')}
        onEditLabel={handleEditLabel}
        onUndo={undo}
        onRedo={redo}
      />
    </div>
  );
}
