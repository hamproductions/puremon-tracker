import type { Area } from 'react-easy-crop';

const OPENCV_SRC = 'https://docs.opencv.org/4.x/opencv.js';
const JSCANIFY_SRC = 'https://cdn.jsdelivr.net/npm/jscanify@1.4.2/src/jscanify.min.js';

type Corner = { x: number; y: number } | undefined;
interface JscanifyInstance {
  findPaperContour: (img: unknown) => unknown;
  getCornerPoints: (
    contour: unknown,
    img?: unknown
  ) => {
    topLeftCorner: Corner;
    topRightCorner: Corner;
    bottomLeftCorner: Corner;
    bottomRightCorner: Corner;
  };
}

interface OpenCv {
  imread: (el: HTMLCanvasElement | HTMLImageElement) => { delete: () => void };
}

declare global {
  interface Window {
    cv?: OpenCv & { onRuntimeInitialized?: () => void };
    jscanify?: new () => JscanifyInstance;
  }
}

let scriptCache: Record<string, Promise<void>> = {};

function loadScript(src: string): Promise<void> {
  const cached = scriptCache[src];
  if (cached) return cached;
  const p = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>(`script[src="${src}"]`);
    if (existing) {
      if (existing.dataset.loaded === '1') return resolve();
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('script error')));
      return;
    }
    const s = document.createElement('script');
    s.src = src;
    s.async = true;
    s.addEventListener('load', () => {
      s.dataset.loaded = '1';
      resolve();
    });
    s.addEventListener('error', () => reject(new Error('script error')));
    document.head.appendChild(s);
  });
  scriptCache[src] = p;
  return p;
}

function waitForOpenCvRuntime(timeoutMs = 12000): Promise<OpenCv> {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const poll = () => {
      const cv = window.cv;
      if (cv && typeof cv.imread === 'function') return resolve(cv);
      if (Date.now() - start > timeoutMs) return reject(new Error('opencv timeout'));
      setTimeout(poll, 120);
    };
    poll();
  });
}

let ready: Promise<{ cv: OpenCv; scanner: JscanifyInstance }> | null = null;

async function ensureReady() {
  if (ready) return ready;
  ready = (async () => {
    await loadScript(OPENCV_SRC);
    const cv = await waitForOpenCvRuntime();
    await loadScript(JSCANIFY_SRC);
    if (!window.jscanify) throw new Error('jscanify missing');
    return { cv, scanner: new window.jscanify() };
  })();
  try {
    return await ready;
  } catch (e) {
    ready = null;
    throw e;
  }
}

function loadImageEl(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = src;
  });
}

function clampBox(area: Area, w: number, h: number): Area {
  const cw = Math.min(area.width, w);
  const ch = Math.min(area.height, h);
  const x = Math.min(Math.max(0, area.x), w - cw);
  const y = Math.min(Math.max(0, area.y), h - ch);
  return { x, y, width: cw, height: ch };
}

function fitAspect(box: Area, aspect: number, w: number, h: number): Area {
  const cx = box.x + box.width / 2;
  const cy = box.y + box.height / 2;
  let width = box.width;
  let height = width / aspect;
  if (height < box.height) {
    height = box.height;
    width = height * aspect;
  }
  return clampBox({ x: cx - width / 2, y: cy - height / 2, width, height }, w, h);
}

export async function detectCropArea(imageSrc: string, aspect: number): Promise<Area | null> {
  if (typeof window === 'undefined') return null;
  let cvMat: { delete: () => void } | null = null;
  try {
    const { cv, scanner } = await ensureReady();
    const img = await loadImageEl(imageSrc);
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);

    cvMat = cv.imread(canvas);
    const contour = scanner.findPaperContour(cvMat);
    if (!contour) return null;
    const corners = scanner.getCornerPoints(contour);
    const pts = [
      corners.topLeftCorner,
      corners.topRightCorner,
      corners.bottomLeftCorner,
      corners.bottomRightCorner
    ].filter((p): p is { x: number; y: number } => Boolean(p));
    if (pts.length < 4) return null;

    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const boxW = maxX - minX;
    const boxH = maxY - minY;
    if (boxW < 24 || boxH < 24) return null;
    if (boxW > canvas.width * 0.985 && boxH > canvas.height * 0.985) return null;

    return fitAspect(
      { x: minX, y: minY, width: boxW, height: boxH },
      aspect,
      canvas.width,
      canvas.height
    );
  } catch {
    return null;
  } finally {
    if (cvMat) {
      try {
        cvMat.delete();
      } catch {
        /* noop */
      }
    }
  }
}
