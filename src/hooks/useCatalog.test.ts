import { describe, expect, test } from 'bun:test';
import { seedCatalog } from '~/data/catalog';
import { buildMergedCatalog } from './useCatalog';
import type { Collection } from '~/types';

describe('buildMergedCatalog', () => {
  test('does not let local image cache override remote catalog images', () => {
    const catalog = buildMergedCatalog(
      seedCatalog.members,
      seedCatalog.collections,
      { 'floral:momo:L:1': 'https://example.test/remote.jpg' },
      [],
      [],
      { 'floral:momo:L:1': 'data:image/jpeg;base64,stale-local-cache' },
      [],
      { includeLocalImages: false }
    );

    expect(catalog.bromides.find((b) => b.id === 'floral:momo:L:1')?.imageUrl).toBe(
      'https://example.test/remote.jpg'
    );
  });

  test('does not show local-only image cache when remote catalog is authoritative', () => {
    const catalog = buildMergedCatalog(
      seedCatalog.members,
      seedCatalog.collections,
      {},
      [],
      [],
      { 'floral:momo:L:1': 'data:image/jpeg;base64,stale-local-cache' },
      [],
      { includeLocalImages: false }
    );

    expect(catalog.bromides.find((b) => b.id === 'floral:momo:L:1')?.imageUrl).toBeUndefined();
  });

  test('keeps images through stable slot ids after view settings change', () => {
    const changed: Collection = {
      id: 'floral',
      title: '花柄衣装',
      kind: 'flat',
      memberIds: [],
      numbers: [1],
      slots: [
        {
          slotId: 'floral:slot:momo-l-1',
          legacyIds: ['floral:momo:L:1'],
          memberId: 'momo',
          size: 'L',
          no: 1
        }
      ],
      createdAt: '2024-05-01T00:00:00.000Z'
    };

    const catalog = buildMergedCatalog(
      seedCatalog.members,
      [changed],
      { 'floral:momo:L:1': 'https://example.test/legacy.jpg' },
      [],
      [],
      {},
      []
    );

    expect(catalog.bromides[0]?.id).toBe('floral:slot:momo-l-1');
    expect(catalog.bromides[0]?.imageUrl).toBe('https://example.test/legacy.jpg');
  });
});
