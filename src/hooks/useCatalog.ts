import { useMemo } from 'react';
import { buildBromides, seedCatalog } from '~/data/catalog';
import {
  bromideImagesStore,
  customCollectionsStore,
  customMembersStore,
  useStore
} from '~/data/store';
import type { Catalog, Collection, Member } from '~/types';

function mergeById<T extends { id: string }>(base: T[], extra: T[]): T[] {
  const map = new Map(base.map((x) => [x.id, x]));
  for (const e of extra) map.set(e.id, { ...map.get(e.id), ...e });
  return [...map.values()];
}

export function buildMergedCatalog(
  customCollections: Collection[],
  customMembers: Member[],
  images: Record<string, string>
): Catalog {
  const members = mergeById(seedCatalog.members, customMembers).sort((a, b) => a.order - b.order);
  const collections = mergeById(seedCatalog.collections, customCollections).sort((a, b) =>
    (b.releaseDate ?? '').localeCompare(a.releaseDate ?? '')
  );
  const bromides = collections
    .flatMap(buildBromides)
    .map((b) => (images[b.id] ? { ...b, imageUrl: images[b.id] } : b));
  return { group: seedCatalog.group, members, collections, bromides };
}

export function useCatalog(): Catalog {
  const customCollections = useStore(customCollectionsStore);
  const customMembers = useStore(customMembersStore);
  const images = useStore(bromideImagesStore);
  return useMemo(
    () => buildMergedCatalog(customCollections, customMembers, images),
    [customCollections, customMembers, images]
  );
}

export const catalogActions = {
  upsertCollection(collection: Collection) {
    customCollectionsStore.update((list) => {
      const rest = list.filter((c) => c.id !== collection.id);
      return [...rest, collection];
    });
  },
  deleteCollection(id: string) {
    customCollectionsStore.update((list) => list.filter((c) => c.id !== id));
  },
  upsertMember(member: Member) {
    customMembersStore.update((list) => {
      const rest = list.filter((m) => m.id !== member.id);
      return [...rest, member];
    });
  },
  setBromideImage(bromideId: string, imageUrl: string | null) {
    bromideImagesStore.update((images) => {
      const next = { ...images };
      if (imageUrl) next[bromideId] = imageUrl;
      else delete next[bromideId];
      return next;
    });
  }
};
