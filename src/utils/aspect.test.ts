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

  test('formats common aspect values', () => {
    expect(formatAspect(3 / 4)).toBe('3/4');
    expect(formatAspect(4 / 3)).toBe('4/3');
    expect(formatAspect(16 / 9)).toBe('16/9');
  });
});
