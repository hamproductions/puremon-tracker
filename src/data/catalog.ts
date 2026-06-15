import type { Bromide, Catalog, Collection, Group, Member } from '~/types';

export const GROUP: Group = {
  id: 'purely-monster',
  name: 'ピュアリーモンスター',
  nameKana: 'ぴゅありーもんすたー'
};

export const MEMBERS: Member[] = [
  {
    id: 'reina',
    name: '安藤鈴菜',
    nameKana: 'あんどうれいな',
    nickname: 'れいにゃ',
    color: '#9B1B3F',
    order: 0
  },
  {
    id: 'rina',
    name: '勝野里奈',
    nameKana: 'かつのりな',
    nickname: 'りなりー',
    color: '#F2B705',
    order: 1
  },
  {
    id: 'arisa',
    name: '塙有咲',
    nameKana: 'はなわありさ',
    nickname: 'あーちゃ',
    color: '#34A853',
    order: 2
  },
  {
    id: 'momo',
    name: '菅原もも',
    nameKana: 'すがわらもも',
    nickname: 'ももちゅん',
    color: '#FF5FA2',
    order: 3
  },
  {
    id: 'moeno',
    name: '白城もえの',
    nameKana: 'しらきもえの',
    nickname: 'らきちゃん',
    color: '#AEB4BE',
    order: 4
  },
  {
    id: 'shiori',
    name: '西門志織',
    nameKana: 'にしかどしおり',
    nickname: 'おりきゃん',
    color: '#9B5DE5',
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
    id: 'seitan-2024',
    title: '2024 生誕記念ブロマイド',
    description: '各メンバー生誕記念のランダムブロマイド（全3種）',
    releaseDate: '2024-08-01',
    kind: 'member_grid',
    memberIds: ALL_MEMBER_IDS,
    numbers: range(3),
    createdAt: '2024-08-01T00:00:00.000Z'
  },
  {
    id: 'live-2024',
    title: 'LIVE2024 ランダムブロマイド',
    description: 'ライブ会場限定ランダムブロマイド（全5種）',
    releaseDate: '2024-11-23',
    kind: 'member_grid',
    memberIds: ALL_MEMBER_IDS,
    numbers: range(5),
    createdAt: '2024-11-23T00:00:00.000Z'
  },
  {
    id: 'anniversary-group',
    title: '1st Anniversary 集合ブロマイド',
    description: '集合写真ブロマイド（番号のみ・全8種）',
    releaseDate: '2024-07-07',
    kind: 'flat',
    memberIds: [],
    numbers: range(8),
    createdAt: '2024-07-07T00:00:00.000Z'
  }
];

export function bromideId(collectionId: string, memberId: string | null, no: number): string {
  return memberId ? `${collectionId}:${memberId}:${no}` : `${collectionId}:flat:${no}`;
}

export function buildBromides(collection: Collection): Bromide[] {
  const createdAt = collection.createdAt;
  if (collection.kind === 'flat') {
    return collection.numbers.map((no) => ({
      id: bromideId(collection.id, null, no),
      collectionId: collection.id,
      memberId: null,
      no,
      createdAt
    }));
  }
  return collection.memberIds.flatMap((memberId) =>
    collection.numbers.map((no) => ({
      id: bromideId(collection.id, memberId, no),
      collectionId: collection.id,
      memberId,
      no,
      createdAt
    }))
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
