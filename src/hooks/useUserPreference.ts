import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchPreferenceRemote, setPreferenceRemote } from '~/data/remote';
import { useAuth } from '~/hooks/useAuth';
import { isSupabaseConfigured } from '~/lib/supabase';

const preferenceQueryKey = (userId: string | null | undefined, key: string) =>
  ['preference', userId, key] as const;

export function useUserPreference<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const [localValue, setLocalValue] = useState(initial);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const userId = isSupabaseConfigured ? profile?.id : null;
  const remote = Boolean(userId);
  const queryKey = preferenceQueryKey(userId, key);
  const query = useQuery({
    queryKey,
    queryFn: async () => (await fetchPreferenceRemote<T>(key)) ?? initial,
    enabled: remote
  });
  const value = remote ? (query.data ?? initial) : localValue;

  useEffect(() => {
    if (!remote) setLocalValue(initial);
  }, [initial, remote]);

  const mutation = useMutation({
    mutationFn: (next: T) => setPreferenceRemote(key, next),
    onMutate: (next: T) => {
      const previous = queryClient.getQueryData<T>(queryKey) ?? initial;
      queryClient.setQueryData(queryKey, next);
      return previous;
    },
    onError: (e, _next, previous) => {
      queryClient.setQueryData(queryKey, previous);
      console.error('preference sync failed', e);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey });
    }
  });

  const update = (next: T | ((prev: T) => T)) => {
    const updated = typeof next === 'function' ? (next as (prev: T) => T)(value) : next;
    if (remote) mutation.mutate(updated);
    else setLocalValue(updated);
  };

  return [value, update];
}
