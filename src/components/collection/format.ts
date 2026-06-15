import type { Catalog, Collection } from '~/types';

export function formatReleaseDate(date?: string): string | null {
  if (!date) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(date);
  if (!m) return date;
  return `${m[1]}.${Number(m[2])}.${Number(m[3])}`;
}

export function collectionColors(catalog: Catalog, collection: Collection): string[] {
  const byId = new Map(catalog.members.map((m) => [m.id, m]));
  const colors = collection.memberIds
    .map((id) => byId.get(id))
    .filter((m): m is NonNullable<typeof m> => Boolean(m))
    .sort((a, b) => a.order - b.order)
    .map((m) => m.color);
  if (colors.length > 0) return colors;
  return ['#FF5FA2', '#9B5DE5'];
}

export function gradientFromColors(colors: string[]): string {
  if (colors.length === 1) return `linear-gradient(120deg, ${colors[0]} 0%, ${colors[0]}99 100%)`;
  const stops = colors
    .map((c, i) => `${c} ${Math.round((i / (colors.length - 1)) * 100)}%`)
    .join(', ');
  return `linear-gradient(120deg, ${stops})`;
}

export function kindLabel(kind: Collection['kind']): string {
  if (kind === 'member_grid') return 'メンバー別';
  if (kind === 'mixed') return '個別';
  return '集合';
}

export function memberCountLabel(collection: Collection): string {
  if (collection.kind === 'flat') return '集合写真';
  if (collection.kind === 'mixed') {
    const ids = new Set(
      (collection.items ?? []).map((it) => it.memberId).filter((id): id is string => Boolean(id))
    );
    return ids.size > 0 ? `${ids.size}人（個別）` : '個別';
  }
  return `${collection.memberIds.length}人`;
}
