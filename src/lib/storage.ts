import { getSupabase } from '~/lib/supabase';
import { hasE2EProfile } from '~/lib/e2eAuth';

export async function prepareImageBlob(file: File, maxSize = 1000): Promise<Blob> {
  if (typeof window === 'undefined' || typeof document === 'undefined') return file;
  try {
    const bitmap = await loadBitmap(file);
    const { width, height } = bitmap;
    const longest = Math.max(width, height);
    const scale = longest > maxSize ? maxSize / longest : 1;
    const targetW = Math.max(1, Math.round(width * scale));
    const targetH = Math.max(1, Math.round(height * scale));

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap as CanvasImageSource, 0, 0, targetW, targetH);
    close(bitmap);

    const blob = await canvasToBlob(canvas);
    return blob ?? file;
  } catch {
    return file;
  }
}

export async function uploadBromideImage(
  file: File,
  bromideId: string
): Promise<{ url: string; mode: 'cloud' }> {
  const blob = await prepareImageBlob(file);
  if (hasE2EProfile()) return { url: await blobToDataUrl(blob), mode: 'cloud' };

  const sb = getSupabase();

  if (!sb) throw new Error('supabase required');
  const {
    data: { session }
  } = await sb.auth.getSession();
  if (!session) throw new Error('login required');

  const path = `${bromideId}/${Date.now()}.jpg`;
  const { error } = await sb.storage
    .from('bromides')
    .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw error;

  const {
    data: { publicUrl }
  } = sb.storage.from('bromides').getPublicUrl(path);
  if (!publicUrl) throw new Error('public url missing');
  return { url: publicUrl, mode: 'cloud' };
}

type Bitmap = ImageBitmap | HTMLImageElement;

async function loadBitmap(file: File): Promise<Bitmap> {
  if (typeof createImageBitmap === 'function') {
    try {
      return await createImageBitmap(file);
    } catch {
      /* fall back to <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    return await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('image decode failed'));
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

function close(bitmap: Bitmap) {
  if (typeof ImageBitmap !== 'undefined' && bitmap instanceof ImageBitmap) bitmap.close();
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.82);
  });
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('image encode failed'));
    reader.readAsDataURL(blob);
  });
}
