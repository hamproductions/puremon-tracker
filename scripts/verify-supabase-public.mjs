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
