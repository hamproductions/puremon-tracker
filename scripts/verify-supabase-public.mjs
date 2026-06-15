import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

function readEnv() {
  const env = readFileSync('.env', 'utf8');
  return Object.fromEntries(
    env
      .split(/\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#'))
      .map((line) => {
        const i = line.indexOf('=');
        return [line.slice(0, i), line.slice(i + 1)];
      })
  );
}

function requirePass(name, passed, detail) {
  if (!passed) {
    console.error(`${name}: FAIL`);
    console.error(detail);
    process.exitCode = 1;
    return;
  }
  console.log(`${name}: PASS`);
}

const env = readEnv();
const url = env.PUBLIC_ENV__SUPABASE_URL;
const anonKey = env.PUBLIC_ENV__SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  console.error('PUBLIC_ENV__SUPABASE_URL and PUBLIC_ENV__SUPABASE_ANON_KEY are required');
  process.exit(1);
}

const sb = createClient(url, anonKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

const members = await sb.from('members').select('id').limit(1);
requirePass('public members read', !members.error && (members.data?.length ?? 0) > 0, members.error?.message);

const collections = await sb.from('collections').select('id').limit(1);
requirePass(
  'public collections read',
  !collections.error && (collections.data?.length ?? 0) > 0,
  collections.error?.message
);

const images = await sb.from('bromide_images').select('bromide_id').limit(1);
requirePass('public approved images read', !images.error, images.error?.message);

const submission = await sb.from('submissions').insert({
  id: `anon-policy-test-${Date.now()}`,
  bromide_id: 'policy-test',
  image_url: 'https://example.com/test.jpg',
  submitted_by: '00000000-0000-0000-0000-000000000000'
});
requirePass(
  'anonymous submission insert blocked',
  Boolean(submission.error),
  'anonymous insert unexpectedly succeeded'
);

const upload = await sb.storage
  .from('bromides')
  .upload(`anon-policy-test/${Date.now()}.jpg`, new Blob(['x'], { type: 'image/jpeg' }), {
    contentType: 'image/jpeg'
  });
requirePass(
  'anonymous storage upload blocked',
  Boolean(upload.error),
  'anonymous upload unexpectedly succeeded'
);

const testEmail = process.env.SUPABASE_TEST_EMAIL;
const testPassword = process.env.SUPABASE_TEST_PASSWORD;

if (!testEmail || !testPassword) {
  console.log('authenticated admin-escalation check: SKIP');
  console.log('set SUPABASE_TEST_EMAIL and SUPABASE_TEST_PASSWORD for a disposable non-admin user');
  process.exit(process.exitCode ?? 0);
}

const auth = await sb.auth.signInWithPassword({
  email: testEmail,
  password: testPassword
});

requirePass('test user sign-in', !auth.error && Boolean(auth.data.user), auth.error?.message);

if (!auth.data.user) process.exit(process.exitCode ?? 1);

const profile = await sb.from('profiles').select('id,is_admin').eq('id', auth.data.user.id).single();
requirePass('test user profile readable', !profile.error, profile.error?.message);
requirePass('test user is non-admin', profile.data?.is_admin === false, 'test user is already admin');

if (profile.data?.is_admin === false) {
  const escalation = await sb
    .from('profiles')
    .update({ is_admin: true })
    .eq('id', auth.data.user.id)
    .select('id,is_admin');
  if (!escalation.error) {
    const rollback = await sb
      .from('profiles')
      .update({ is_admin: false })
      .eq('id', auth.data.user.id);
    if (rollback.error) console.error(`non-admin rollback failed: ${rollback.error.message}`);
  }
  requirePass(
    'non-admin profile admin escalation blocked',
    Boolean(escalation.error),
    'non-admin is_admin update unexpectedly succeeded'
  );
}

await sb.auth.signOut();
