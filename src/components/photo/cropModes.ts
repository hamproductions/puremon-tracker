import { DEFAULT_BROMIDE_ASPECT, LANDSCAPE_BROMIDE_ASPECT } from '~/utils/aspect';

export type CropMode = 'none' | 'portrait' | 'landscape' | 'square' | 'free';

export const CROP_MODES: { value: CropMode; label: string; aspect?: number }[] = [
  { value: 'none', label: 'クロップなし' },
  { value: 'portrait', label: '縦 (L判)', aspect: DEFAULT_BROMIDE_ASPECT },
  { value: 'landscape', label: '横 (L判)', aspect: LANDSCAPE_BROMIDE_ASPECT },
  { value: 'square', label: '正方形', aspect: 1 },
  { value: 'free', label: '自由' }
];

export function cropModeAspect(mode: CropMode): number | undefined {
  return CROP_MODES.find((item) => item.value === mode)?.aspect;
}

export function cropModeForAspect(aspect?: number): CropMode {
  if (!aspect) return 'portrait';
  if (Math.abs(aspect - LANDSCAPE_BROMIDE_ASPECT) < 0.01) return 'landscape';
  if (Math.abs(aspect - 1) < 0.001) return 'square';
  if (Math.abs(aspect - DEFAULT_BROMIDE_ASPECT) < 0.01) return 'portrait';
  return 'free';
}
