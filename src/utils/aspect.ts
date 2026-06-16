import type { Bromide } from '~/types';

// L判 / 2L判 bromide print ratio (89mm × 127mm), not 3:4.
export const DEFAULT_BROMIDE_ASPECT = 89 / 127;
export const LANDSCAPE_BROMIDE_ASPECT = 127 / 89;

export function bromideAspect(bromide: Pick<Bromide, 'aspect'>): number {
  return bromide.aspect && bromide.aspect > 0 ? bromide.aspect : DEFAULT_BROMIDE_ASPECT;
}

export function bromideAspectRatio(bromide: Pick<Bromide, 'aspect'>): string {
  return `${bromideAspect(bromide)} / 1`;
}

export function parseAspect(value: string): number | undefined {
  const text = value.trim();
  if (!text) return undefined;
  const [left, right] = text.split('/').map((part) => Number(part.trim()));
  const aspect = right ? left / right : left;
  return Number.isFinite(aspect) && aspect > 0 ? aspect : undefined;
}

export function formatAspect(aspect?: number): string {
  if (!aspect) return '';
  if (aspect < 1) return '縦';
  if (aspect > 1) return '横';
  return '正方形';
}
