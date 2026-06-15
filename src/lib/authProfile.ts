import type { User } from '@supabase/supabase-js';
import type { Profile } from '~/types';

const ADMIN_HANDLES = (import.meta.env.PUBLIC_ENV__ADMIN_HANDLES ?? '')
  .split(',')
  .map((h) => h.trim().toLowerCase().replace(/^@/, ''))
  .filter(Boolean);

export function isAdminHandle(handle?: string): boolean {
  return handle ? ADMIN_HANDLES.includes(handle.toLowerCase()) : false;
}

export function handleOf(user: User): string | undefined {
  const meta = user.user_metadata ?? {};
  return (meta.user_name ?? meta.preferred_username ?? meta.screen_name ?? meta.name) as
    | string
    | undefined;
}

export function toProfile(user: User | null | undefined): Profile | null {
  if (!user) return null;
  const handle = handleOf(user);
  const meta = user.user_metadata ?? {};
  return {
    id: user.id,
    handle,
    displayName: (meta.full_name ?? meta.name ?? handle) as string | undefined,
    avatarUrl: (meta.avatar_url ?? meta.picture) as string | undefined,
    isAdmin: isAdminHandle(handle)
  };
}
