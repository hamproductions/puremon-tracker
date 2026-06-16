import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchOshiRemote, setOshiRemote } from '~/data/remote';
import { oshiStore, useStore } from '~/data/store';
import { useAuth } from '~/hooks/useAuth';
import { isSupabaseConfigured } from '~/lib/supabase';

const oshiQueryKey = (userId: string | null | undefined) => ['oshi', userId] as const;

export function useOshi() {
  const localOshi = useStore(oshiStore);
  const { profile } = useAuth();
  const queryClient = useQueryClient();
  const userId = isSupabaseConfigured ? profile?.id : null;
  const remote = Boolean(userId);
  const key = oshiQueryKey(userId);
  const remoteQuery = useQuery({
    queryKey: key,
    queryFn: async () => (await fetchOshiRemote()) ?? [],
    enabled: remote
  });
  const oshi = remote ? (remoteQuery.data ?? []) : localOshi;

  const remoteMutation = useMutation({
    mutationFn: ({ memberId, selected }: { memberId: string; selected: boolean }) =>
      setOshiRemote(memberId, selected),
    onMutate: ({ memberId, selected }) => {
      const previous = queryClient.getQueryData<string[]>(key) ?? [];
      queryClient.setQueryData<string[]>(
        key,
        selected ? [...previous, memberId] : previous.filter((id) => id !== memberId)
      );
      return previous;
    },
    onError: (e, _next, previous) => {
      if (previous) queryClient.setQueryData(key, previous);
      console.error('oshi sync failed', e);
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: key });
    }
  });

  const isOshi = (memberId: string | null) => (memberId ? oshi.includes(memberId) : false);

  const toggleOshi = (memberId: string) => {
    if (remote) {
      const selected = !oshi.includes(memberId);
      remoteMutation.mutate({ memberId, selected });
      return;
    }
    oshiStore.update((list) =>
      list.includes(memberId) ? list.filter((id) => id !== memberId) : [...list, memberId]
    );
  };

  return { oshi, isOshi, toggleOshi };
}
