import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSupabase, isSupabaseConfigured } from '~/lib/supabase';
import { resolveProfile } from '~/lib/authProfile';
import { clearE2EProfile, readE2EProfile } from '~/lib/e2eAuth';
import { clearAnonymousOwnershipState } from '~/lib/localProductState';
import type { Profile } from '~/types';
import { toAppUrl } from '~/utils/url';

interface AuthState {
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  signInWithTwitter: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthState | null>(null);

export function useProvideAuth(): AuthState {
  const queryClient = useQueryClient();
  const initialE2EProfile = readE2EProfile();
  const [profile, setProfile] = useState<Profile | null>(initialE2EProfile);
  const [loading, setLoading] = useState(isSupabaseConfigured && !initialE2EProfile);

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
    void sb.auth.getSession().then(async ({ data }) => {
      setProfile(await resolveProfile(sb, data.session?.user));
      setLoading(false);
    });
    const {
      data: { subscription }
    } = sb.auth.onAuthStateChange((_event, session) => {
      void resolveProfile(sb, session?.user).then(setProfile);
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
    clearAnonymousOwnershipState();
    const sb = getSupabase();
    await sb?.auth.signOut();
    setProfile(null);
    queryClient.clear();
  };

  const isAdmin = Boolean(profile?.isAdmin);

  return {
    profile,
    loading,
    isAdmin,
    isConfigured: isSupabaseConfigured,
    signInWithTwitter,
    signOut
  };
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
