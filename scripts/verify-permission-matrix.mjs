import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'node:fs';

function readEnv() {
  const env = readFileSync('.env', 'utf8');
  return Object.fromEntries(
    env
      .split(/\n/)
      .map((l) => l.trim())
      .filter((l) => l && !l.startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=');
        return [l.slice(0, i), l.slice(i + 1)];
      })
  );
}

const env = readEnv();
const url = env.PUBLIC_ENV__SUPABASE_URL;
const anonKey = env.PUBLIC_ENV__SUPABASE_ANON_KEY;

let failures = 0;
function check(name, passed, detail = '') {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}${passed ? '' : '  <- ' + detail}`);
  if (!passed) failures += 1;
}

function client() {
  return createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function signedClient(email, password) {
  const c = client();
  const { error } = await c.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`sign-in ${email}: ${error.message}`);
  return c;
}

const PW = process.env.SUPABASE_TEST_PASSWORD;
const anon = client();
const user = await signedClient(process.env.SUPABASE_TEST_USER_EMAIL || 'test_user@ham-san.net', PW);
const admin = await signedClient(
  process.env.SUPABASE_TEST_ADMIN_EMAIL || 'test_admin@ham-san.net',
  PW
);

const { data: members } = await anon.from('members').select('id').limit(1);
const memberId = members?.[0]?.id;
const { data: cols } = await anon.from('collections').select('id').limit(1);
const sampleBromideId = `${cols?.[0]?.id ?? 'floral'}:perm-test:L:1`;

async function writeBlocked(c, table, row) {
  const { error } = await c.from(table).insert(row);
  return Boolean(error);
}

console.log('--- catalog read (everyone) ---');
check('anon reads members', !(await anon.from('members').select('id').limit(1)).error);
check('anon reads collections', !(await anon.from('collections').select('id').limit(1)).error);
check('anon reads bromide_images', !(await anon.from('bromide_images').select('bromide_id').limit(1)).error);

console.log('--- catalog write: anon + non-admin BLOCKED, admin ALLOWED ---');
check('anon cannot write collections', await writeBlocked(anon, 'collections', { id: `perm-anon-${Date.now()}`, title: 'x', kind: 'flat' }));
check('anon cannot write members', await writeBlocked(anon, 'members', { id: `perm-anon-${Date.now()}`, name: 'x', order: 999 }));
check('anon cannot write bromide_images', await writeBlocked(anon, 'bromide_images', { bromide_id: sampleBromideId, image_url: 'https://x/y.jpg' }));
check('non-admin cannot write collections', await writeBlocked(user, 'collections', { id: `perm-user-${Date.now()}`, title: 'x', kind: 'flat' }));
check('non-admin cannot write members', await writeBlocked(user, 'members', { id: `perm-user-${Date.now()}`, name: 'x', order: 999 }));
check('non-admin cannot write bromide_images', await writeBlocked(user, 'bromide_images', { bromide_id: sampleBromideId, image_url: 'https://x/y.jpg' }));

const adminColId = `perm-admin-${Date.now()}`;
const adminColErr = (await admin.from('collections').insert({ id: adminColId, title: 'perm test', kind: 'flat', member_ids: [], numbers: [1] })).error;
check('admin CAN write collections', !adminColErr, adminColErr?.message);
const adminImgErr = (await admin.from('bromide_images').insert({ bromide_id: `${adminColId}:flat:1`, image_url: 'https://x/y.jpg' })).error;
check('admin CAN write bromide_images', !adminImgErr, adminImgErr?.message);
// cleanup
await admin.from('bromide_images').delete().eq('bromide_id', `${adminColId}:flat:1`);
await admin.from('collections').delete().eq('id', adminColId);
const stillThere = (await anon.from('collections').select('id').eq('id', adminColId)).data?.length;
check('admin cleanup removed test collection', !stillThere);

console.log('--- submissions: anon BLOCKED, non-admin allowed (own) ---');
check('anon cannot insert submission', await writeBlocked(anon, 'submissions', { id: `perm-anon-sub-${Date.now()}`, bromide_id: sampleBromideId, image_url: 'https://x/y.jpg', status: 'pending' }));
const userId = (await user.auth.getUser()).data.user.id;
const subId = `perm-user-sub-${Date.now()}`;
const userSubErr = (await user.from('submissions').insert({ id: subId, bromide_id: sampleBromideId, image_url: 'https://x/y.jpg', status: 'pending', submitted_by: userId })).error;
check('non-admin CAN insert own submission (submitted_by=self)', !userSubErr, userSubErr?.message);
check('non-admin CANNOT submit as another user', await writeBlocked(user, 'submissions', { id: `perm-spoof-${Date.now()}`, bromide_id: sampleBromideId, image_url: 'https://x/y.jpg', status: 'pending', submitted_by: (await admin.auth.getUser()).data.user.id }));
if (!userSubErr) {
  // admin can read + delete it
  const adminSee = (await admin.from('submissions').select('id').eq('id', subId)).data?.length;
  check('admin can read submissions', Boolean(adminSee));
  await admin.from('submissions').delete().eq('id', subId);
}

console.log('--- per-user data: own RW, cannot write others ---');
if (memberId) {
  const oshiErr = (await user.from('oshi').upsert({ user_id: (await user.auth.getUser()).data.user.id, member_id: memberId })).error;
  check('non-admin CAN upsert own oshi', !oshiErr, oshiErr?.message);
  await user.from('oshi').delete().eq('member_id', memberId);
}
const adminId = (await admin.auth.getUser()).data.user.id;
check("non-admin cannot write another user's oshi", await writeBlocked(user, 'oshi', { user_id: adminId, member_id: memberId }));
check("non-admin cannot write another user's ownership", await writeBlocked(user, 'ownership', { user_id: adminId, bromide_id: sampleBromideId, count: 1 }));
check("non-admin cannot write another user's preference", await writeBlocked(user, 'user_preferences', { user_id: adminId, key: 'x', value: {} }));

console.log('--- profiles: anon blocked, no self-escalation ---');
const anonProfiles = await anon.from('profiles').select('id').limit(1);
check('anon profiles read blocked', Boolean(anonProfiles.error) || anonProfiles.data?.length === 0);
const escal = await user.from('profiles').update({ is_admin: true }).eq('id', (await user.auth.getUser()).data.user.id);
check('non-admin cannot self-escalate', Boolean(escal.error), 'update succeeded');

console.log(`\n${failures === 0 ? 'ALL PASS' : failures + ' FAILURES'}`);
process.exit(failures === 0 ? 0 : 1);
