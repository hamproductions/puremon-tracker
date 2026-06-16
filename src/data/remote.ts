import { getSupabase } from '~/lib/supabase';
import type { Collection, Member, OwnershipMap } from '~/types';

export interface RemoteCatalog {
  members: Member[];
  collections: Collection[];
  images: Record<string, string>;
}

interface CollectionRow {
  id: string;
  title: string;
  description: string | null;
  release_date: string | null;
  kind: Collection['kind'];
  member_ids: string[] | null;
  numbers: number[] | null;
  sizes: string[] | null;
  slots: Collection['slots'] | null;
  items: Collection['items'] | null;
  created_at: string;
}

interface MemberRow {
  id: string;
  name: string;
  name_kana: string;
  nickname: string;
  color: string;
  order: number;
}

function toMember(r: MemberRow): Member {
  return {
    id: r.id,
    name: r.name,
    nameKana: r.name_kana,
    nickname: r.nickname,
    color: r.color,
    order: r.order
  };
}

function toCollection(r: CollectionRow): Collection {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? undefined,
    releaseDate: r.release_date ?? undefined,
    kind: r.kind,
    memberIds: r.member_ids ?? [],
    numbers: r.numbers ?? [],
    sizes: r.sizes && r.sizes.length > 0 ? r.sizes : undefined,
    slots: r.slots ?? undefined,
    items: r.items ?? undefined,
    createdAt: r.created_at
  };
}

function fromCollection(c: Collection): CollectionRow {
  return {
    id: c.id,
    title: c.title,
    description: c.description ?? null,
    release_date: c.releaseDate ?? null,
    kind: c.kind,
    member_ids: c.memberIds,
    numbers: c.numbers,
    sizes: c.sizes ?? null,
    slots: c.slots ?? null,
    items: c.items ?? null,
    created_at: c.createdAt
  };
}

function fromMember(m: Member): MemberRow {
  return {
    id: m.id,
    name: m.name,
    name_kana: m.nameKana,
    nickname: m.nickname,
    color: m.color,
    order: m.order
  };
}

export async function fetchRemoteCatalog(): Promise<RemoteCatalog | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const [members, collections, images] = await Promise.all([
      sb.from('members').select('*').order('order'),
      sb.from('collections').select('*'),
      sb.from('bromide_images').select('*')
    ]);
    if (members.error || collections.error || images.error) return null;
    const imageMap: Record<string, string> = {};
    for (const row of (images.data ?? []) as { bromide_id: string; image_url: string }[]) {
      imageMap[row.bromide_id] = row.image_url;
    }
    return {
      members: ((members.data ?? []) as MemberRow[]).map(toMember),
      collections: ((collections.data ?? []) as CollectionRow[]).map(toCollection),
      images: imageMap
    };
  } catch {
    return null;
  }
}

export async function upsertCollectionRemote(collection: Collection): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('collections').upsert(fromCollection(collection));
  if (error) throw error;
}

export async function deleteCollectionRemote(id: string): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('collections').delete().eq('id', id);
  if (error) throw error;
}

export async function upsertMemberRemote(member: Member): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const { error } = await sb.from('members').upsert(fromMember(member));
  if (error) throw error;
}

export async function setBromideImageRemote(bromideId: string, url: string | null): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  if (url) {
    const { error } = await sb
      .from('bromide_images')
      .upsert({ bromide_id: bromideId, image_url: url });
    if (error) throw error;
  } else {
    const { error } = await sb.from('bromide_images').delete().eq('bromide_id', bromideId);
    if (error) throw error;
  }
}

async function currentUserId(): Promise<string | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const {
    data: { session }
  } = await sb.auth.getSession();
  return session?.user.id ?? null;
}

export async function fetchOwnershipRemote(): Promise<OwnershipMap | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await sb
    .from('ownership')
    .select('bromide_id,count')
    .eq('user_id', userId);
  if (error) throw error;
  const next: OwnershipMap = {};
  for (const row of (data ?? []) as { bromide_id: string; count: number }[]) {
    if (row.count > 0) next[row.bromide_id] = row.count;
  }
  return next;
}

export async function setOwnershipRemote(bromideId: string, count: number): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const userId = await currentUserId();
  if (!userId) return;
  if (count > 0) {
    const { error } = await sb.from('ownership').upsert({
      user_id: userId,
      bromide_id: bromideId,
      count,
      updated_at: new Date().toISOString()
    });
    if (error) throw error;
  } else {
    const { error } = await sb
      .from('ownership')
      .delete()
      .eq('user_id', userId)
      .eq('bromide_id', bromideId);
    if (error) throw error;
  }
}

export async function replaceOwnershipRemote(ownership: OwnershipMap): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const userId = await currentUserId();
  if (!userId) return;
  const { error: deleteError } = await sb.from('ownership').delete().eq('user_id', userId);
  if (deleteError) throw deleteError;
  const rows = Object.entries(ownership)
    .filter(([, count]) => count > 0)
    .map(([bromideId, count]) => ({
      user_id: userId,
      bromide_id: bromideId,
      count,
      updated_at: new Date().toISOString()
    }));
  if (rows.length === 0) return;
  const { error } = await sb.from('ownership').insert(rows);
  if (error) throw error;
}

export async function fetchOshiRemote(): Promise<string[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await sb
    .from('oshi')
    .select('member_id')
    .eq('user_id', userId)
    .order('created_at');
  if (error) throw error;
  return ((data ?? []) as { member_id: string }[]).map((row) => row.member_id);
}

export async function setOshiRemote(memberId: string, selected: boolean): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const userId = await currentUserId();
  if (!userId) return;
  if (selected) {
    const { error } = await sb.from('oshi').upsert({
      user_id: userId,
      member_id: memberId,
      created_at: new Date().toISOString()
    });
    if (error) throw error;
  } else {
    const { error } = await sb
      .from('oshi')
      .delete()
      .eq('user_id', userId)
      .eq('member_id', memberId);
    if (error) throw error;
  }
}

export async function fetchPreferenceRemote<T>(key: string): Promise<T | null> {
  const sb = getSupabase();
  if (!sb) return null;
  const userId = await currentUserId();
  if (!userId) return null;
  const { data, error } = await sb
    .from('user_preferences')
    .select('value')
    .eq('user_id', userId)
    .eq('key', key)
    .maybeSingle();
  if (error) throw error;
  return data ? ((data as { value: T }).value ?? null) : null;
}

export async function setPreferenceRemote<T>(key: string, value: T): Promise<void> {
  const sb = getSupabase();
  if (!sb) return;
  const userId = await currentUserId();
  if (!userId) return;
  const { error } = await sb.from('user_preferences').upsert({
    user_id: userId,
    key,
    value,
    updated_at: new Date().toISOString()
  });
  if (error) throw error;
}
