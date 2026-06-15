import { describe, expect, test } from 'bun:test';
import { seedCatalog } from '~/data/catalog';
import { buildMergedCatalog } from './useCatalog';

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
});
