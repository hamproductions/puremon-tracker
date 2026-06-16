import { describe, expect, test } from 'bun:test';
import { buildBromides, bromideId } from './catalog';
import { bromideLabel } from '~/utils/stats';
import type { Catalog, Collection } from '~/types';

const collection: Collection = {
  id: 'test',
  title: 'Test',
  kind: 'mixed',
  memberIds: [],
  numbers: [],
  items: [
    { memberId: 'momo', no: 1 },
    { memberId: 'momo', no: 1, type: 'rare' }
  ],
  createdAt: '2026-01-01T00:00:00.000Z'
};

const catalog: Catalog = {
  group: { id: 'g', name: 'Group', nameKana: 'group' },
  members: [
    {
      id: 'momo',
      name: '菅原もも',
      nameKana: 'すがわらもも',
      nickname: 'ももちゅん',
      color: '#ff5fa2',
      order: 0
    }
  ],
  collections: [collection],
  bromides: buildBromides(collection)
};

describe('typed bromide slots', () => {
  test('keeps legacy ids unchanged when type is absent', () => {
    expect(bromideId('test', 'momo', 1)).toBe('test:momo:1');
  });

  test('distinguishes arbitrary typed image slots on the same member and number', () => {
    expect(catalog.bromides.map((b) => b.id)).toEqual(['test:momo:1', 'test:momo:rare:1']);
  });

  test('uses the type as the visible slot label', () => {
    expect(bromideLabel(catalog, catalog.bromides[1])).toBe('菅原もも rare');
  });

  test('preserves custom slot aspect', () => {
    const custom: Collection = {
      ...collection,
      slots: [
        {
          slotId: 'test:slot:landscape',
          memberId: 'momo',
          no: 1,
          aspect: 4 / 3
        }
      ]
    };

    expect(buildBromides(custom)[0]?.aspect).toBeCloseTo(4 / 3);
  });
});
