import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const migration = (name: string) =>
  readFileSync(join(import.meta.dir, 'migrations', name), 'utf8');

describe('supabase policies', () => {
  test('blocks non-admin users from changing their own admin flag', () => {
    const sql = migration('0003_profile_admin_guard.sql');

    expect(sql).toContain('prevent_profile_admin_self_escalation');
    expect(sql).toContain('new.is_admin is distinct from old.is_admin');
    expect(sql).toContain('auth.uid() is not null');
    expect(sql).toContain('not public.is_admin(auth.uid())');
    expect(sql).toContain('before update on public.profiles');
  });

  test('keeps profile update policy from accepting admin flag escalation', () => {
    const sql = migration('0004_profile_update_policy_guard.sql');

    expect(sql).toContain('drop policy if exists "users update own profile"');
    expect(sql).toContain('is_admin = public.is_admin(auth.uid())');
    expect(sql).toContain('create policy "admins update profiles"');
  });

  test('keeps profile rows private from anonymous readers', () => {
    const sql = migration('0005_profile_read_policy_guard.sql');

    expect(sql).toContain('drop policy if exists "profiles are readable by everyone"');
    expect(sql).toContain('create policy "users read own profile"');
    expect(sql).toContain('auth.uid() = id');
    expect(sql).toContain('create policy "admins read profiles"');
  });

  test('bundles the live profile policy hotfix', () => {
    const sql = readFileSync(join(import.meta.dir, 'live-policy-hotfix-2026-06-16.sql'), 'utf8');

    expect(sql).toContain('prevent_profile_admin_self_escalation');
    expect(sql).toContain('drop policy if exists "users update own profile"');
    expect(sql).toContain('is_admin = public.is_admin(auth.uid())');
    expect(sql).toContain('drop policy if exists "profiles are readable by everyone"');
    expect(sql).toContain('create policy "users read own profile"');
    expect(sql).toContain('create policy "admins read profiles"');
  });

  test('syncs selected oshi per authenticated user', () => {
    const sql = migration('0006_oshi_sync.sql');

    expect(sql).toContain('create table if not exists public.oshi');
    expect(sql).toContain('user_id uuid not null references auth.users');
    expect(sql).toContain('member_id text not null references public.members');
    expect(sql).toContain('primary key (user_id, member_id)');
    expect(sql).toContain('alter table public.oshi enable row level security');
    expect(sql).toContain('create policy "owner manages own oshi"');
    expect(sql).toContain('auth.uid() = user_id');
  });

  test('syncs authenticated user preferences', () => {
    const sql = migration('0007_user_preferences.sql');

    expect(sql).toContain('create table if not exists public.user_preferences');
    expect(sql).toContain('user_id uuid not null references auth.users');
    expect(sql).toContain('key text not null');
    expect(sql).toContain("value jsonb not null default '{}'::jsonb");
    expect(sql).toContain('primary key (user_id, key)');
    expect(sql).toContain('alter table public.user_preferences enable row level security');
    expect(sql).toContain('create policy "owner manages own preferences"');
    expect(sql).toContain('auth.uid() = user_id');
  });

  test('bundles the live persistence hotfix', () => {
    const sql = readFileSync(
      join(import.meta.dir, 'live-persistence-hotfix-2026-06-16.sql'),
      'utf8'
    );

    expect(sql).toContain('create table if not exists public.oshi');
    expect(sql).toContain('create policy "owner manages own oshi"');
    expect(sql).toContain('create table if not exists public.user_preferences');
    expect(sql).toContain('create policy "owner manages own preferences"');
    expect(sql).toContain('add column if not exists slots jsonb');
  });

  test('adds stable bromide slots to collections', () => {
    const sql = migration('0008_stable_bromide_slots.sql');

    expect(sql).toContain('alter table public.collections');
    expect(sql).toContain('add column if not exists slots jsonb');
  });
});
