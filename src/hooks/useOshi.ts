import { useEffect, useState } from 'react';
import { fetchOshiRemote, setOshiRemote } from '~/data/remote';
import { oshiStore, useStore } from '~/data/store';
import { hasE2EProfile } from '~/lib/e2eAuth';
import { getSupabase, isSupabaseConfigured } from '~/lib/supabase';

export function useOshi() {
  const localOshi = useStore(oshiStore);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);
  const [remoteOshi, setRemoteOshi] = useState<string[] | null>(null);
  const remote = Boolean(remoteUserId);
  const oshi = remote ? (remoteOshi ?? []) : localOshi;

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
        setRemoteOshi(null);
        return;
      }
      try {
        const next = await fetchOshiRemote();
        if (!cancelled) setRemoteOshi(next ?? []);
      } catch (e) {
        console.error('oshi sync failed', e);
        if (!cancelled) setRemoteOshi([]);
      }
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

  const isOshi = (memberId: string | null) => (memberId ? oshi.includes(memberId) : false);

  const toggleOshi = (memberId: string) => {
    if (remote) {
      const selected = !oshi.includes(memberId);
      setRemoteOshi((list) =>
        selected ? [...(list ?? []), memberId] : (list ?? []).filter((id) => id !== memberId)
      );
      void setOshiRemote(memberId, selected).catch((e) => console.error('oshi sync failed', e));
      return;
    }
    oshiStore.update((list) =>
      list.includes(memberId) ? list.filter((id) => id !== memberId) : [...list, memberId]
    );
  };

  return { oshi, isOshi, toggleOshi };
}
