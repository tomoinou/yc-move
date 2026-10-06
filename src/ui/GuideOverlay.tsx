import { BTN_H, STD_W, ROW_PAD_X } from './layout.ts';

interface GuideOverlayProps {
  onClose: () => void;
}

// 別ページに遷移すると編集中のプレイが消えるため、アプリ上に重ねて表示する
export function GuideOverlay({ onClose }: GuideOverlayProps) {
  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      background: '#1a1a1a',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: `6px ${ROW_PAD_X}px`,
        color: 'white',
        flexShrink: 0,
      }}>
        <span style={{ fontSize: 15, fontWeight: 'bold' }}>使い方マニュアル</span>
        <button
          onClick={onClose}
          title="閉じる"
          style={{
            width: STD_W,
            height: BTN_H,
            padding: 0,
            border: 'none',
            borderRadius: 4,
            background: 'rgba(255,255,255,0.15)',
            color: 'white',
            fontSize: 16,
            cursor: 'pointer',
          }}
        >
          ✕
        </button>
      </div>
      <iframe
        src={`${import.meta.env.BASE_URL}guide.html`}
        title="使い方マニュアル"
        style={{ flex: '1 1 0', minHeight: 0, width: '100%', border: 'none', background: 'white' }}
      />
    </div>
  );
}
