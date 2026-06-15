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
});
