import { useSyncExternalStore } from 'react';
import type { RemoteCatalog } from '~/data/remote';
import type { Collection, Member, OwnershipMap, Submission, TradeListing } from '~/types';

type Listener = () => void;

export interface PersistedStore<T> {
  key: string;
  get: () => T;
  set: (next: T) => void;
  update: (fn: (prev: T) => T) => void;
  subscribe: (listener: Listener) => () => void;
  getServerSnapshot: () => T;
}

function createPersistedStore<T>(key: string, initial: T): PersistedStore<T> {
  let value: T = initial;
  let hydrated = false;
  const listeners = new Set<Listener>();

  const read = (): T => {
    if (typeof window === 'undefined') return initial;
    try {
      const raw = localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initial;
    } catch {
      return initial;
    }
  };

  const ensureHydrated = () => {
    if (!hydrated && typeof window !== 'undefined') {
      value = read();
      hydrated = true;
    }
  };

  const set = (next: T) => {
    value = next;
    hydrated = true;
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(key, JSON.stringify(next));
      } catch {
        /* quota / private mode — keep in-memory */
      }
    }
    listeners.forEach((l) => l());
  };

  return {
    key,
    get() {
      ensureHydrated();
      return value;
    },
    set,
    update(fn) {
      set(fn(this.get()));
    },
    subscribe(listener) {
      ensureHydrated();
      listeners.add(listener);
      const onStorage = (e: StorageEvent) => {
        if (e.key !== key) return;
        value = read();
        listeners.forEach((l) => l());
      };
      if (typeof window !== 'undefined') window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        if (typeof window !== 'undefined') window.removeEventListener('storage', onStorage);
      };
    },
    getServerSnapshot() {
      return initial;
    }
  };
}

function createMemoryStore<T>(key: string, initial: T): PersistedStore<T> {
  let value: T = initial;
  const listeners = new Set<Listener>();

  const set = (next: T) => {
    value = next;
    listeners.forEach((l) => l());
  };

  return {
    key,
    get() {
      return value;
    },
    set,
    update(fn) {
      set(fn(value));
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    getServerSnapshot() {
      return initial;
    }
  };
}

export function useStore<T>(store: PersistedStore<T>): T {
  return useSyncExternalStore(store.subscribe, store.get, store.getServerSnapshot);
}

export const customCollectionsStore = createMemoryStore<Collection[]>('puremon:collections', []);
export const deletedCollectionsStore = createMemoryStore<string[]>(
  'puremon:deleted-collections',
  []
);
export const customMembersStore = createMemoryStore<Member[]>('puremon:members', []);
export const bromideImagesStore = createMemoryStore<Record<string, string>>('puremon:images', {});
export const ownershipStore = createPersistedStore<OwnershipMap>('puremon:ownership', {});
export const submissionsStore = createMemoryStore<Submission[]>('puremon:submissions', []);
export const tradesStore = createPersistedStore<TradeListing[]>('puremon:trades', []);
export const remoteCatalogStore = createMemoryStore<RemoteCatalog | null>(
  'puremon:remote-catalog',
  null
);
export const oshiStore = createPersistedStore<string[]>('puremon:oshi', []);
