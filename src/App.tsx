import { useState, useEffect } from 'react';
import { Editor } from './ui/Editor.tsx';
import { Viewer } from './ui/Viewer.tsx';
import { decodePlay } from './core/share.ts';
import type { Play } from './core/types.ts';
import { fetchDefaultPlay } from './state/defaultPlay.ts';
import { usePlayStore } from './state/playStore.ts';

type AppState = 'editor' | 'loading' | 'error' | Play;

export default function App() {
  const [state, setState] = useState<AppState>('loading');

  useEffect(() => {
    if (location.hash.startsWith('#p=')) {
      decodePlay(location.hash.slice(3))
        .then(play => setState(play))
        .catch(() => setState('error'));
      return;
    }
    // 取得できなければ samplePlay のまま起動する
    fetchDefaultPlay().then(play => {
      if (play) usePlayStore.getState().reset(play);
      setState('editor');
    });
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
  return <Viewer play={state} />;
}
