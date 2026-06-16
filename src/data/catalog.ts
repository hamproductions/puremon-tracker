import type { Bromide, Catalog, Collection, Group, Member } from '~/types';

export const GROUP: Group = {
  id: 'purely-monster',
  name: 'ピュアリーモンスター',
  nameKana: 'ぴゅありーもんすたー'
};

export const MEMBERS: Member[] = [
  {
    id: 'momo',
    name: '菅原もも',
    nameKana: 'すがわらもも',
    nickname: 'ももちゅん',
    color: '#FF5FA2',
    order: 0
  },
  {
    id: 'moeno',
    name: '白城もえの',
    nameKana: 'しらきもえの',
    nickname: 'らきちゃん',
    color: '#AEB4BE',
    order: 1
  },
  {
    id: 'reina',
    name: '安藤鈴菜',
    nameKana: 'あんどうれいな',
    nickname: 'れいにゃ',
    color: '#9B1B3F',
    order: 2
  },
  {
    id: 'arisa',
    name: '塙有咲',
    nameKana: 'はなわありさ',
    nickname: 'あーちゃ',
    color: '#34A853',
    order: 3
  },
  {
    id: 'shiori',
    name: '西門志織',
    nameKana: 'にしかどしおり',
    nickname: 'おりきゃん',
    color: '#9B5DE5',
    order: 4
  },
  {
    id: 'rina',
    name: '勝野里奈',
    nameKana: 'かつのりな',
    nickname: 'りなりー',
    color: '#F2B705',
    order: 5
  },
  {
    id: 'ayumi',
    name: '百瀬安由未',
    nameKana: 'ももせあゆみ',
    nickname: 'あゆみん',
    color: '#FF7A2E',
    order: 6
  }
];

const ALL_MEMBER_IDS = MEMBERS.map((m) => m.id);

const range = (n: number) => Array.from({ length: n }, (_, i) => i + 1);

interface CollectionSeed extends Omit<Collection, 'createdAt'> {
  createdAt?: string;
}

const COLLECTION_SEEDS: CollectionSeed[] = [
  {
    id: 'floral',
    title: '花柄衣装',
    description: '花柄衣装ブロマイド（L／2L・各全5種）',
    kind: 'member_grid',
    memberIds: ALL_MEMBER_IDS,
    numbers: range(5),
    sizes: ['L', '2L'],
    createdAt: '2024-05-01T00:00:00.000Z'
  },
  {
    id: 'halloween',
    title: 'ハロウィン',
    description: 'ハロウィン衣装ブロマイド（L／2L・各全10種）',
    kind: 'member_grid',
    memberIds: ALL_MEMBER_IDS,
    numbers: range(10),
    sizes: ['L', '2L'],
    createdAt: '2024-10-01T00:00:00.000Z'
  },
  {
    id: 'christmas',
    title: 'クリスマス',
    description: 'クリスマス衣装ブロマイド（L／2L・各全5種）',
    kind: 'member_grid',
    memberIds: ALL_MEMBER_IDS,
    numbers: range(5),
    sizes: ['L', '2L'],
    createdAt: '2024-12-01T00:00:00.000Z'
  },
  {
    id: 'momo-birthday-2024',
    title: '菅原もも 生誕2024',
    description: '菅原ももソロ生誕ブロマイド（単独・L／2L・全6種）',
    kind: 'member_grid',
    memberIds: ['momo'],
    numbers: range(6),
    sizes: ['L', '2L'],
    createdAt: '2024-06-12T00:00:00.000Z'
  },
  {
    id: 'mixed-2024',
    title: 'ミックスブロマイドセット',
    description: 'メンバーごとに枚数が違うミックスセット（タグ付き）',
    kind: 'mixed',
    memberIds: [],
    numbers: [],
    items: [
      { memberId: 'momo', no: 1 },
      { memberId: 'momo', no: 2 },
      { memberId: 'momo', no: 3 },
      { memberId: 'reina', no: 1 },
      { memberId: 'reina', no: 2 },
      { memberId: 'shiori', no: 1 },
      { memberId: 'ayumi', no: 1 },
      { memberId: null, no: 1 },
      { memberId: null, no: 2 }
    ],
    createdAt: '2024-09-01T00:00:00.000Z'
  },
  {
    id: 'anniversary-group',
    title: '1st Anniversary 集合ブロマイド',
    description: '集合写真ブロマイド（番号のみ・全8種）',
    kind: 'flat',
    memberIds: [],
    numbers: range(8),
    createdAt: '2024-07-07T00:00:00.000Z'
  }
];

export function collectionSizes(collection: Collection): (string | null)[] {
  return collection.sizes && collection.sizes.length > 0 ? collection.sizes : [null];
}

export function bromideId(
  collectionId: string,
  memberId: string | null,
  no: number,
  size: string | null = null,
  type?: string
): string {
  const base = memberId ? `${collectionId}:${memberId}` : `${collectionId}:flat`;
  const parts = [base];
  if (size) parts.push(size);
  if (type) parts.push(slugPart(type));
  parts.push(String(no));
  return parts.join(':');
}

export function buildBromides(collection: Collection): Bromide[] {
  const createdAt = collection.createdAt;
  const sizes = collectionSizes(collection);

  if (collection.slots?.length) {
    return collection.slots.map((it) => {
      const legacyId = bromideId(collection.id, it.memberId, it.no, it.size ?? null, it.type);
      const id = it.slotId ?? legacyId;
      const legacyIds = [...new Set([legacyId, ...(it.legacyIds ?? [])])].filter((x) => x !== id);
      return {
        id,
        legacyIds,
        collectionId: collection.id,
        memberId: it.memberId,
        size: it.size ?? null,
        no: it.no,
        type: it.type,
        label: it.label,
        createdAt
      };
    });
  }

  if (collection.kind === 'mixed') {
    const items = collection.items ?? [];
    return sizes.flatMap((size) =>
      items.map((it) => {
        const legacyId = bromideId(collection.id, it.memberId, it.no, size, it.type);
        const id = it.slotId ?? legacyId;
        return {
          id,
          legacyIds: [...new Set([legacyId, ...(it.legacyIds ?? [])])].filter((x) => x !== id),
          collectionId: collection.id,
          memberId: it.memberId,
          size,
          no: it.no,
          type: it.type,
          label: it.label,
          createdAt
        };
      })
    );
  }

  const memberIds = collection.kind === 'flat' ? [null] : collection.memberIds;
  return sizes.flatMap((size) =>
    memberIds.flatMap((memberId) =>
      collection.numbers.map((no) => ({
        id: bromideId(collection.id, memberId, no, size),
        legacyIds: [],
        collectionId: collection.id,
        memberId,
        size,
        no,
        type: String(no),
        createdAt
      }))
    )
  );
}

export function buildCatalog(): Catalog {
  const collections: Collection[] = COLLECTION_SEEDS.map((c) => ({
    ...c,
    createdAt: c.createdAt ?? new Date(0).toISOString()
  }));
  const bromides = collections.flatMap(buildBromides);
  return { group: GROUP, members: MEMBERS, collections, bromides };
}

export const seedCatalog: Catalog = buildCatalog();

function slugPart(value: string): string {
  return encodeURIComponent(value.trim().toLowerCase()).replace(/%/g, '~');
}
