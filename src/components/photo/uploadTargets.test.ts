import { describe, expect, test } from 'bun:test';
import type { Bromide } from '~/types';
import { uploadTargetsForMode } from './uploadTargets';

const bromide = (id: string, imageUrl?: string): Bromide => ({
  id,
  collectionId: 'collection',
  memberId: 'member',
  no: 1,
  imageUrl
});

describe('uploadTargetsForMode', () => {
  test('anonymous and normal users can only submit missing image targets', () => {
    expect(
      uploadTargetsForMode([bromide('missing'), bromide('filled', 'https://example.com/x.jpg')], {
        adminEdit: false
      }).map((b) => b.id)
    ).toEqual(['missing']);
  });

  test('admins can target existing images for direct replacement', () => {
    expect(
      uploadTargetsForMode([bromide('missing'), bromide('filled', 'https://example.com/x.jpg')], {
        adminEdit: true
      }).map((b) => b.id)
    ).toEqual(['missing', 'filled']);
  });
});
