import { Platform } from 'react-native';

export type OcrResult =
  | { ok: true;  text: string }
  | { ok: false; reason: 'unsupported' | 'not_linked' | 'error'; message: string };

/**
 * Runs OCR on a local image URI using Google ML Kit (on-device, free).
 * Requires an Expo Development Build — does NOT work in Expo Go.
 *
 * Web: not supported (ML Kit is native-only).
 */
export async function recognizeText(uri: string): Promise<OcrResult> {
  if (Platform.OS === 'web') {
    return {
      ok: false,
      reason: 'unsupported',
      message:
        'Bilderkennung ist nur in der nativen App verfügbar (Android/iOS).\n' +
        'Erstelle einen Expo Development Build:\n\nnpx expo run:android\nnpx expo run:ios',
    };
  }
  return runMlKit(uri);
}

async function runMlKit(uri: string): Promise<OcrResult> {
  try {
    // Dynamic require keeps Metro from bundling native code into web builds
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const TextRecognition = require('@react-native-ml-kit/text-recognition').default;
    const result = await TextRecognition.recognize(uri);

    const text = extractOrderedText(result);
    return { ok: true, text };
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
 * Reconstructs reading order from ML Kit's block/line structure.
 *
 * ML Kit returns TextBlocks with frame (top/left/width/height).
 * We sort blocks top-to-bottom, then left-to-right within the same
 * horizontal band. This correctly orders table cells that OCR might
 * otherwise interleave.
 */
function extractOrderedText(result: any): string {
  const blocks: any[] = result?.blocks ?? [];

  if (blocks.length === 0) return result?.text ?? '';

  // Group blocks into horizontal bands (rows).
  // Two blocks are in the same row if their vertical centres overlap within a tolerance.
  const withCenter = blocks.map((b) => ({
    b,
    cy: (b.frame?.top ?? 0) + (b.frame?.height ?? 0) / 2,
    left: b.frame?.left ?? 0,
  }));

  withCenter.sort((a, b) => a.cy - b.cy);

  const rows: (typeof withCenter)[] = [];
  const ROW_TOLERANCE = 24; // px — blocks within 24px vertically → same row

  for (const item of withCenter) {
    const lastRow = rows[rows.length - 1];
    const lastCy = lastRow
      ? lastRow.reduce((s, x) => s + x.cy, 0) / lastRow.length
      : -Infinity;

    if (Math.abs(item.cy - lastCy) <= ROW_TOLERANCE) {
      lastRow.push(item);
    } else {
      rows.push([item]);
    }
  }

  // Within each row, sort left-to-right
  for (const row of rows) {
    row.sort((a, b) => a.left - b.left);
  }

  // Join: blocks in the same row separated by tab, rows by newline
  return rows
    .map((row) => row.map((x) => x.b.text.trim()).filter(Boolean).join('\t'))
    .filter(Boolean)
    .join('\n');
}
