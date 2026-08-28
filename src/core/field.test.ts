import { describe, expect, it } from 'vitest';
import { FIELD } from './field';

describe('FIELD', () => {
  it('フィールド寸法が正しい', () => {
    expect(FIELD.widthM).toBe(40);
    expect(FIELD.lengthM).toBe(60);
    expect(FIELD.halfM).toBe(30);
    expect(FIELD.marginM).toBe(2);
  });
});
