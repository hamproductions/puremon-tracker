import { describe, expect, test } from 'bun:test';
import { orphanedImageCount } from './CollectionEditor';
import type { Bromide, BromideSpec } from '~/types';

function bromide(id: string, legacyIds: string[], imageUrl?: string): Bromide {
  return {
    id,
    legacyIds,
    collectionId: 'c',
    memberId: 'm',
    size: 'L',
    no: 1,
    type: '1',
    imageUrl,
    createdAt: '2026-01-01T00:00:00.000Z'
  };
}

function slot(slotId: string, legacyIds: string[]): BromideSpec {
  return { memberId: 'm', no: 1, size: 'L', slotId, legacyIds };
}

describe('orphanedImageCount', () => {
  test('slot kept by stable slotId is not orphaned', () => {
    const prev = [bromide('uuid-1', ['c:m:L:1'], 'https://img/1.jpg')];
    expect(orphanedImageCount(prev, [slot('uuid-1', ['c:m:L:1'])])).toBe(0);
  });

  test('slot reattached via legacy id is not orphaned', () => {
    const prev = [bromide('uuid-1', ['c:m:L:1'], 'https://img/1.jpg')];
    expect(orphanedImageCount(prev, [slot('uuid-2', ['uuid-1'])])).toBe(0);
  });

  test('image with no matching new slot is orphaned', () => {
    const prev = [bromide('uuid-1', ['c:m:L:1'], 'https://img/1.jpg')];
    expect(orphanedImageCount(prev, [slot('uuid-9', ['c:m:2L:1'])])).toBe(1);
  });

  test('slots without an image never count as orphaned', () => {
    const prev = [bromide('uuid-1', ['c:m:L:1'])];
    expect(orphanedImageCount(prev, [slot('uuid-9', [])])).toBe(0);
  });
});
