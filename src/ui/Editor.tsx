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
import { VIEW_HEIGHT_M, SVG_WIDTH_M, fromScreen } from '../core/camera.ts';
import { ballStateAt } from '../core/ball.ts';
import { entityPositionAt } from '../core/interpolate.ts';
import { encodePlay } from '../core/share.ts';
import type { Vec2, Entity } from '../core/types.ts';

const AT_PHASE_TOLERANCE_MS = 50;

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

function clampCanonical(p: Vec2): Vec2 {
  return {
    x: clamp(p.x, -FIELD.marginM, FIELD.widthM + FIELD.marginM),
    y: clamp(p.y, -FIELD.inGoalM, FIELD.lengthM + FIELD.inGoalM),
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


export function Editor() {
  const { play, canUndo, canRedo, commit, undo, redo } = usePlayStore();
  const {
    selectedId, currentPhaseIdx, isEditActive, scrollMode, addMode, viewY: editorViewY,
    select, setPhaseIdx, setIsEditActive, setScrollMode, setAddMode, setViewY,
  } = useEditorStore();
  const lastPhaseTime = play.markers.length > 0 ? play.markers[play.markers.length - 1] + 100 : 0;
  const { currentTime, isPlaying, play: playback, pause, seek } = usePlayback(play.durationMs, lastPhaseTime);

  const svgRef = useRef<SVGSVGElement>(null);
  const [viewH, setViewH] = useState(VIEW_HEIGHT_M);
  const initialCenteredRef = useRef(false);

  // play が変わるたびにバックグラウンドで共有 URL を先読みしておく
  const [shareUrl, setShareUrl] = useState('');
  useEffect(() => {
    let active = true;
    encodePlay(play).then(encoded => {
      if (active) setShareUrl(`${location.origin}${location.pathname}#p=${encoded}`);
    });
    return () => { active = false; };
  }, [play]);

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
  }, [setViewY]);

  // ドラッグ状態（ローカルのみ）
  const dragRef = useRef<{ entityId: string; moved: boolean } | null>(null);
  const [dragOverride, setDragOverride] = useState<{ entityId: string; pos: Vec2 } | null>(null);

  // スクロール状態（ローカルのみ）
  const scrollRef = useRef<{ startClientY: number; startViewY: number } | null>(null);


  const phaseTimes = [0, ...play.markers];
  const currentPhaseTime = phaseTimes[currentPhaseIdx] ?? 0;
  const isAtPhase = isEditActive && !isPlaying && Math.abs(currentTime - currentPhaseTime) <= AT_PHASE_TOLERANCE_MS;

  // 最新値を window リスナーから参照するための mutable ref
  const latestRef = useRef({ play, currentPhaseIdx, selectedId, editorViewY, scrollMode, addMode, isAtPhase, currentTime });
  useEffect(() => {
    latestRef.current = { play, currentPhaseIdx, selectedId, editorViewY, scrollMode, addMode, isAtPhase, currentTime };
  });

  // undo/redo 後の viewY を反映
  useEffect(() => {
    setViewY(play.viewY);
  }, [play.viewY, setViewY]);

  // 再生開始時に編集モードを解除
  useEffect(() => {
    if (isPlaying) setIsEditActive(false);
  }, [isPlaying, setIsEditActive]);

  // オニオンスキン: 停止中かつフレーム時刻一致時のみ前フレームをゴースト表示
  const onionSkinTimes: number[] = [];
  if (!isPlaying) {
    const activeIdx = phaseTimes.findIndex(t => Math.abs(currentTime - t) <= 50);
    if (activeIdx > 0) onionSkinTimes.push(phaseTimes[activeIdx - 1]);
  }

  // 現フレームのボール保持者（🏉 ボタンのハイライト用）
  const currentFrameHolderId = ballStateAt(play, currentPhaseTime).holderId;

  function pointerToCanonical(clientX: number, clientY: number): Vec2 | null {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return null;
    const scale = SVG_WIDTH_M / rect.width;
    const svgPt: Vec2 = {
      x: (clientX - rect.left) * scale,
      y: (clientY - rect.top) * scale,
    };
    const vh = rect.height * scale;
    return clampCanonical(fromScreen(svgPt, latestRef.current.editorViewY, vh));
  }

  // グローバル pointermove / pointerup
  useEffect(() => {
    const handleMove = (e: PointerEvent) => {
      if (scrollRef.current) {
        const rect = svgRef.current?.getBoundingClientRect();
        if (!rect || rect.width === 0) return;
        const scale = SVG_WIDTH_M / rect.width;
        const deltaM = (e.clientY - scrollRef.current.startClientY) * scale;
        const vh = rect.height * scale;
        const minViewY = -(FIELD.inGoalM + FIELD.marginM);
        const maxViewY = Math.max(minViewY, FIELD.lengthM + FIELD.inGoalM + FIELD.marginM - vh);
        const next = clamp(scrollRef.current.startViewY + deltaM, minViewY, maxViewY);
        setViewY(next);
        return;
      }

      const drag = dragRef.current;
      if (drag) {
        const canonical = pointerToCanonical(e.clientX, e.clientY);
        if (!canonical) return;
        if (!drag.moved) dragRef.current = { ...drag, moved: true };
        setDragOverride({ entityId: drag.entityId, pos: canonical });
      }
    };

    const handleUp = (e: PointerEvent) => {
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
          const canonical = clampCanonical(rawPos);
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

  // フレーム点灯中でなければ選択解除して離脱
  useEffect(() => {
    if (!isAtPhase && selectedId) select(null);
  }, [isAtPhase, selectedId, select]);

  const handleSvgPointerDown = useCallback((canonical: Vec2, clientY: number) => {
    const { scrollMode: sm, addMode: am, isAtPhase: iap, play: cp, currentTime: ct } = latestRef.current;

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
          if (draft.ball.holders.length === 0) {
            draft.ball.holders = [{ t: 0, holderId: id }];
          }
        }
      });
      setAddMode(null);
      setTimeout(() => select(newId), 0);
      return;
    }

    if (!iap) return;

    // タップ位置から最近接プレイヤーを探す
    const rect = svgRef.current?.getBoundingClientRect();
    const hitRadiusM = rect && rect.width > 0 ? Math.max(5, 44 * SVG_WIDTH_M / rect.width) : 5;
    let nearestId: string | null = null;
    let nearestDist = Infinity;
    for (const entity of cp.entities) {
      const pos = entityPositionAt(entity, ct);
      const dx = canonical.x - pos.x;
      const dy = canonical.y - pos.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist <= hitRadiusM && dist < nearestDist) {
        nearestId = entity.id;
        nearestDist = dist;
      }
    }

    if (nearestId === null) return;

    if (latestRef.current.selectedId === nearestId) {
      select(null);
    } else {
      select(nearestId);
      dragRef.current = { entityId: nearestId, moved: false };
    }
  }, [commit, setAddMode, select]);

  const handleAddEntity = useCallback((side: 'attack' | 'defence') => {
    setAddMode(addMode === side ? null : side);
    if (addMode !== side) {
      setScrollMode(false);
    }
  }, [addMode, setAddMode, setScrollMode]);

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

    if (times.includes(targetTime) || targetTime <= 0) {
      targetTime = currentPhaseTime + 1000;
    }

    if (targetTime <= 0 || targetTime > play.durationMs || times.includes(targetTime)) return;

    commit(draft => {
      draft.markers = [...draft.markers, targetTime].sort((a, b) => a - b);
    });
    const newIdx = [0, ...play.markers, targetTime].sort((a, b) => a - b).indexOf(targetTime);
    setPhaseIdx(newIdx);
    seek(targetTime);
  }, [currentTime, currentPhaseTime, play.markers, play.durationMs, commit, setPhaseIdx, seek]);

  const handlePhaseSelect = useCallback((idx: number) => {
    setPhaseIdx(idx);
    setIsEditActive(true);
    const t = [0, ...play.markers][idx] ?? 0;
    seek(t);
  }, [play.markers, setPhaseIdx, setIsEditActive, seek]);

  const handlePhaseDeactivate = useCallback(() => {
    setIsEditActive(false);
  }, [setIsEditActive]);

  const handlePhaseDelete = useCallback((idx: number) => {
    if (idx <= 0) return;
    const deletedTime = [0, ...play.markers][idx];
    commit(draft => {
      draft.markers.splice(idx - 1, 1);
      // 削除フレームの時刻のトラックキーを全エンティティから除去
      for (const entity of draft.entities) {
        entity.track = entity.track.filter(k => k.t !== deletedTime);
        if (entity.track.length === 0) entity.track = [{ t: 0, p: { x: FIELD.widthM / 2, y: FIELD.halfM } }];
      }
      // ボール保持者の同時刻エントリも除去
      draft.ball.holders = draft.ball.holders.filter(h => h.t !== deletedTime);
    });
    if (currentPhaseIdx >= idx) setPhaseIdx(Math.max(0, currentPhaseIdx - 1));
  }, [commit, setPhaseIdx, currentPhaseIdx, play.markers]);

  const handleEntityDelete = useCallback(() => {
    if (!selectedId) return;
    commit(draft => {
      draft.entities = draft.entities.filter(e => e.id !== selectedId);
      draft.ball.holders = draft.ball.holders.filter(h => h.holderId !== selectedId);
      if (draft.ball.holders.length === 0 && draft.entities.length > 0) {
        draft.ball.holders = [{ t: 0, holderId: draft.entities[0].id }];
      }
    });
    select(null);
  }, [selectedId, commit, select]);

  const handleAssignBall = useCallback(() => {
    const { currentPhaseIdx: idx, play: cp, selectedId: sel } = latestRef.current;
    if (!sel) return;
    const t = [0, ...cp.markers][idx] ?? 0;
    commit(draft => {
      const holders = draft.ball.holders;
      const existingIdx = holders.findIndex(h => h.t === t);
      if (existingIdx >= 0) {
        holders[existingIdx].holderId = sel;
      } else {
        const ins = holders.findIndex(h => h.t > t);
        const entry = { t, holderId: sel };
        if (ins === -1) holders.push(entry);
        else holders.splice(ins, 0, entry);
      }
    });
  }, [commit]);

  const handleEditDuration = useCallback(() => {
    const current = Math.round(play.durationMs / 1000);
    const input = window.prompt('アニメーション時間', String(current));
    if (!input) return;
    const secs = parseFloat(input);
    if (!isFinite(secs) || secs <= 0) { window.alert('正の数を入力してください'); return; }
    const newMs = Math.round(secs * 1000);
    const lastMarker = play.markers.length > 0 ? play.markers[play.markers.length - 1] : 0;
    if (newMs <= lastMarker) { window.alert(`最後のフレーム時刻（${Math.round(lastMarker / 1000)}）より大きい値にしてください`); return; }
    commit(draft => { draft.durationMs = newMs; });
    if (currentTime > newMs) seek(newMs);
  }, [play.durationMs, play.markers, currentTime, commit, seek]);

  const handleToggleScroll = useCallback(() => {
    setScrollMode(!scrollMode);
    if (!scrollMode) {
      setAddMode(null);
    }
  }, [scrollMode, setScrollMode, setAddMode]);

  const handleShare = useCallback(() => {
    if (!shareUrl) return;
    const fallback = () => window.prompt('以下のURLをコピーしてください', shareUrl);
    try {
      navigator.clipboard.writeText(shareUrl)
        .then(() => window.alert('共有URLをコピーしました'))
        .catch(fallback);
    } catch {
      fallback();
    }
  }, [shareUrl]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100dvh' }}>
      <div style={{ flex: '1 1 0', minHeight: 0, position: 'relative' }}>
        <Pitch
          play={play}
          viewY={editorViewY}
          viewH={viewH}
          currentTime={currentTime}
          selectedId={selectedId}
          onionSkinTimes={onionSkinTimes}
          dragOverride={dragOverride}
          scrollMode={scrollMode}
          svgRef={svgRef}
          onSvgPointerDown={handleSvgPointerDown}
        />
        {scrollMode && <ScrollIndicator viewY={editorViewY} viewH={viewH} />}
      </div>
      <PhaseChips
        markers={play.markers}
        currentTime={currentTime}
        isPlaying={isPlaying}
        isEditActive={isEditActive}
        currentPhaseIdx={currentPhaseIdx}
        onSelect={handlePhaseSelect}
        onDeactivate={handlePhaseDeactivate}
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
        onEditDuration={handleEditDuration}
      />
      <EntityPanel
        play={play}
        selectedId={selectedId}
        canUndo={canUndo}
        canRedo={canRedo}
        scrollMode={scrollMode}
        addMode={addMode}
        currentFrameHolderId={currentFrameHolderId}
        onAddAttack={() => handleAddEntity('attack')}
        onAddDefence={() => handleAddEntity('defence')}
        onEditLabel={handleEditLabel}
        onDeleteEntity={handleEntityDelete}
        onUndo={undo}
        onRedo={redo}
        onToggleScroll={handleToggleScroll}
        onAssignBall={handleAssignBall}
        onShare={handleShare}
      />
    </div>
  );
}
