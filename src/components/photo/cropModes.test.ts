import { describe, expect, test } from 'bun:test';
import { cropModeAspect } from './cropModes';

describe('cropModeAspect', () => {
  test('supports portrait landscape square and free images', () => {
    expect(cropModeAspect('portrait')).toBe(3 / 4);
    expect(cropModeAspect('landscape')).toBe(4 / 3);
    expect(cropModeAspect('square')).toBe(1);
    expect(cropModeAspect('free')).toBeUndefined();
  });
});
