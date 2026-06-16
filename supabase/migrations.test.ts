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
});
