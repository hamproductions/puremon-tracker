import { describe, expect, test } from 'bun:test';
import { createImageSubmission } from './submissions';

describe('createImageSubmission', () => {
  test('rejects image submissions without an authenticated profile', () => {
    expect(() =>
      createImageSubmission({
        bromideId: 'mixed-2024:momo:1',
        imageUrl: 'data:image/jpeg;base64,x',
        now: '2026-06-15T00:00:00.000Z',
        id: 'sub-1'
      })
    ).toThrow('login required');
  });

  test('creates a pending submission for an authenticated user', () => {
    const submission = createImageSubmission({
      bromideId: 'mixed-2024:momo:1',
      imageUrl: 'data:image/jpeg;base64,x',
      profile: {
        id: 'user-1',
        handle: 'momochun',
        displayName: 'Momochun',
        avatarUrl: 'https://example.test/avatar.jpg',
        isAdmin: false
      },
      now: '2026-06-15T00:00:00.000Z',
      id: 'sub-1'
    });

    expect(submission).toEqual({
      id: 'sub-1',
      bromideId: 'mixed-2024:momo:1',
      imageUrl: 'data:image/jpeg;base64,x',
      status: 'pending',
      submittedBy: 'user-1',
      submittedHandle: 'momochun',
      createdAt: '2026-06-15T00:00:00.000Z'
    });
  });

  test('keeps authenticated submitter identity for remote review', () => {
    const submission = createImageSubmission({
      bromideId: 'floral:momo:L:1',
      imageUrl: 'https://example.test/image.jpg',
      profile: {
        id: 'user-1',
        handle: 'momochun',
        displayName: 'Momochun',
        avatarUrl: 'https://example.test/avatar.jpg',
        isAdmin: false
      },
      now: '2026-06-15T00:00:00.000Z',
      id: 'sub-2'
    });

    expect(submission.submittedBy).toBe('user-1');
    expect(submission.submittedHandle).toBe('momochun');
    expect(submission.status).toBe('pending');
  });
});
