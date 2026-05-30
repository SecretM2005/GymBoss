import { Platform } from 'react-native';

export type OcrResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'unsupported' | 'not_linked' | 'error'; message: string };

/**
 * Runs OCR on a local image URI.
 *
 * Web    → Tesseract.js (WASM, runs in browser, ~15 MB first load)
 * Native → Google ML Kit (on-device, free, requires Expo Dev Build)
 */
export async function recognizeText(
  uri: string,
  onProgress?: (percent: number) => void,
): Promise<OcrResult> {
  if (Platform.OS === 'web') {
    return runTesseract(uri, onProgress ?? (() => {}));
  } else {
    return runMlKit(uri);
  }
}

async function runTesseract(
  uri: string,
  onProgress: (p: number) => void,
): Promise<OcrResult> {
  try {
    const mod = await import('tesseract.js');
    const Tesseract = (mod.default ?? mod) as any;
    const result = await Tesseract.recognize(uri, 'deu+eng', {
      logger: (m: any) => {
        if (m.status === 'recognizing text') onProgress(Math.round(m.progress * 100));
      },
    });
    return { ok: true, text: result.data.text as string };
  } catch (e: any) {
    return { ok: false, reason: 'error', message: String(e?.message ?? e) };
  }
}

async function runMlKit(uri: string): Promise<OcrResult> {
  try {
    // Dynamic require so Metro doesn't bundle this on web
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
    const result = await TextRecognition.recognize(uri);
    return { ok: true, text: result.text as string };
  } catch (e: any) {
    const msg = String(e?.message ?? e);
    // ML Kit native module throws this specific error when not linked
    if (msg.includes("doesn't seem to be linked") || msg.includes('not linked')) {
      return {
        ok: false,
        reason: 'not_linked',
        message:
          'Google ML Kit ist noch nicht verknüpft. Erstelle einen Expo Development Build:\n\nnpx expo run:android\n—oder—\nnpx expo run:ios',
      };
    }
    return { ok: false, reason: 'error', message: msg };
  }
}
