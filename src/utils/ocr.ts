import { Platform } from 'react-native';
import { ParsedPlan, ParsedWoche, ParsedEinheit, ParsedUebung, paramStringToUebungParams } from './trainingsplanParser';

export type OcrResult =
  | { ok: true;  text: string; parsed?: ParsedPlan }
  | { ok: false; reason: 'unsupported' | 'not_linked' | 'error' | 'no_key'; message: string };

const GEMINI_KEY = process.env.EXPO_PUBLIC_GEMINI_API_KEY ?? '';

/**
 * Runs OCR / AI extraction on a local image URI.
 *
 * Web + Gemini key → Gemini 1.5 Flash (returns structured JSON directly)
 * Web without key  → Tesseract.js with canvas preprocessing
 * Native           → Google ML Kit (on-device, free, requires Expo Dev Build)
 */
export async function recognizeText(
  uri: string,
  onProgress?: (percent: number) => void,
): Promise<OcrResult> {
  if (Platform.OS === 'web') {
    if (GEMINI_KEY) return runGemini(uri);
    return runTesseract(uri, onProgress ?? (() => {}));
  }
  return runMlKit(uri);
}

export function hasGeminiKey(): boolean {
  return Boolean(GEMINI_KEY);
}

// ─── Gemini 1.5 Flash ──────────────────────────────────────────────────────────

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

const GEMINI_PROMPT = `You are a fitness training plan extractor.
Analyze this training plan image and extract the COMPLETE structure.
Return ONLY valid JSON — no markdown fences, no explanation.

JSON schema:
{
  "name": "plan title (string)",
  "sportart": "one of: Kraftsport | Leichtathletik | Kampfsport | Konditionierung | Mobility | Crossfit | Andere",
  "anzahlWochen": <number>,
  "wochen": [
    {
      "wochennummer": <number>,
      "einheiten": [
        {
          "name": "e.g. Montag / Tuesday / Training A",
          "uebungen": [
            {
              "name": "exercise name",
              "parameter": "e.g. 3x8 80kg  or  35min  or  40 Minuten"
            }
          ]
        }
      ]
    }
  ]
}

Rules:
- Extract ALL weeks and ALL training days that have exercises.
- Skip rest days (Rest / Ruhe / Off) — leave them out entirely.
- For "parameter": use sets×reps + optional weight (e.g. "4x10 60kg"),
  or duration (e.g. "35min" / "40 Minuten" / "150-180 Minuten"),
  or distance (e.g. "5km").
- If a cell has multiple exercises, create multiple uebungen entries.
- Preserve the original language for names (German or English).`;

async function runGemini(uri: string): Promise<OcrResult> {
  try {
    const { data, mimeType } = await uriToBase64Web(uri);

    const body = {
      contents: [{
        parts: [
          { inline_data: { mime_type: mimeType, data } },
          { text: GEMINI_PROMPT },
        ],
      }],
      generationConfig: { response_mime_type: 'application/json', temperature: 0 },
    };

    const res = await fetch(`${GEMINI_URL}?key=${GEMINI_KEY}`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, reason: 'error', message: `Gemini API Fehler ${res.status}: ${err.slice(0, 200)}` };
    }

    const json = await res.json();
    const raw  = json?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const plan = parseGeminiJson(raw);

    return { ok: true, text: raw, parsed: plan };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: String(e?.message ?? e) };
  }
}

/** Convert Gemini's raw JSON string to a ParsedPlan with typed UebungParam[]. */
function parseGeminiJson(raw: string): ParsedPlan {
  try {
    // Strip possible markdown fences just in case
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const g     = JSON.parse(clean);

    const wochen: ParsedWoche[] = (g.wochen ?? []).map((w: any) => {
      const einheiten: ParsedEinheit[] = (w.einheiten ?? []).map((e: any) => {
        const uebungen: ParsedUebung[] = (e.uebungen ?? []).map((u: any) => ({
          name:      String(u.name ?? '').trim(),
          parameter: String(u.parameter ?? '').trim(),
          params:    paramStringToUebungParams(String(u.parameter ?? '')),
        }));
        return { name: String(e.name ?? 'Einheit'), uebungen };
      });
      return { wochennummer: Number(w.wochennummer ?? 1), einheiten };
    });

    return {
      name:         g.name        ? String(g.name).trim()        : undefined,
      sportart:     g.sportart    ? String(g.sportart).trim()     : undefined,
      anzahlWochen: g.anzahlWochen ? Number(g.anzahlWochen)       : wochen.length || undefined,
      wochen,
      rawText: raw,
    };
  } catch {
    return { name: undefined, sportart: undefined, anzahlWochen: undefined, wochen: [], rawText: raw };
  }
}

async function uriToBase64Web(uri: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(uri);
  const blob     = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror  = reject;
    reader.onloadend = () => {
      const result   = reader.result as string;
      const [header] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] ?? 'image/jpeg';
      resolve({ data: result.split(',')[1], mimeType });
    };
    reader.readAsDataURL(blob);
  });
}

// ─── Web fallback: Tesseract.js with canvas preprocessing ─────────────────────

