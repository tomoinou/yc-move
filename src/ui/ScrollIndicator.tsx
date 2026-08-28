import { FIELD } from '../core/field.ts';
import { VIEW_HEIGHT_M } from '../core/camera.ts';

const FULL_H = FIELD.lengthM + 2 * FIELD.marginM; // 64m
const WIN_H = VIEW_HEIGHT_M; // 34m
const MAX_VIEW_Y = FIELD.lengthM - WIN_H + FIELD.marginM; // 28m

interface ScrollIndicatorProps {
  viewY: number;
}

export function ScrollIndicator({ viewY }: ScrollIndicatorProps) {
  const knobTop = (MAX_VIEW_Y - viewY) / FULL_H;
  const knobH = WIN_H / FULL_H;
  return (
    <div style={{
      position: 'absolute', right: 0, top: 0, width: 6, height: '100%',
      background: 'rgba(0,0,0,0.35)', pointerEvents: 'none',
    }}>
      <div style={{
        position: 'absolute',
        top: `${knobTop * 100}%`,
        height: `${knobH * 100}%`,
        width: '100%',
        background: 'rgba(255,255,255,0.55)',
        borderRadius: 2,
      }} />
    </div>
  );
}
