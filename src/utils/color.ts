function channels(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const v =
    h.length === 3
      ? h
          .split('')
          .map((c) => c + c)
          .join('')
      : h;
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}

function relativeLuminance(hex: string): number {
  const lin = channels(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2];
}

function contrast(a: number, b: number): number {
  const hi = Math.max(a, b);
  const lo = Math.min(a, b);
  return (hi + 0.05) / (lo + 0.05);
}

const DARK_INK = '#1a1a1a';
const LIGHT_INK = '#ffffff';
const DARK_LUM = relativeLuminance(DARK_INK);
const LIGHT_LUM = 1;

export function readableText(hex: string): string {
  const bg = relativeLuminance(hex);
  return contrast(bg, DARK_LUM) >= contrast(bg, LIGHT_LUM) ? DARK_INK : LIGHT_INK;
}
