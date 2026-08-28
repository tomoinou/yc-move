import { describe, expect, it } from 'vitest';
import { FIELD } from './field.ts';

describe('FIELD constants', () => {
  it('has correct values per spec', () => {
    expect(FIELD.widthM).toBe(40);
    expect(FIELD.lengthM).toBe(60);
    expect(FIELD.halfM).toBe(30);
    expect(FIELD.marginM).toBe(2);
  });
});

describe('label codepoint counting', () => {
  it('Array.from counts codepoints, not UTF-16 units', () => {
    // ASCII
    expect(Array.from('AB').length).toBe(2);
    // Full-width
    expect(Array.from('ＡＢ').length).toBe(2);
    // Emoji: 1 codepoint but string.length == 2 (surrogate pair)
    expect(Array.from('👍').length).toBe(1);
    expect('👍'.length).toBe(2); // confirms why string.length must not be used
  });
});
