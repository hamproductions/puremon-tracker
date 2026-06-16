import type { Bromide } from '~/types';

export function uploadTargetsForMode(
  targets: Bromide[],
  { adminEdit }: { adminEdit: boolean }
): Bromide[] {
  return adminEdit ? targets : targets.filter((b) => !b.imageUrl);
}
