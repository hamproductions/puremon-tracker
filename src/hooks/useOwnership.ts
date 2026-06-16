import { useEffect, useMemo, useState } from 'react';
import { fetchOwnershipRemote, replaceOwnershipRemote, setOwnershipRemote } from '~/data/remote';
import { ownershipStore, useStore } from '~/data/store';
import { hasE2EProfile } from '~/lib/e2eAuth';
import { clearAnonymousOwnershipState } from '~/lib/localProductState';
import { getSupabase, isSupabaseConfigured } from '~/lib/supabase';
import type { OwnershipMap } from '~/types';

function withCount(map: OwnershipMap, id: string, count: number): OwnershipMap {
  const next = { ...map };
  if (count > 0) next[id] = count;
  else delete next[id];
  return next;
}

export function useOwnership() {
  const localOwnership = useStore(ownershipStore);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [remoteOwnership, setRemoteOwnership] = useState<OwnershipMap | null>(null);
  const remote = Boolean(remoteUserId);
  const ownership = remote ? (remoteOwnership ?? {}) : localOwnership;

  useEffect(() => {
    if (!isSupabaseConfigured || hasE2EProfile()) return;
    const sb = getSupabase();
    if (!sb) return;
    let cancelled = false;
    const load = async () => {
      const {
        data: { session }
      } = await sb.auth.getSession();
      if (cancelled) return;
      const userId = session?.user.id ?? null;
      setRemoteUserId(userId);
      if (!userId) {
        setRemoteOwnership(null);
        return;
      }
      clearAnonymousOwnershipState();
      const next = await fetchOwnershipRemote();
      if (!cancelled) setRemoteOwnership(next ?? {});
    };
    void load();
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange(() => {
      void load();
    });
    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const updateRemote = (fn: (map: OwnershipMap) => OwnershipMap) => {
    setRemoteOwnership((map) => fn(map ?? {}));
  };

  const setCount = (id: string, count: number) => {
    const nextCount = Math.max(0, Math.floor(count));
    if (remote) {
      updateRemote((map) => withCount(map, id, nextCount));
      void setOwnershipRemote(id, nextCount).catch((e) =>
        console.error('ownership sync failed', e)
      );
      return;
    }
    ownershipStore.update((map) => withCount(map, id, nextCount));
  };

  const increment = (id: string, delta = 1) => {
    setCount(id, Math.max(0, (ownership[id] ?? 0) + delta));
  };

  const toggle = (id: string) => {
    setCount(id, (ownership[id] ?? 0) > 0 ? 0 : 1);
  };

  const clearAll = () => {
    if (remote) {
      setRemoteOwnership({});
      void replaceOwnershipRemote({}).catch((e) => console.error('ownership sync failed', e));
      return;
    }
    ownershipStore.set({});
  };

  const importMerge = (incoming: OwnershipMap, mode: 'max' | 'replace' = 'max') => {
    if (remote) {
      const base = mode === 'replace' ? {} : ownership;
      const next = { ...base };
      for (const [id, count] of Object.entries(incoming)) {
        next[id] = mode === 'replace' ? count : Math.max(next[id] ?? 0, count);
      }
      const clean = Object.fromEntries(
        Object.entries(next).filter(([, count]) => count > 0)
      ) as OwnershipMap;
      setRemoteOwnership(clean);
      void replaceOwnershipRemote(clean).catch((e) => console.error('ownership sync failed', e));
      return;
    }
    ownershipStore.update((map) => {
      if (mode === 'replace') return { ...incoming };
      const next = { ...map };
      for (const [id, count] of Object.entries(incoming)) {
        next[id] = Math.max(next[id] ?? 0, count);
      }
      return next;
    });
  };

  return useMemo(
    () => ({ ownership, setCount, increment, toggle, clearAll, importMerge }),
    [ownership, remote]
  );
}

export function countOf(ownership: OwnershipMap, id: string): number {
  return ownership[id] ?? 0;
}
