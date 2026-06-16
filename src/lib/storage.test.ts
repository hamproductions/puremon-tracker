import { describe, expect, test } from 'bun:test';
import { bromideStoragePath } from './storage';

const base = 'https://proj.supabase.co/storage/v1/object/public/bromides/';

describe('bromideStoragePath', () => {
  test('extracts the object path from a public bromides url', () => {
    expect(bromideStoragePath(`${base}floral:flat:L:1/1700000000000.jpg`)).toBe(
      'floral:flat:L:1/1700000000000.jpg'
    );
  });

  test('decodes percent-encoded segments and drops query string', () => {
    expect(bromideStoragePath(`${base}floral%3Aflat/1.jpg?download=x`)).toBe('floral:flat/1.jpg');
  });

  test('returns null for non-bromides, data, external, and empty urls', () => {
    expect(bromideStoragePath(null)).toBeNull();
    expect(bromideStoragePath(undefined)).toBeNull();
    expect(bromideStoragePath('data:image/jpeg;base64,abc')).toBeNull();
    expect(bromideStoragePath('https://cdn.example.com/x.jpg')).toBeNull();
    expect(bromideStoragePath(`https://proj.supabase.co/storage/v1/object/public/other/x.jpg`)).toBeNull();
  });

  test('rejects path traversal and absolute paths', () => {
    expect(bromideStoragePath(`${base}../secrets/key.jpg`)).toBeNull();
    expect(bromideStoragePath(`${base}a/../../b.jpg`)).toBeNull();
    expect(bromideStoragePath(`${base}%2Fetc/passwd`)).toBeNull();
  });

  test('returns null on malformed percent-encoding', () => {
    expect(bromideStoragePath(`${base}bad%E0%A4%A.jpg`)).toBeNull();
  });
});
