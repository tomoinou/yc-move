import { useState, useEffect } from 'react';
import { Editor } from './ui/Editor.tsx';
import { Viewer } from './ui/Viewer.tsx';
import { decodePlay } from './core/share.ts';
import type { Play } from './core/types.ts';

type AppState = 'editor' | 'loading' | 'error' | Play;

export default function App() {
  const [state, setState] = useState<AppState>(() =>
    location.hash.startsWith('#p=') ? 'loading' : 'editor'
  );

  useEffect(() => {
    if (state !== 'loading') return;
    decodePlay(location.hash.slice(3))
      .then(play => setState(play))
      .catch(() => setState('error'));
  }, []);  // eslint-disable-line react-hooks/exhaustive-deps

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
