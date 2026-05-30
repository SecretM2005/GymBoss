import { Platform } from 'react-native';

export type OcrResult =
  | { ok: true;  text: string }
  | { ok: false; reason: 'unsupported' | 'not_linked' | 'error'; message: string };

/**
 * Runs OCR on a local image URI.
 *
 * Web    → Tesseract.js with canvas preprocessing (grayscale, contrast, 2× upscale)
 * Native → Google ML Kit (on-device, free, requires Expo Dev Build)
 */
export async function recognizeText(
  uri: string,
  onProgress?: (percent: number) => void,
): Promise<OcrResult> {
  if (Platform.OS === 'web') {
    return runTesseract(uri, onProgress ?? (() => {}));
  }
  return runMlKit(uri);
}

// ─── Web: Tesseract.js with image preprocessing ────────────────────────────────

async function runTesseract(
  uri: string,
  onProgress: (p: number) => void,
): Promise<OcrResult> {
  try {
    const enhanced = await preprocessImageWeb(uri);

    const mod = await import('tesseract.js');
    const Tesseract = (mod.default ?? mod) as any;

    const result = await Tesseract.recognize(
      enhanced,
      'deu+eng',
      {
        logger: (m: any) => {
          if (m.status === 'recognizing text') {
            onProgress(Math.round(m.progress * 100));
          }
        },
      },
    );

    return { ok: true, text: result.data.text as string };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: String(e?.message ?? e) };
  }
}

/**
 * Preprocesses the image in a Canvas for better OCR results:
 * - 2× upscale  (more pixels → better letter recognition)
 * - Grayscale   (removes color noise)
 * - Contrast +  (makes text sharper against background)
 * - Sharpen via unsharp mask (convolution kernel)
 */
async function preprocessImageWeb(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new (window as any).Image() as HTMLImageElement;
    img.crossOrigin = 'anonymous';

    img.onerror = () => resolve(uri); // fallback to original if loading fails

    img.onload = () => {
      try {
        const SCALE = 2;
        const w = img.naturalWidth  * SCALE;
        const h = img.naturalHeight * SCALE;

        // ── Step 1: upscale + grayscale + contrast ──────────────────────────
        const c1 = document.createElement('canvas');
        c1.width  = w;
        c1.height = h;
        const ctx1 = c1.getContext('2d')!;
        // CSS filter: grayscale, then boost contrast and brightness slightly
        ctx1.filter = 'grayscale(100%) contrast(1.9) brightness(1.05)';
        ctx1.drawImage(img, 0, 0, w, h);
        ctx1.filter = 'none';

        // ── Step 2: unsharp mask to sharpen text edges ──────────────────────
        const c2 = document.createElement('canvas');
        c2.width  = w;
        c2.height = h;
        const ctx2 = c2.getContext('2d')!;

        const imageData = ctx1.getImageData(0, 0, w, h);
        const sharpened = unsharpMask(imageData, w, h);
        ctx2.putImageData(sharpened, 0, 0);

        resolve(c2.toDataURL('image/png', 1.0));
      } catch {
        resolve(uri); // fallback
      }
    };

    img.src = uri;
  });
}

/**
 * Simple unsharp mask: blurs a copy of the image, then subtracts
 * the blur from the original to amplify edges (makes text crisper).
 */
function unsharpMask(data: ImageData, w: number, h: number): ImageData {
  const src    = data.data;
  const output = new ImageData(w, h);
  const dst    = output.data;

  // 3×3 box blur kernel on grayscale (R=G=B for grayscale image)
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++) {
        for (let kx = -1; kx <= 1; kx++) {
          const idx = ((y + ky) * w + (x + kx)) * 4;
          sum += src[idx]; // R channel (same as G and B for grayscale)
        }
      }
      const blurred = sum / 9;
      const i       = (y * w + x) * 4;
      const sharp   = src[i] + 1.5 * (src[i] - blurred); // unsharp mask formula
      const clamped = Math.max(0, Math.min(255, sharp));

      dst[i] = dst[i + 1] = dst[i + 2] = clamped;
      dst[i + 3] = 255;
    }
  }

  return output;
}

// ─── Native: Google ML Kit ─────────────────────────────────────────────────────

async function runMlKit(uri: string): Promise<OcrResult> {
  try {
    // Dynamic require keeps Metro from bundling native code into web builds
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
    const result = await TextRecognition.recognize(uri);
    return { ok: true, text: extractOrderedText(result) };
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    if (msg.includes("doesn't seem to be linked") || msg.includes('not linked')) {
      return {
        ok: false,
        reason: 'not_linked',
        message:
          'Google ML Kit ist noch nicht verknüpft.\n' +
          'Erstelle einen Expo Development Build:\n\n' +
          'npx expo run:android\n—oder—\nnpx expo run:ios',
      };
    }
    return { ok: false, reason: 'error', message: msg };
  }
}

/**
 * Reconstructs correct reading order from ML Kit block positions.
 * Sorts blocks into horizontal bands (rows) by Y centre, then left-to-right.
 * Outputs tab-separated columns per row so the parser can split them correctly.
 */
function extractOrderedText(result: any): string {
  const blocks: any[] = result?.blocks ?? [];
  if (blocks.length === 0) return result?.text ?? '';

  const withCenter = blocks.map((b: any) => ({
    b,
    cy:   (b.frame?.top  ?? 0) + (b.frame?.height ?? 0) / 2,
    left:  b.frame?.left ?? 0,
  }));

  withCenter.sort((a, b) => a.cy - b.cy);

  const ROW_TOLERANCE = 24;
  const rows: (typeof withCenter)[] = [];

  for (const item of withCenter) {
    const lastRow = rows[rows.length - 1];
    const lastCy  = lastRow
      ? lastRow.reduce((s, x) => s + x.cy, 0) / lastRow.length
      : -Infinity;

    if (Math.abs(item.cy - lastCy) <= ROW_TOLERANCE) {
      lastRow.push(item);
    } else {
      rows.push([item]);
    }
  }

  for (const row of rows) row.sort((a, b) => a.left - b.left);

  return rows
    .map((row) => row.map((x) => x.b.text.trim()).filter(Boolean).join('\t'))
    .filter(Boolean)
    .join('\n');
}
