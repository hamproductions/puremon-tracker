import { describe, expect, test } from 'bun:test';
import { cropModeAspect } from './cropModes';
import { DEFAULT_BROMIDE_ASPECT, LANDSCAPE_BROMIDE_ASPECT } from '~/utils/aspect';

describe('cropModeAspect', () => {
  test('portrait/landscape use the L判 ratio; none/free have no fixed aspect', () => {
    expect(cropModeAspect('portrait')).toBe(DEFAULT_BROMIDE_ASPECT);
    expect(cropModeAspect('landscape')).toBe(LANDSCAPE_BROMIDE_ASPECT);
    expect(cropModeAspect('square')).toBe(1);
    expect(cropModeAspect('free')).toBeUndefined();
    expect(cropModeAspect('none')).toBeUndefined();
  });
});
