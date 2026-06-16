import { readFileSync } from 'node:fs';
import { SQL } from 'bun';

const conn = process.env.SUPABASE_DB_URL;
if (!conn) {
  console.error('Set SUPABASE_DB_URL to the Supabase Postgres connection string.');
  process.exit(1);
}

const files = [
  'supabase/live-persistence-hotfix-2026-06-16.sql',
  'supabase/live-policy-hotfix-2026-06-16.sql'
];

const sql = new SQL(conn);

for (const file of files) {
  const text = readFileSync(file, 'utf8');
  process.stdout.write(`applying ${file} ... `);
  await sql.unsafe(text);
  console.log('ok');
}

const [{ count: oshi }] = await sql`select count(*)::int as count from public.oshi`;
const [{ count: prefs }] = await sql`select count(*)::int as count from public.user_preferences`;
const [{ exists: slots }] = await sql`
  select exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'collections' and column_name = 'slots'
  ) as exists`;
console.log(`oshi rows: ${oshi}, user_preferences rows: ${prefs}, collections.slots exists: ${slots}`);

await sql.end();
console.log('done');
