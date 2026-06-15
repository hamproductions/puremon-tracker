const OPENCV_SRC = 'https://docs.opencv.org/4.x/opencv.js';
const LOAD_TIMEOUT_MS = 15000;
const MAX_WORK_SIZE = 1600;
const MIN_AREA_RATIO = 0.2;

interface CancelToken {
  cancelled: boolean;
}

interface Corner {
  x: number;
  y: number;
}

let cvPromise: Promise<unknown> | null = null;

function getCv(): unknown {
  return (window as unknown as { cv?: unknown }).cv;
}

function isRuntimeReady(cv: unknown): boolean {
  return Boolean(cv && typeof (cv as { Mat?: unknown }).Mat === 'function');
}

export function loadOpenCv(): Promise<unknown> {
  if (cvPromise) return cvPromise;

  cvPromise = new Promise<unknown>((resolve, reject) => {
    if (typeof window === 'undefined' || typeof document === 'undefined') {
      reject(new Error('opencv unavailable in this environment'));
      return;
    }

    if (isRuntimeReady(getCv())) {
      resolve(getCv());
      return;
    }

    let settled = false;

    const finish = (action: () => void) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timer);
      action();
    };

    const timer = window.setTimeout(() => {
      finish(() => reject(new Error('opencv load timed out')));
    }, LOAD_TIMEOUT_MS);

    const waitForRuntime = () => {
      const cv = getCv();
      if (isRuntimeReady(cv)) {
        finish(() => resolve(cv));
        return;
      }
      (cv as { onRuntimeInitialized?: () => void }).onRuntimeInitialized = () => {
        finish(() => resolve(getCv()));
      };
    };

    const existing = document.querySelector<HTMLScriptElement>('script[data-opencv]');
    if (existing) {
      if (isRuntimeReady(getCv())) {
        finish(() => resolve(getCv()));
      } else {
        existing.addEventListener('load', waitForRuntime, { once: true });
        existing.addEventListener('error', () =>
          finish(() => reject(new Error('opencv script failed')))
        );
        waitForRuntime();
      }
      return;
    }

    const script = document.createElement('script');
    script.src = OPENCV_SRC;
    script.async = true;
    script.dataset.opencv = 'true';
    script.onload = waitForRuntime;
    script.onerror = () => finish(() => reject(new Error('opencv script failed')));
    document.head.appendChild(script);
  });

  cvPromise.catch(() => {
    cvPromise = null;
  });

  return cvPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image decode failed'));
    img.src = src;
  });
}

function distance(a: Corner, b: Corner): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function orderCorners(cv: any, contour: any): Corner[] {
  const rect = cv.minAreaRect(contour);
  const center = rect.center as Corner;

  let topLeft: Corner | null = null;
  let topRight: Corner | null = null;
  let bottomLeft: Corner | null = null;
  let bottomRight: Corner | null = null;
  let tld = 0;
  let trd = 0;
  let bld = 0;
  let brd = 0;

  const data = contour.data32S as Int32Array;
  for (let i = 0; i < data.length; i += 2) {
    const point: Corner = { x: data[i], y: data[i + 1] };
    const d = distance(point, center);
    if (point.x < center.x && point.y < center.y) {
      if (d > tld) {
        topLeft = point;
        tld = d;
      }
    } else if (point.x > center.x && point.y < center.y) {
      if (d > trd) {
        topRight = point;
        trd = d;
      }
    } else if (point.x < center.x && point.y > center.y) {
      if (d > bld) {
        bottomLeft = point;
        bld = d;
      }
    } else if (point.x > center.x && point.y > center.y) {
      if (d > brd) {
        bottomRight = point;
        brd = d;
      }
    }
  }

  if (!topLeft || !topRight || !bottomLeft || !bottomRight) return [];
  return [topLeft, topRight, bottomRight, bottomLeft];
}

function findLargestQuad(cv: any, source: HTMLCanvasElement): Corner[] | null {
  const mats: any[] = [];
  const track = <T>(mat: T): T => {
    mats.push(mat);
    return mat;
  };

  try {
    const img = track(cv.imread(source));
    const gray = track(new cv.Mat());
    cv.cvtColor(img, gray, cv.COLOR_RGBA2GRAY);

    const blur = track(new cv.Mat());
    cv.GaussianBlur(gray, blur, new cv.Size(3, 3), 0, 0, cv.BORDER_DEFAULT);

    const thresh = track(new cv.Mat());
    cv.threshold(blur, thresh, 0, 255, cv.THRESH_OTSU);

    const contours = track(new cv.MatVector());
    const hierarchy = track(new cv.Mat());
    cv.findContours(thresh, contours, hierarchy, cv.RETR_CCOMP, cv.CHAIN_APPROX_SIMPLE);

    const imageArea = source.width * source.height;
    let maxArea = 0;
    let bestIndex = -1;
    for (let i = 0; i < contours.size(); i += 1) {
      const area = cv.contourArea(contours.get(i));
      if (area > maxArea) {
        maxArea = area;
        bestIndex = i;
      }
    }

    if (bestIndex < 0 || maxArea < imageArea * MIN_AREA_RATIO) return null;

    const corners = orderCorners(cv, contours.get(bestIndex));
    if (corners.length !== 4) return null;
    return corners;
  } catch {
    return null;
  } finally {
    mats.forEach((mat) => {
      try {
        mat.delete();
      } catch {
        void 0;
      }
    });
  }
}

