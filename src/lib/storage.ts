import { getSupabase } from '~/lib/supabase';

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

export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error ?? new Error('read failed'));
    reader.readAsDataURL(blob);
  });
}

export async function uploadBromideImage(
  file: File,
  bromideId: string
): Promise<{ url: string; mode: 'cloud' | 'local' }> {
  const blob = await prepareImageBlob(file);
  const sb = getSupabase();

  if (sb) {
    try {
      const {
        data: { session }
      } = await sb.auth.getSession();
      if (session) {
        const path = `${bromideId}/${Date.now()}.jpg`;
        const { error } = await sb.storage
          .from('bromides')
          .upload(path, blob, { upsert: true, contentType: 'image/jpeg' });
        if (!error) {
          const {
            data: { publicUrl }
          } = sb.storage.from('bromides').getPublicUrl(path);
          if (publicUrl) return { url: publicUrl, mode: 'cloud' };
        }
      }
    } catch {
      /* fall through to local */
    }
  }

  const url = await blobToDataUrl(blob);
  return { url, mode: 'local' };
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
