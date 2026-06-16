import { afterEach, beforeEach, describe, expect, test } from 'bun:test';
import { clearProductLocalState } from './localProductState';

class MemoryStorage {
  private values = new Map<string, string>();

  getItem(key: string) {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string) {
    this.values.set(key, value);
  }

  removeItem(key: string) {
    this.values.delete(key);
  }

  clear() {
    this.values.clear();
  }
}

describe('clearProductLocalState', () => {
  beforeEach(() => {
    Object.defineProperty(globalThis, 'window', {
      value: globalThis,
      configurable: true
    });
    Object.defineProperty(globalThis, 'localStorage', {
      value: new MemoryStorage(),
      configurable: true
    });
    Object.defineProperty(globalThis, 'sessionStorage', {
      value: new MemoryStorage(),
      configurable: true
    });
  });

  afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  test('removes stale product local state without clearing the e2e auth profile', () => {
    localStorage.setItem('puremon:images', '{}');
    localStorage.setItem('puremon:e2e-profile', '{}');
    sessionStorage.setItem('puremon:e2e-profile', '{"id":"e2e-admin"}');

    clearProductLocalState();

    expect(localStorage.getItem('puremon:images')).toBeNull();
    expect(localStorage.getItem('puremon:e2e-profile')).toBeNull();
    expect(sessionStorage.getItem('puremon:e2e-profile')).toBe('{"id":"e2e-admin"}');
  });
});
