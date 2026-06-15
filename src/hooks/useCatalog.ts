import { useEffect, useMemo } from 'react';
import { buildBromides, seedCatalog } from '~/data/catalog';
import {
  deleteCollectionRemote,
  fetchRemoteCatalog,
  setBromideImageRemote,
  upsertCollectionRemote,
  upsertMemberRemote
} from '~/data/remote';
import {
  bromideImagesStore,
  customCollectionsStore,
  customMembersStore,
  deletedCollectionsStore,
  remoteCatalogStore,
  useStore
} from '~/data/store';
import { hasE2EProfile } from '~/lib/e2eAuth';
import { isSupabaseConfigured } from '~/lib/supabase';
import type { Catalog, Collection, Member } from '~/types';

function mergeById<T extends { id: string }>(base: T[], extra: T[]): T[] {
  const map = new Map(base.map((x) => [x.id, x]));
  for (const e of extra) map.set(e.id, { ...map.get(e.id), ...e });
  return [...map.values()];
}

export function buildMergedCatalog(
  baseMembers: Member[],
  baseCollections: Collection[],
  baseImages: Record<string, string>,
  customCollections: Collection[],
  customMembers: Member[],
  localImages: Record<string, string>,
  deletedCollectionIds: string[] = []
): Catalog {
  const members = mergeById(baseMembers, customMembers).sort((a, b) => a.order - b.order);
  const deleted = new Set(deletedCollectionIds);
  const collections = mergeById(baseCollections, customCollections)
    .filter((c) => !deleted.has(c.id))
    .sort((a, b) => (b.releaseDate ?? '').localeCompare(a.releaseDate ?? ''));
  const images = { ...baseImages, ...localImages };
  const bromides = collections
    .flatMap(buildBromides)
    .map((b) => (images[b.id] ? { ...b, imageUrl: images[b.id] } : b));
  return { group: seedCatalog.group, members, collections, bromides };
}

let fetchedOnce = false;

async function refreshRemoteCatalog() {
  const c = await fetchRemoteCatalog();
  if (c) remoteCatalogStore.set(c);
}

export function useCatalog(): Catalog {
  const remote = useStore(remoteCatalogStore);
  const customCollections = useStore(customCollectionsStore);
  const customMembers = useStore(customMembersStore);
  const localImages = useStore(bromideImagesStore);
  const deletedCollections = useStore(deletedCollectionsStore);

  useEffect(() => {
    if (!isSupabaseConfigured || hasE2EProfile() || fetchedOnce) return;
    fetchedOnce = true;
    void refreshRemoteCatalog();
  }, []);

  return useMemo(() => {
    const e2e = hasE2EProfile();
    const baseMembers =
      !e2e && remote && remote.members.length > 0 ? remote.members : seedCatalog.members;
    const baseCollections = remote
      ? e2e
        ? seedCatalog.collections
        : remote.collections
      : isSupabaseConfigured && !e2e
        ? []
        : seedCatalog.collections;
    const baseImages = e2e ? {} : (remote?.images ?? {});
    return buildMergedCatalog(
      baseMembers,
      baseCollections,
      baseImages,
      customCollections,
      customMembers,
      localImages,
      deletedCollections
    );
  }, [remote, customCollections, customMembers, localImages, deletedCollections]);
}

export const catalogActions = {
  async upsertCollection(collection: Collection) {
    deletedCollectionsStore.update((list) => list.filter((d) => d !== collection.id));
    customCollectionsStore.update((list) => [
      ...list.filter((c) => c.id !== collection.id),
      collection
    ]);
    if (hasE2EProfile()) return;
    if (!isSupabaseConfigured) return;
    try {
      await upsertCollectionRemote(collection);
      await refreshRemoteCatalog();
      customCollectionsStore.update((list) => list.filter((c) => c.id !== collection.id));
    } catch (e) {
      console.error('collections upsert failed', e);
    }
  },
  async deleteCollection(id: string) {
    customCollectionsStore.update((list) => list.filter((c) => c.id !== id));
    deletedCollectionsStore.update((list) => (list.includes(id) ? list : [...list, id]));
    if (hasE2EProfile()) return;
    if (!isSupabaseConfigured) return;
    try {
      await deleteCollectionRemote(id);
      await refreshRemoteCatalog();
    } catch (e) {
      console.error('collections delete failed', e);
    }
  },
  async upsertMember(member: Member) {
    customMembersStore.update((list) => [...list.filter((m) => m.id !== member.id), member]);
    if (hasE2EProfile()) return;
    if (!isSupabaseConfigured) return;
    try {
      await upsertMemberRemote(member);
      await refreshRemoteCatalog();
      customMembersStore.update((list) => list.filter((m) => m.id !== member.id));
    } catch (e) {
      console.error('members upsert failed', e);
    }
  },
  async setBromideImage(bromideId: string, imageUrl: string | null) {
    if (hasE2EProfile()) {
      bromideImagesStore.update((images) => {
        const next = { ...images };
        if (imageUrl) next[bromideId] = imageUrl;
        else delete next[bromideId];
        return next;
      });
      return true;
    }
    if (!isSupabaseConfigured) return false;
    try {
      await setBromideImageRemote(bromideId, imageUrl);
      await refreshRemoteCatalog();
      return true;
    } catch (e) {
      console.error('bromide image set failed', e);
      return false;
    }
  }
};
