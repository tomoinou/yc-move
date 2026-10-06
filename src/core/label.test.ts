import { describe, it, expect } from 'vitest';
import { labelDisplayWidth, fitFontSize } from './label.ts';

describe('labelDisplayWidth', () => {
  it('半角は0.5、全角は1.0で数える', () => {
    expect(labelDisplayWidth('A1')).toBe(1);
    expect(labelDisplayWidth('山田')).toBe(2);
    expect(labelDisplayWidth('A田')).toBe(1.5);
  });
  it('サロゲートペアは1文字として数える', () => {
    expect(labelDisplayWidth('𠮷')).toBe(1);
  });
  it('空文字は0', () => {
    expect(labelDisplayWidth('')).toBe(0);
  });
});

describe('fitFontSize', () => {
  it('収まる場合は上限サイズ', () => {
    expect(fitFontSize('A1', 36, 13, 8)).toBe(13);
  });
  it('全角3文字は幅に合わせて縮小', () => {
    expect(fitFontSize('山田太', 36, 13, 8)).toBe(12);
  });
  it('下限を下回らない', () => {
    expect(fitFontSize('山田太', 6, 13, 8)).toBe(8);
  });
  it('空文字は上限サイズ', () => {
    expect(fitFontSize('', 36, 13, 8)).toBe(13);
  });
});
