import type { Bromide } from '~/types';

export const DEFAULT_BROMIDE_ASPECT = 3 / 4;

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
  if (Math.abs(aspect - 3 / 4) < 0.001) return '3/4';
  if (Math.abs(aspect - 4 / 3) < 0.001) return '4/3';
  if (Math.abs(aspect - 1) < 0.001) return '1';
  if (Math.abs(aspect - 16 / 9) < 0.001) return '16/9';
  return Number(aspect.toFixed(4)).toString();
}
