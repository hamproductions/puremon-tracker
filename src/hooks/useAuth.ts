import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { getSupabase, isSupabaseConfigured } from '~/lib/supabase';
import { localAdminStore, useStore } from '~/data/store';
import type { Profile } from '~/types';
import { toAppUrl } from '~/utils/url';

const ADMIN_HANDLES = (import.meta.env.PUBLIC_ENV__ADMIN_HANDLES ?? '')
  .split(',')
  .map((h) => h.trim().toLowerCase().replace(/^@/, ''))
  .filter(Boolean);

function handleOf(user: User): string | undefined {
  const meta = user.user_metadata ?? {};
  return (meta.user_name ?? meta.preferred_username ?? meta.screen_name ?? meta.name) as
    | string
    | undefined;
}

function toProfile(user: User | null | undefined): Profile | null {
  if (!user) return null;
  const handle = handleOf(user);
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    handle,
    displayName: (meta.full_name ?? meta.name ?? handle) as string | undefined,
    avatarUrl: (meta.avatar_url ?? meta.picture) as string | undefined,
    isAdmin: handle ? ADMIN_HANDLES.includes(handle.toLowerCase()) : false
  };
}

export function useAuth() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const localAdmin = useStore(localAdminStore);

  useEffect(() => {
    const sb = getSupabase();
    if (!sb) {
      setLoading(false);
      return;
    }
    void sb.auth.getSession().then(({ data }) => {
      setProfile(toProfile(data.session?.user));
      setLoading(false);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_event, session) => {
      setProfile(toProfile(session?.user));
    });
    return () => subscription.unsubscribe();
  }, []);

  const signInWithTwitter = async () => {
    const sb = getSupabase();
    if (!sb) return;
    await sb.auth.signInWithOAuth({
      provider: 'x',
      options: { redirectTo: window.location.origin + toAppUrl('/') }
    });
  };

  const signOut = async () => {
    const sb = getSupabase();
    await sb?.auth.signOut();
    setProfile(null);
  };

  const isAdmin = Boolean(profile?.isAdmin) || (localAdmin && !isSupabaseConfigured);

  return {
    profile,
    loading,
    isAdmin,
    localAdmin,
    setLocalAdmin: (v: boolean) => localAdminStore.set(v),
    isConfigured: isSupabaseConfigured,
    signInWithTwitter,
    signOut
  };
}
