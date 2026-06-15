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
  remoteCatalogStore,
  useStore
} from '~/data/store';
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
  localImages: Record<string, string>
): Catalog {
  const members = mergeById(baseMembers, customMembers).sort((a, b) => a.order - b.order);
  const collections = mergeById(baseCollections, customCollections).sort((a, b) =>
    (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')
  );
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

  useEffect(() => {
    if (!isSupabaseConfigured || fetchedOnce) return;
    fetchedOnce = true;
    void refreshRemoteCatalog();
  }, []);

  return useMemo(() => {
    const baseMembers = remote && remote.members.length > 0 ? remote.members : seedCatalog.members;
    const baseCollections = remote
      ? remote.collections
      : isSupabaseConfigured
        ? []
        : seedCatalog.collections;
    const baseImages = remote?.images ?? {};
    return buildMergedCatalog(
      baseMembers,
      baseCollections,
      baseImages,
      customCollections,
      customMembers,
      localImages
    );
  }, [remote, customCollections, customMembers, localImages]);
}

export const catalogActions = {
  async upsertCollection(collection: Collection) {
    customCollectionsStore.update((list) => [
      ...list.filter((c) => c.id !== collection.id),
      collection
    ]);
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
    bromideImagesStore.update((images) => {
      const next = { ...images };
      if (imageUrl) next[bromideId] = imageUrl;
      else delete next[bromideId];
      return next;
    });
    if (!isSupabaseConfigured) return;
    try {
      await setBromideImageRemote(bromideId, imageUrl);
      await refreshRemoteCatalog();
      bromideImagesStore.update((images) => {
        const next = { ...images };
        delete next[bromideId];
        return next;
      });
    } catch (e) {
      console.error('bromide image set failed', e);
    }
  }
};
