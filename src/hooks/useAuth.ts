import { useEffect, useState } from 'react';
import { getSupabase, isSupabaseConfigured } from '~/lib/supabase';
import { localAdminStore, useStore } from '~/data/store';
import { toProfile } from '~/lib/authProfile';
import { clearE2EProfile, readE2EProfile } from '~/lib/e2eAuth';
import type { Profile } from '~/types';
import { toAppUrl } from '~/utils/url';

export function useAuth() {
  const initialE2EProfile = readE2EProfile();
  const [profile, setProfile] = useState<Profile | null>(initialE2EProfile);
  const [loading, setLoading] = useState(isSupabaseConfigured && !initialE2EProfile);
  const localAdmin = useStore(localAdminStore);

  useEffect(() => {
    const e2eProfile = readE2EProfile();
    if (e2eProfile) {
      setProfile(e2eProfile);
      setLoading(false);
      return;
    }
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
    clearE2EProfile();
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
