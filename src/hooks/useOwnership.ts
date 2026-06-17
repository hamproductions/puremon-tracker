import { useEffect, useMemo, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOwnershipRemote, replaceOwnershipRemote, setOwnershipRemote } from '~/data/remote';
import { ownershipStore, useStore } from '~/data/store';
import { useToaster } from '~/context/ToasterContext';
import { useAuth } from '~/hooks/useAuth';
import { hasE2EProfile } from '~/lib/e2eAuth';
import { clearAnonymousOwnershipState } from '~/lib/localProductState';
import { isSupabaseConfigured } from '~/lib/supabase';
import type { OwnershipMap } from '~/types';

const ownershipQueryKey = (userId: string | null | undefined) => ['ownership', userId] as const;

function withCount(map: OwnershipMap, id: string, count: number): OwnershipMap {
  const next = { ...map };
  if (count > 0) next[id] = count;
  else delete next[id];
  return next;
}

export function mergeOwnershipForLogin(
  anonymous: OwnershipMap,
  remote: OwnershipMap
): OwnershipMap {
  return { ...anonymous, ...remote };
}

export function useOwnership() {
  const localOwnership = useStore(ownershipStore);
  const { profile } = useAuth();
  const { toast } = useToaster();
  const queryClient = useQueryClient();
  const migratedUsers = useRef(new Set<string>());
  const userId = isSupabaseConfigured && !hasE2EProfile() ? profile?.id : null;
  const remote = Boolean(userId);
  const key = ownershipQueryKey(userId);
  const remoteQuery = useQuery({
    queryKey: key,
    queryFn: async () => (await fetchOwnershipRemote()) ?? {},
    enabled: remote
  });
  const ownership = remote ? (remoteQuery.data ?? {}) : localOwnership;

  useEffect(() => {
    if (!userId || !remoteQuery.isSuccess || migratedUsers.current.has(userId)) return;
    migratedUsers.current.add(userId);
    const anonymous = ownershipStore.get();
    if (Object.keys(anonymous).length === 0) return;
    const merged = mergeOwnershipForLogin(anonymous, remoteQuery.data ?? {});
    queryClient.setQueryData(key, merged);
    void replaceOwnershipRemote(merged)
      .then(() => {
        clearAnonymousOwnershipState();
      })
      .catch((e) => {
        migratedUsers.current.delete(userId);
        console.error('ownership sync failed', e);
      });
  }, [key, queryClient, remoteQuery.data, remoteQuery.isSuccess, userId]);

  const setRemoteCount = useMutation({
    mutationFn: ({ id, count }: { id: string; count: number }) => setOwnershipRemote(id, count),
    onMutate: ({ id, count }) => {
      const previous = queryClient.getQueryData<OwnershipMap>(key) ?? {};
      queryClient.setQueryData<OwnershipMap>(key, withCount(previous, id, count));
      return previous;
    },
    onError: (e, _next, previous) => {
      if (previous) queryClient.setQueryData(key, previous);
      toast({ title: '所持状況の保存に失敗しました', type: 'error' });
      console.error('ownership sync failed', e);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  });

  const replaceRemote = useMutation({
    mutationFn: replaceOwnershipRemote,
    onMutate: (next: OwnershipMap) => {
      const previous = queryClient.getQueryData<OwnershipMap>(key) ?? {};
      queryClient.setQueryData(key, next);
      return previous;
    },
    onError: (e, _next, previous) => {
      if (previous) queryClient.setQueryData(key, previous);
      toast({ title: '所持状況の保存に失敗しました', type: 'error' });
      console.error('ownership sync failed', e);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  });

  const setCount = (id: string, count: number) => {
    const nextCount = Math.max(0, Math.floor(count));
    if (remote) {
      setRemoteCount.mutate({ id, count: nextCount });
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
      replaceRemote.mutate({});
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
      replaceRemote.mutate(clean);
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
