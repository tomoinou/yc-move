import type { CSSProperties } from 'react';
import { BTN_H, STD_W } from './layout.ts';

// 行の右端ボタン（下段の共有ボタンの真上に揃う）
const sideBtn: CSSProperties = {
  flexShrink: 0,
  width: STD_W,
  height: BTN_H,
  padding: 0,
  border: 'none',
  background: 'rgba(255,255,255,0.08)',
  color: 'white',
  borderRadius: 4,
  fontSize: 14,
  fontWeight: 'bold',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

interface ControlsProps {
  currentTime: number;
  durationMs: number;
  isPlaying: boolean;
  onPlay: () => void;
  onPause: () => void;
  onSeek: (t: number) => void;
  onEditDuration?: () => void;
  onOpenGuide?: () => void;
  onEdit?: () => void;
}

export function Controls({
  currentTime, durationMs, isPlaying, onPlay, onPause, onSeek, onEditDuration, onOpenGuide, onEdit,
}: ControlsProps) {
  return (
    <div style={{
      background: '#1a1a1a',
      color: 'white',
      padding: '4px 10px',
      flexShrink: 0,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    }}>
      <button
        onClick={isPlaying ? onPause : onPlay}
        style={{
          background: 'none',
          border: '1px solid rgba(255,255,255,0.4)',
          color: 'white',
          fontSize: 18,
          width: 40,
          height: 40,
          borderRadius: 4,
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        {isPlaying ? '⏸︎' : '▶'}
      </button>
      <input
        type="range"
        min={0}
        max={durationMs}
        step={16}
        value={currentTime}
        onInput={(e) => onSeek(e.currentTarget.valueAsNumber)}
        onChange={() => {}}
        style={{ flex: 1, accentColor: '#E8272A' }}
      />
      <div
        onClick={onEditDuration}
        style={{
          fontSize: 11, color: 'rgba(255,255,255,0.7)', flexShrink: 0,
          cursor: onEditDuration ? 'pointer' : undefined,
          padding: '2px 4px', borderRadius: 3,
          background: onEditDuration ? 'rgba(255,255,255,0.08)' : undefined,
        }}
      >
        {Math.round(currentTime / 1000)}/<u>{Math.round(durationMs / 1000)}</u>
      </div>
      {onEdit && (
        // 閲覧画面: 編集画面の ? と同じ位置
        <button onClick={onEdit} title="このプレイを編集" style={sideBtn}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M16.5 3.5l4 4L8 20H4v-4L16.5 3.5z" />
            <path d="M14 6l4 4" />
          </svg>
        </button>
      )}
      {onOpenGuide && (
        <button onClick={onOpenGuide} title="使い方ガイド" style={sideBtn}>
          ?
        </button>
      )}
    </div>
  );
}
