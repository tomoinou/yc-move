import { useRef, useState, useEffect, useCallback } from 'react';
import { Pitch } from './Pitch.tsx';
import { Controls } from './Controls.tsx';
import { PhaseChips } from './PhaseChips.tsx';
import { EntityPanel } from './EntityPanel.tsx';
import { ScrollIndicator } from './ScrollIndicator.tsx';
import { usePlayStore } from '../state/playStore.ts';
import { useEditorStore } from '../state/editorStore.ts';
import { usePlayback } from '../state/usePlayback.ts';
import { FIELD } from '../core/field.ts';
import { VIEW_HEIGHT_M, fromScreen } from '../core/camera.ts';
import { entityPositionAt } from '../core/interpolate.ts';
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


const MAX_VIEW_Y = FIELD.lengthM - VH + FIELD.marginM;

export function Editor() {
  const { play, canUndo, canRedo, commit, undo, redo } = usePlayStore();
  const {
    selectedId, currentPhaseIdx, scrollMode, passMode, passFrom, addMode, viewY: editorViewY,
    select, setPhaseIdx, setScrollMode, setPassMode, setPassFrom, setAddMode, setViewY,
  } = useEditorStore();
  const { currentTime, isPlaying, play: playback, pause, seek } = usePlayback(play.durationMs);

  const svgRef = useRef<SVGSVGElement>(null);

  // Drag state — local only, not in Zustand
  const dragRef = useRef<{ entityId: string; moved: boolean } | null>(null);
  const [dragOverride, setDragOverride] = useState<{ entityId: string; pos: Vec2 } | null>(null);

  // Scroll state — local only
  const scrollRef = useRef<{ startClientY: number; startViewY: number } | null>(null);

  // Cursor position for pass arrow endpoint
  const [cursorPos, setCursorPos] = useState<Vec2 | null>(null);

  // Mutable ref so window listeners always read the latest values without re-registration
  const latestRef = useRef({ play, currentPhaseIdx, selectedId, editorViewY, scrollMode, passMode, passFrom, addMode });
  useEffect(() => {
    latestRef.current = { play, currentPhaseIdx, selectedId, editorViewY, scrollMode, passMode, passFrom, addMode };
  });

  // Sync editorViewY from play.viewY (e.g., after undo/redo)
  useEffect(() => {
    setViewY(play.viewY);
  }, [play.viewY, setViewY]);

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
    return clampCanonical(fromScreen(svgPt, latestRef.current.editorViewY, VH));
  }

  // Global pointer move/up for drag and scroll tracking
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      // スクロール処理
      if (scrollRef.current) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect) return;
        const deltaM = (e.clientY - scrollRef.current.startClientY) * VH / rect.height;
        const next = clamp(
          scrollRef.current.startViewY - deltaM,
          -FIELD.marginM,
          MAX_VIEW_Y,
        );
        setViewY(next);
        return;
      }

      // ドラッグ処理
      const drag = dragRef.current;
      if (drag) {
        const canonical = pointerToCanonical(e.clientX, e.clientY);
        if (!canonical) return;
        if (!drag.moved) dragRef.current = { ...drag, moved: true };
        setDragOverride({ entityId: drag.entityId, pos: canonical });
        return;
      }

      // パス矢印カーソル追跡
      const { passFrom: pf, passMode: pm } = latestRef.current;
      if (pm && pf) {
        const c = pointerToCanonical(e.clientX, e.clientY);
        if (c) setCursorPos(c);
      }
    };

    const handleUp = (e: PointerEvent) => {
      // スクロール終了 → viewY を play に保存
      if (scrollRef.current) {
        commit(draft => { draft.viewY = latestRef.current.editorViewY; });
        scrollRef.current = null;
        return;
      }

      const drag = dragRef.current;
      if (!drag) { setDragOverride(null); return; }

      if (drag.moved) {
        const rawPos = pointerToCanonical(e.clientX, e.clientY);
        if (rawPos) {
          const rect = svgRef.current?.getBoundingClientRect();
          const offsetM = rect ? 36 * VH / rect.height : 2;
          const canonical = clampCanonical({ x: rawPos.x, y: rawPos.y + offsetM });
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
  }, [commit, setViewY]);

  const handleTokenPointerDown = useCallback((entityId: string) => {
    const { passMode: pm, passFrom: pf, currentPhaseIdx: idx, play: cp } = latestRef.current;

    if (pm) {
      if (!pf) {
        setPassFrom(entityId);
      } else if (pf !== entityId) {
        const t = [0, ...cp.markers][idx] ?? 0;
        commit(draft => {
          const existing = draft.ball.events.findIndex(ev => ev.t === t);
          const event = { t, kind: 'pass' as const, from: pf, to: entityId, flightMs: 300 };
          if (existing >= 0) {
            draft.ball.events[existing] = event;
          } else {
            const ins = draft.ball.events.findIndex(ev => ev.t > t);
            if (ins === -1) draft.ball.events.push(event);
            else draft.ball.events.splice(ins, 0, event);
          }
          if (draft.ball.events.length === 1) draft.ball.initialHolder = pf;
        });
        setPassFrom(null);
        setCursorPos(null);
      }
      return;
    }

    select(entityId);
    dragRef.current = { entityId, moved: false };
  }, [select, commit, setPassFrom]);

  const handleSvgPointerDown = useCallback((canonical: Vec2, clientY: number) => {
    const { scrollMode: sm, passMode: pm, addMode: am,
            currentPhaseIdx: idx, play: cp, selectedId: sel } = latestRef.current;

    if (sm) {
      scrollRef.current = { startClientY: clientY, startViewY: latestRef.current.editorViewY };
      return;
    }

    if (am !== null) {
      let newId = '';
      commit(draft => {
        const id = `${am[0]}${Date.now()}`;
        newId = id;
        const isAttack = am === 'attack';
        const labelIdx = isAttack ? draft.nextAttackIdx : draft.nextDefenceIdx;
        const label = `${isAttack ? 'A' : 'D'}${labelIdx}`;
        if (isAttack) draft.nextAttackIdx = labelIdx + 1;
        else draft.nextDefenceIdx = labelIdx + 1;
        draft.entities.push({
          id,
          side: am,
          label,
          track: [{ t: 0, p: canonical }],
        });
        if (isAttack && draft.entities.filter(e => e.side === 'attack').length === 1) {
          draft.ball.initialHolder = id;
        }
      });
      setAddMode(null);
      setTimeout(() => select(newId), 0);
      return;
    }

    if (pm) {
      setPassFrom(null);
      setCursorPos(null);
      return;
    }

    if (!sel) return;
    const t = [0, ...cp.markers][idx] ?? 0;
    commit(draft => {
      const entity = draft.entities.find(e => e.id === sel);
      if (entity) setTrackKey(entity, t, clampCanonical(canonical));
    });
  }, [commit, setPassFrom, setAddMode, select]);

  const handleAddEntity = useCallback((side: 'attack' | 'defence') => {
    // トグル: 同じサイドなら OFF、違う or なければ ON
    setAddMode(addMode === side ? null : side);
    // addMode を ON にするとき他のモードをキャンセル
    if (addMode !== side) {
      setScrollMode(false);
      setPassMode(false);
      setPassFrom(null);
      setCursorPos(null);
    }
  }, [addMode, setAddMode, setScrollMode, setPassMode, setPassFrom]);

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
    let targetTime = currentTime;

    // マーカー時刻 or t=0 の場合は現在フェーズ + 1000ms をデフォルトに使用
    if (times.includes(targetTime) || targetTime <= 0) {
      targetTime = currentPhaseTime + 1000;
    }

    if (targetTime <= 0 || targetTime >= play.durationMs || times.includes(targetTime)) return;

    commit(draft => {
      draft.markers = [...draft.markers, targetTime].sort((a, b) => a - b);
    });
    const newIdx = [0, ...play.markers, targetTime].sort((a, b) => a - b).indexOf(targetTime);
    setPhaseIdx(newIdx);
    seek(targetTime);
  }, [currentTime, currentPhaseTime, play.markers, play.durationMs, commit, setPhaseIdx, seek]);

  const handlePhaseSelect = useCallback((idx: number) => {
    setPhaseIdx(idx);
    const t = [0, ...play.markers][idx] ?? 0;
    seek(t);
  }, [play.markers, setPhaseIdx, seek]);

  const handlePhaseDelete = useCallback((idx: number) => {
    // idx は phaseTimes のインデックス（0 は削除不可）
    if (idx <= 0) return;
    commit(draft => {
      draft.markers.splice(idx - 1, 1);
    });
    // 削除後に currentPhaseIdx が範囲外になる場合は直前に戻す
    if (currentPhaseIdx >= idx) setPhaseIdx(Math.max(0, currentPhaseIdx - 1));
  }, [commit, setPhaseIdx, currentPhaseIdx]);

  const handleEntityDelete = useCallback(() => {
    if (!selectedId) return;
    commit(draft => {
      draft.entities = draft.entities.filter(e => e.id !== selectedId);
      // ball の参照も整理
      if (draft.ball.initialHolder === selectedId) {
        draft.ball.initialHolder = draft.entities[0]?.id ?? '';
      }
      draft.ball.events = draft.ball.events.filter(
        ev => ev.from !== selectedId && ev.to !== selectedId,
      );
    });
    select(null);
  }, [selectedId, commit, select]);

  const handleToggleScroll = useCallback(() => {
    setScrollMode(!scrollMode);
    if (!scrollMode) {
      setPassMode(false);
      setPassFrom(null);
      setCursorPos(null);
      setAddMode(null);
    }
  }, [scrollMode, setScrollMode, setPassMode, setPassFrom, setAddMode]);

  const handleTogglePass = useCallback(() => {
    setPassMode(!passMode);
    setPassFrom(null);
    setCursorPos(null);
    if (!passMode) {
      setScrollMode(false);
      setAddMode(null);
    }
  }, [passMode, setPassMode, setPassFrom, setScrollMode, setAddMode]);

  // passArrow: passFrom entity の現在フェーズ位置 → cursorPos
  const passFromEntity = passFrom ? play.entities.find(e => e.id === passFrom) : null;
  const passArrow = passMode && passFromEntity && cursorPos
    ? { from: entityPositionAt(passFromEntity, currentPhaseTime), to: cursorPos }
    : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
        <Pitch
          play={play}
          viewY={editorViewY}
          currentTime={currentTime}
          selectedId={selectedId}
          onionSkinTimes={onionSkinTimes}
          dragOverride={dragOverride}
          scrollMode={scrollMode}
          passArrow={passArrow}
          svgRef={svgRef}
          onSvgPointerDown={handleSvgPointerDown}
          onTokenPointerDown={handleTokenPointerDown}
        />
        {scrollMode && <ScrollIndicator viewY={editorViewY} />}
      </div>
      <PhaseChips
        markers={play.markers}
        currentPhaseIdx={currentPhaseIdx}
        onSelect={handlePhaseSelect}
        onAdd={handlePhaseAdd}
        onDelete={handlePhaseDelete}
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
        scrollMode={scrollMode}
        passMode={passMode}
        addMode={addMode}
        onAddAttack={() => handleAddEntity('attack')}
        onAddDefence={() => handleAddEntity('defence')}
        onEditLabel={handleEditLabel}
        onDeleteEntity={handleEntityDelete}
        onUndo={undo}
        onRedo={redo}
        onToggleScroll={handleToggleScroll}
        onTogglePass={handleTogglePass}
      />
    </div>
  );
}
