import { FIELD } from '../core/field.ts';

const FULL_H = FIELD.lengthM + 2 * FIELD.marginM; // 64m

interface ScrollIndicatorProps {
  viewY: number;
  viewH: number;
}

export function ScrollIndicator({ viewY, viewH }: ScrollIndicatorProps) {
  const maxViewY = Math.max(-FIELD.marginM, FIELD.lengthM - viewH + FIELD.marginM);
  const knobTop = (maxViewY - viewY) / FULL_H;
  const knobH = viewH / FULL_H;
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
