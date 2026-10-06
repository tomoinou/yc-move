import { useState, useEffect, useCallback } from 'react';
import { Editor } from './ui/Editor.tsx';
import { Viewer } from './ui/Viewer.tsx';
import { decodePlay } from './core/share.ts';
import type { Play } from './core/types.ts';
import { fetchDefaultPlay } from './state/defaultPlay.ts';
import { usePlayStore } from './state/playStore.ts';
import { loadDraft, saveDraft, clearDraft, startDraftAutosave } from './state/draft.ts';

type AppState = 'editor' | 'loading' | 'error' | Play;

// StrictMode で effect が2回走っても起動処理（確認ダイアログ等）は1回だけ行う
let bootPromise: Promise<AppState> | null = null;

async function boot(): Promise<AppState> {
  if (location.hash.startsWith('#p=')) {
    try {
      return await decodePlay(location.hash.slice(3));
    } catch {
      return 'error';
    }
  }
  const draft = loadDraft();
  if (draft && window.confirm('前回の編集を再開しますか？\n（「キャンセル」で新規作成）')) {
    usePlayStore.getState().reset(draft);
    return 'editor';
  }
  if (draft) clearDraft();
  // 取得できなければ samplePlay のまま起動する
  const play = await fetchDefaultPlay();
  if (play) usePlayStore.getState().reset(play);
  return 'editor';
}

export default function App() {
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    bootPromise ??= boot();
    bootPromise.then(setState);
  }, []);

  useEffect(() => startDraftAutosave(), []);

  // 閲覧中のプレイをそのまま編集する。再読み込みで閲覧に戻らないよう URL の #p= を外し、
  // 古い下書きではなくこのプレイから再開できるよう下書きにも保存する
  const handleEdit = useCallback((play: Play) => {
    usePlayStore.getState().reset(play);
    saveDraft(play);
    history.replaceState(null, '', location.pathname + location.search);
    setState('editor');
  }, []);

  if (state === 'editor') return <Editor />;
  if (state === 'loading') return null;
  if (state === 'error') return (
    <div style={{
      color: 'white', background: '#1a1a1a', height: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
    }}>
      プレイの読み込みに失敗しました
    </div>
  );
  return <Viewer play={state} onEdit={() => handleEdit(state)} />;
}
