import type { Play } from '../core/types.ts';
import { migrateToLatest } from '../core/migration.ts';
import { usePlayStore } from './playStore.ts';

// 編集中の下書き（端末・ブラウザごと）。ストレージが使えない環境では何もしない
const KEY = 'yc-move:draft';
const SAVE_DELAY_MS = 300;

export function loadDraft(): Play | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const play = migrateToLatest(JSON.parse(raw));
    return Array.isArray(play.entities) ? play : null;
  } catch {
    return null;
  }
}

export function saveDraft(play: Play): void {
  try { localStorage.setItem(KEY, JSON.stringify(play)); } catch { /* 容量超過など */ }
}

export function clearDraft(): void {
  try { localStorage.removeItem(KEY); } catch { /* 保存できない環境 */ }
}

// 編集操作（commit / undo / redo）による変更だけを保存する。reset 直後は保存しない
export function startDraftAutosave(): () => void {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const unsubscribe = usePlayStore.subscribe((state, prev) => {
    if (state.play === prev.play || (!state.canUndo && !state.canRedo)) return;
    clearTimeout(timer);
    timer = setTimeout(() => {
      saveDraft(usePlayStore.getState().play);
    }, SAVE_DELAY_MS);
  });
  return () => { clearTimeout(timer); unsubscribe(); };
}