function warpToCanvas(
  cv: any,
  source: HTMLCanvasElement,
  corners: Corner[]
): HTMLCanvasElement | null {
  const mats: any[] = [];
  const track = <T>(mat: T): T => {
    mats.push(mat);
    return mat;
  };

  try {
    const img = track(cv.imread(source));
    const width = Math.round(
      Math.max(distance(corners[0], corners[1]), distance(corners[3], corners[2]))
    );
    const height = Math.round(
      Math.max(distance(corners[0], corners[3]), distance(corners[1], corners[2]))
    );
    if (width < 8 || height < 8) return null;

    const srcTri = track(
      cv.matFromArray(4, 1, cv.CV_32FC2, [
        corners[0].x,
        corners[0].y,
        corners[1].x,
        corners[1].y,
        corners[3].x,
        corners[3].y,
        corners[2].x,
        corners[2].y
      ])
    );
    const dstTri = track(
      cv.matFromArray(4, 1, cv.CV_32FC2, [0, 0, width, 0, 0, height, width, height])
    );

    const transform = track(cv.getPerspectiveTransform(srcTri, dstTri));
    const warped = track(new cv.Mat());
    cv.warpPerspective(
      img,
      warped,
      transform,
      new cv.Size(width, height),
      cv.INTER_LINEAR,
      cv.BORDER_CONSTANT,
      new cv.Scalar()
    );

    const canvas = document.createElement('canvas');
    cv.imshow(canvas, warped);
    return canvas;
  } catch {
    return null;
  } finally {
    mats.forEach((mat) => {
      try {
        mat.delete();
      } catch {
        void 0;
      }
    });
  }
}

function toWorkCanvas(image: HTMLImageElement): HTMLCanvasElement | null {
  const longest = Math.max(image.naturalWidth, image.naturalHeight);
  const scale = longest > MAX_WORK_SIZE ? MAX_WORK_SIZE / longest : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(image, 0, 0, width, height);
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob | null> {
  return new Promise((resolve) => {
    try {
      canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.9);
    } catch {
      resolve(null);
    }
  });
}

function simpleScanCanvas(source: HTMLCanvasElement): HTMLCanvasElement | null {
  const ctx = source.getContext('2d', { willReadFrequently: true });
  if (!ctx) return null;

  const { width, height } = source;
  const data = ctx.getImageData(0, 0, width, height).data;
  let minX = width;
  let minY = height;
  let maxX = 0;
  let maxY = 0;
  let count = 0;

  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const luma = r * 0.299 + g * 0.587 + b * 0.114;
      const spread = Math.max(r, g, b) - Math.min(r, g, b);
      if (luma > 172 && spread < 72) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        count += 1;
      }
    }
  }

  const sampledArea = Math.ceil(width / 2) * Math.ceil(height / 2);
  if (count < sampledArea * MIN_AREA_RATIO || maxX <= minX || maxY <= minY) return null;

  const pad = Math.round(Math.min(width, height) * 0.01);
  const sx = Math.max(0, minX - pad);
  const sy = Math.max(0, minY - pad);
  const sw = Math.min(width - sx, maxX - minX + pad * 2);
  const sh = Math.min(height - sy, maxY - minY + pad * 2);
  if (sw < width * 0.35 || sh < height * 0.35) return null;

  const canvas = document.createElement('canvas');
  canvas.width = sw;
  canvas.height = sh;
  const out = canvas.getContext('2d');
  if (!out) return null;
  out.drawImage(source, sx, sy, sw, sh, 0, 0, sw, sh);
  return canvas;
}

export async function scanDocument(imageSrc: string, signal?: CancelToken): Promise<Blob | null> {
  try {
    if (signal?.cancelled) return null;

    const image = await loadImage(imageSrc);
    if (signal?.cancelled) return null;

    const work = toWorkCanvas(image);
    if (!work || signal?.cancelled) return null;

    const simple = simpleScanCanvas(work);
    if (simple && !signal?.cancelled) return canvasToBlob(simple);

    const cv = (await loadOpenCv()) as any;
    if (signal?.cancelled || !isRuntimeReady(cv)) return null;

    const corners = findLargestQuad(cv, work);
    if (!corners || signal?.cancelled) return null;

    const warped = warpToCanvas(cv, work, corners);
    if (!warped || signal?.cancelled) return null;

    const blob = await canvasToBlob(warped);
    if (signal?.cancelled) return null;
    return blob;
  } catch {
    return null;
  }
}
