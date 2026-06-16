import { describe, expect, test } from 'bun:test';
import { mergeOwnershipForLogin } from './useOwnership';

describe('mergeOwnershipForLogin', () => {
  test('migrates anonymous-only counts while keeping server counts on conflicts', () => {
    expect(
      mergeOwnershipForLogin(
        {
          'floral:momo:L:1': 1,
          'floral:moeno:L:1': 2
        },
        {
          'floral:momo:L:1': 3,
          'floral:reina:L:1': 1
        }
      )
    ).toEqual({
      'floral:momo:L:1': 3,
      'floral:moeno:L:1': 2,
      'floral:reina:L:1': 1
    });
  });
});
