import { describe, expect, test } from 'bun:test';
import { formatAspect, parseAspect } from './aspect';

describe('aspect helpers', () => {
  test('parses ratio and numeric aspect input', () => {
    expect(parseAspect('4/3')).toBeCloseTo(4 / 3);
    expect(parseAspect('16/9')).toBeCloseTo(16 / 9);
    expect(parseAspect('1.5')).toBe(1.5);
  });

  test('ignores invalid aspect input', () => {
    expect(parseAspect('')).toBeUndefined();
    expect(parseAspect('0')).toBeUndefined();
    expect(parseAspect('x/y')).toBeUndefined();
  });

  test('formats aspect as orientation (縦/横/正方形)', () => {
    expect(formatAspect(89 / 127)).toBe('縦');
    expect(formatAspect(127 / 89)).toBe('横');
    expect(formatAspect(1)).toBe('正方形');
    expect(formatAspect(undefined)).toBe('');
  });
});
