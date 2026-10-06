// U+00FF 以下を半角(0.5)、それ以外を全角(1.0)として表示幅を数える
export function labelDisplayWidth(text: string): number {
  let w = 0;
  for (const cp of text) {
    w += (cp.codePointAt(0) ?? 0) <= 0xff ? 0.5 : 1.0;
  }
  return w;
}

// 幅 boxWidth に収まるフォントサイズ（全角1文字 ≈ 1em）。maxSize を上限、minSize を下限とする
export function fitFontSize(text: string, boxWidth: number, maxSize: number, minSize: number): number {
  const w = labelDisplayWidth(text);
  if (w === 0) return maxSize;
  return Math.max(minSize, Math.min(maxSize, boxWidth / w));
}
