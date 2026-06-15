import { bromideId } from '~/data/catalog';
import type { Bromide, Catalog, Collection, Member, OwnershipMap } from '~/types';

export function memberMap(catalog: Catalog): Map<string, Member> {
  return new Map(catalog.members.map((m) => [m.id, m]));
}

export function collectionMap(catalog: Catalog): Map<string, Collection> {
  return new Map(catalog.collections.map((c) => [c.id, c]));
}

export function bromidesByCollection(catalog: Catalog, collectionId: string): Bromide[] {
  return catalog.bromides.filter((b) => b.collectionId === collectionId);
}

export interface MemberGrid {
  kind: 'member_grid';
  members: Member[];
  numbers: number[];
  cell: (memberId: string, no: number) => Bromide | undefined;
}

export interface FlatGrid {
  kind: 'flat';
  bromides: Bromide[];
}

export type CollectionGrid = MemberGrid | FlatGrid;

export function buildGrid(catalog: Catalog, collection: Collection): CollectionGrid {
  if (collection.kind === 'flat') {
    return {
      kind: 'flat',
      bromides: bromidesByCollection(catalog, collection.id).sort((a, b) => a.no - b.no)
    };
  }
  const mm = memberMap(catalog);
  const byId = new Map(bromidesByCollection(catalog, collection.id).map((b) => [b.id, b]));
  const members = collection.memberIds
    .map((id) => mm.get(id))
    .filter((m): m is Member => Boolean(m))
    .sort((a, b) => a.order - b.order);
  const numbers = [...collection.numbers].sort((a, b) => a - b);
  return {
    kind: 'member_grid',
    members,
    numbers,
    cell: (memberId, no) => byId.get(bromideId(collection.id, memberId, no))
  };
}

export interface OwnStats {
  total: number;
  owned: number;
  missing: number;
  duplicates: number;
  percent: number;
}

function statsFor(bromides: Bromide[], ownership: OwnershipMap): OwnStats {
  let owned = 0;
  let duplicates = 0;
  for (const b of bromides) {
    const c = ownership[b.id] ?? 0;
    if (c >= 1) owned += 1;
    if (c >= 2) duplicates += c - 1;
  }
  const total = bromides.length;
  return {
    total,
    owned,
    missing: total - owned,
    duplicates,
    percent: total === 0 ? 0 : Math.round((owned / total) * 100)
  };
}

export function collectionStats(
  catalog: Catalog,
  collectionId: string,
  ownership: OwnershipMap
): OwnStats {
  return statsFor(bromidesByCollection(catalog, collectionId), ownership);
}

export function overallStats(catalog: Catalog, ownership: OwnershipMap): OwnStats {
  return statsFor(catalog.bromides, ownership);
}

export function missingBromides(
  catalog: Catalog,
  ownership: OwnershipMap,
  collectionId?: string
): Bromide[] {
  return catalog.bromides.filter(
    (b) => (!collectionId || b.collectionId === collectionId) && (ownership[b.id] ?? 0) === 0
  );
}

export interface DuplicateEntry {
  bromide: Bromide;
  count: number;
}

export function duplicateBromides(
  catalog: Catalog,
  ownership: OwnershipMap,
  collectionId?: string
): DuplicateEntry[] {
  return catalog.bromides
    .filter((b) => !collectionId || b.collectionId === collectionId)
    .map((b) => ({ bromide: b, count: ownership[b.id] ?? 0 }))
    .filter((e) => e.count >= 2);
}

export function memberLabel(catalog: Catalog, memberId: string | null): string {
  if (!memberId) return '集合';
  return memberMap(catalog).get(memberId)?.name ?? memberId;
}

export function bromideLabel(catalog: Catalog, bromide: Bromide): string {
  return `${memberLabel(catalog, bromide.memberId)} No.${bromide.no}`;
}

export function memberColor(catalog: Catalog, memberId: string | null): string {
  if (!memberId) return '#FF5FA2';
  return memberMap(catalog).get(memberId)?.color ?? '#FF5FA2';
}
