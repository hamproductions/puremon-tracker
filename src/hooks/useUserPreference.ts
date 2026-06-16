import { useEffect, useState } from 'react';
import { fetchPreferenceRemote, setPreferenceRemote } from '~/data/remote';
import { hasE2EProfile } from '~/lib/e2eAuth';
import { getSupabase, isSupabaseConfigured } from '~/lib/supabase';

export function useUserPreference<T>(
  key: string,
  initial: T
): [T, (next: T | ((prev: T) => T)) => void] {
  const [value, setValue] = useState(initial);
  const [remoteUserId, setRemoteUserId] = useState<string | null>(null);

  useEffect(() => {
    setValue(initial);
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
        setValue(initial);
        return;
      }
      try {
        const next = await fetchPreferenceRemote<T>(key);
        if (!cancelled) setValue(next ?? initial);
      } catch (e) {
        console.error('preference sync failed', e);
        if (!cancelled) setValue(initial);
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
  }, [key, initial]);

  const update = (next: T | ((prev: T) => T)) => {
    setValue((prev) => {
      const value = typeof next === 'function' ? (next as (prev: T) => T)(prev) : next;
      if (remoteUserId) {
        void setPreferenceRemote(key, value).catch((e) =>
          console.error('preference sync failed', e)
        );
      }
      return value;
    });
  };

  return [value, update];
}
