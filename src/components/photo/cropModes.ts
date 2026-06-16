export type CropMode = 'portrait' | 'landscape' | 'square' | 'free';

export const CROP_MODES: { value: CropMode; label: string; aspect?: number }[] = [
  { value: 'portrait', label: '縦', aspect: 3 / 4 },
  { value: 'landscape', label: '横', aspect: 4 / 3 },
  { value: 'square', label: '正方形', aspect: 1 },
  { value: 'free', label: '自由' }
];

export function cropModeAspect(mode: CropMode): number | undefined {
  return CROP_MODES.find((item) => item.value === mode)?.aspect;
}
