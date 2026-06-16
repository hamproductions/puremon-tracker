import type { Profile } from '~/types';

const KEY = 'puremon:e2e-profile';

function enabled() {
  return import.meta.env.DEV && import.meta.env.PUBLIC_ENV__ENABLE_E2E_AUTH === 'true';
}

export function readE2EProfile(): Profile | null {
  if (!enabled() || typeof window === 'undefined') return null;
  const role = new URLSearchParams(window.location.search).get('e2e_user');
  if (role === 'user' || role === 'admin') {
    const profile = makeE2EProfile(role);
    window.localStorage.removeItem(KEY);
    window.sessionStorage.setItem(KEY, JSON.stringify(profile));
    return profile;
  }
  try {
    window.localStorage.removeItem(KEY);
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Profile) : null;
  } catch {
    return null;
  }
}

export function clearE2EProfile() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(KEY);
  window.sessionStorage.removeItem(KEY);
}

export function hasE2EProfile(): boolean {
  return Boolean(readE2EProfile());
}

function makeE2EProfile(role: 'user' | 'admin'): Profile {
  const admin = role === 'admin';
  return {
    id: admin ? 'e2e-admin' : 'e2e-user',
    handle: admin ? 'HamP_punipuni' : 'puremon_test',
    displayName: admin ? 'E2E Admin' : 'E2E User',
    isAdmin: admin
  };
}
