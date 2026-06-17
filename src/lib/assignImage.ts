import { catalogActions } from '~/hooks/useCatalog';
import { deleteBromideImage, uploadBromideImage } from '~/lib/storage';
import { createImageSubmission, saveImageSubmission } from '~/lib/submissions';
import type { Bromide, Profile } from '~/types';

export async function assignBromideImage(
  bromide: Pick<Bromide, 'id' | 'imageUrl'>,
  file: File,
  opts: { adminEdit: boolean; profile: Profile | null }
): Promise<void> {
  const { url } = await uploadBromideImage(file, bromide.id);
  if (opts.adminEdit) {
    const saved = await catalogActions.setBromideImage(bromide.id, url);
    if (!saved) throw new Error('image registration failed');
    if (bromide.imageUrl && bromide.imageUrl !== url) await deleteBromideImage(bromide.imageUrl);
  } else {
    await saveImageSubmission(
      createImageSubmission({ bromideId: bromide.id, imageUrl: url, profile: opts.profile })
    );
  }
}
