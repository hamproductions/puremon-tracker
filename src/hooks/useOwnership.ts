import { ownershipStore, useStore } from '~/data/store';
import type { OwnershipMap } from '~/types';

function withCount(map: OwnershipMap, id: string, count: number): OwnershipMap {
  const next = { ...map };
  if (count > 0) next[id] = count;
  else delete next[id];
  return next;
}

export function useOwnership() {
  const ownership = useStore(ownershipStore);

  const setCount = (id: string, count: number) => {
    ownershipStore.update((map) => withCount(map, id, Math.max(0, Math.floor(count))));
  };

  const increment = (id: string, delta = 1) => {
    ownershipStore.update((map) => withCount(map, id, Math.max(0, (map[id] ?? 0) + delta)));
  };

  const toggle = (id: string) => {
    ownershipStore.update((map) => withCount(map, id, (map[id] ?? 0) > 0 ? 0 : 1));
  };

  const clearAll = () => ownershipStore.set({});

  const importMerge = (incoming: OwnershipMap, mode: 'max' | 'replace' = 'max') => {
    ownershipStore.update((map) => {
      if (mode === 'replace') return { ...incoming };
      const next = { ...map };
      for (const [id, count] of Object.entries(incoming)) {
        next[id] = Math.max(next[id] ?? 0, count);
      }
      return next;
    });
  };

  return { ownership, setCount, increment, toggle, clearAll, importMerge };
}

export function countOf(ownership: OwnershipMap, id: string): number {
  return ownership[id] ?? 0;
}