async function runTesseract(
  uri: string,
  onProgress: (p: number) => void,
): Promise<OcrResult> {
  try {
    const enhanced = await preprocessImageWeb(uri);

    const mod          = await import('tesseract.js');
    const createWorker = (mod.createWorker ?? (mod.default as any)?.createWorker) as Function;

    const worker = await createWorker('deu+eng', 1, {
      logger: (m: any) => {
        if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100));
      },
    });

    // PSM 11 = sparse text: finds all text regardless of layout — best for tables & mixed plans
    await (worker as any).setParameters({
      tessedit_pageseg_mode: '11',
      preserve_interword_spaces: '1',
    });

    const result = await (worker as any).recognize(enhanced);
    await (worker as any).terminate();

    return { ok: true, text: result.data.text as string };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: String(e?.message ?? e) };
  }
}

async function preprocessImageWeb(uri: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new (window as any).Image() as HTMLImageElement;
    img.crossOrigin = 'anonymous';
    img.onerror = () => resolve(uri);
    img.onload  = () => {
      try {
        // Scale up small images more aggressively; cap so the longer side stays ≤ 3000px
        const maxSide = Math.max(img.naturalWidth, img.naturalHeight);
        const SCALE   = maxSide <= 800 ? 3 : maxSide <= 1600 ? 2 : 1;
        const w = img.naturalWidth  * SCALE;
        const h = img.naturalHeight * SCALE;

        // Pass 1: slight blur to kill camera noise, then grayscale + high contrast
        const c1   = document.createElement('canvas');
        c1.width   = w; c1.height = h;
        const ctx1 = c1.getContext('2d')!;
        ctx1.filter = 'blur(0.5px) grayscale(100%) contrast(2.2)';
        ctx1.drawImage(img, 0, 0, w, h);
        ctx1.filter = 'none';

        // Pass 2: unsharp mask to sharpen character edges
        const c2   = document.createElement('canvas');
        c2.width   = w; c2.height = h;
        const ctx2 = c2.getContext('2d')!;
        ctx2.putImageData(unsharpMask(ctx1.getImageData(0, 0, w, h), w, h), 0, 0);

        // Pass 3: Otsu binarization → clean black-on-white, maximises Tesseract accuracy
        const c3   = document.createElement('canvas');
        c3.width   = w; c3.height = h;
        const ctx3 = c3.getContext('2d')!;
        ctx3.putImageData(binarize(ctx2.getImageData(0, 0, w, h), w, h), 0, 0);

        resolve(c3.toDataURL('image/png', 1.0));
      } catch { resolve(uri); }
    };
    img.src = uri;
  });
}

function unsharpMask(data: ImageData, w: number, h: number): ImageData {
  const src = data.data;
  const out = new ImageData(w, h);
  const dst = out.data;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      let sum = 0;
      for (let ky = -1; ky <= 1; ky++)
        for (let kx = -1; kx <= 1; kx++)
          sum += src[((y + ky) * w + (x + kx)) * 4];
      const i = (y * w + x) * 4;
      const v = Math.max(0, Math.min(255, src[i] + 1.5 * (src[i] - sum / 9)));
      dst[i] = dst[i + 1] = dst[i + 2] = v;
      dst[i + 3] = 255;
    }
  }
  return out;
}

/** Otsu's method: finds the optimal global threshold that maximises between-class variance. */
function otsuThreshold(pixels: Uint8ClampedArray, n: number): number {
  const hist = new Int32Array(256);
  for (let i = 0; i < n; i++) hist[pixels[i * 4]]++;

  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0, wB = 0, maxVar = 0, threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = n - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const variance = wB * wF * (mB - mF) ** 2;
    if (variance > maxVar) { maxVar = variance; threshold = t; }
  }
  return threshold;
}

function binarize(data: ImageData, w: number, h: number): ImageData {
  const t   = otsuThreshold(data.data, w * h);
  const out = new ImageData(w, h);
  const src = data.data;
  const dst = out.data;
  for (let i = 0; i < w * h; i++) {
    const v = src[i * 4] >= t ? 255 : 0;
    dst[i * 4] = dst[i * 4 + 1] = dst[i * 4 + 2] = v;
    dst[i * 4 + 3] = 255;
  }
  return out;
}

// ─── Native: Google ML Kit ─────────────────────────────────────────────────────

async function runMlKit(uri: string): Promise<OcrResult> {
  try {
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

function extractOrderedText(result: any): string {
  const blocks: any[] = result?.blocks ?? [];
  if (blocks.length === 0) return result?.text ?? '';

  const items = blocks.map((b: any) => ({
    b,
    cy:   (b.frame?.top ?? 0) + (b.frame?.height ?? 0) / 2,
    left:  b.frame?.left ?? 0,
  }));
  items.sort((a, b) => a.cy - b.cy);

  const ROW_TOLERANCE = 24;
  const rows: (typeof items)[] = [];
  for (const item of items) {
    const last   = rows[rows.length - 1];
    const lastCy = last ? last.reduce((s, x) => s + x.cy, 0) / last.length : -Infinity;
    if (Math.abs(item.cy - lastCy) <= ROW_TOLERANCE) last.push(item);
    else rows.push([item]);
  }
  for (const row of rows) row.sort((a, b) => a.left - b.left);

  return rows
    .map((row) => row.map((x) => x.b.text.trim()).filter(Boolean).join('\t'))
    .filter(Boolean)
    .join('\n');
}
