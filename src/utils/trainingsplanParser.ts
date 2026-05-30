/**
 * Extracts training plan structure from raw OCR text (German sports plans).
 */

import { UebungParam } from '../types';

export type ParsedEinheit = {
  name: string;
  uebungen: ParsedUebung[];
};

export type ParsedUebung = {
  name: string;
  parameter: string;        // raw display string e.g. "3x8 · 80 kg"
  params: UebungParam[];    // structured params ready for store
};

export type ParsedWoche = {
  wochennummer: number;
  einheiten: ParsedEinheit[];
};

export type ParsedPlan = {
  name?: string;
  sportart?: string;
  anzahlWochen?: number;
  wochen: ParsedWoche[];
  rawText: string;
};

const SPORTARTEN = ['Kraftsport', 'Kampfsport', 'Leichtathletik', 'Konditionierung', 'Mobility', 'Crossfit'];

const SPORTART_KEYWORDS: Record<string, string[]> = {
  Kraftsport:      ['kraft', 'bench', 'bankdruck', 'squat', 'kniebeuge', 'deadlift', 'kreuzheben', 'kg', 'gewicht', 'hantel'],
  Leichtathletik:  ['lauf', 'sprint', 'meter', 'km', 'marathon', 'jogging', 'tempo'],
  Kampfsport:      ['kampf', 'box', 'kick', 'sparring', 'judo', 'mma', 'karate'],
  Konditionierung: ['ausdauer', 'kondition', 'cardio', 'intervall', 'hiit'],
  Mobility:        ['dehnen', 'stretch', 'mobilität', 'yoga', 'beweglichkeit'],
  Crossfit:        ['crossfit', 'wod', 'amrap', 'emom', 'burpee'],
};

// ─── Parameter patterns ────────────────────────────────────────────────────────

// "3x8", "3 x 8", "3×8"
const SETS_REPS_X  = /(\d+)\s*[×xX]\s*(\d+)/;
// "3 Sätze" or "3 sets"
const SAETZE_KW    = /\b(\d)\s*(?:sätze|satz|sets?)\b/i;
// "8 Wdh" or "10 Wiederholungen" or "8 reps"
const WDH_KW       = /\b(\d{1,2})\s*(?:wdh|wh|wiederholungen?|reps?|mal)\b/i;
// Two standalone short numbers close together → treat as Sätze + Wdh
// First must be 1–8 (typical set count), second up to 2 digits
const SAETZE_WDH   = /\b([1-8])\s{1,4}(\d{1,2})\b/;

const WEIGHT       = /(\d+(?:[,.]\d+)?)\s*kg/i;
// "s" only when not followed by a letter (avoids matching "Sätze", "Satz", "sets")
const DURATION     = /(\d+)\s*(min(?:uten?)?|sek(?:unden?)?|s(?![a-zäöüA-ZÄÖÜ])|h)\b/i;
const DISTANCE     = /(\d+(?:[,.]\d+)?)\s*(km|m)\b/i;

// ─── Structural patterns ───────────────────────────────────────────────────────

const HEADING_RE   = /^(woche|week|tag|day|einheit|training|session|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|übung|exercise|sätze|wdh|gewicht|sets?|reps?)/i;
const NOISE_RE     = /^[\d\s\-—|•·,.:;#*]+$/; // lines that are pure separators/numbers

export function parseTrainingText(text: string): ParsedPlan {
  const lower = text.toLowerCase();
  const lines  = text.split('\n').map((l) => l.trim());

  // ── Plan name ──────────────────────────────────────────────────────────────
  const nameLine = lines.find((l) =>
    l.length > 3 &&
    !NOISE_RE.test(l) &&
    !/^\d+$/.test(l) &&
    !/^(woche|week|tag|day|einheit)/i.test(l)
  );

  // ── Sportart ───────────────────────────────────────────────────────────────
  let sportart: string | undefined;
  let maxScore = 0;
  for (const [art, keywords] of Object.entries(SPORTART_KEYWORDS)) {
    const score = keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0);
    if (score > maxScore) { maxScore = score; sportart = art; }
  }
  const directMatch = SPORTARTEN.find((s) => lower.includes(s.toLowerCase()));
  if (directMatch) sportart = directMatch;

  // ── Wochen count ───────────────────────────────────────────────────────────
  const wochenPhrase  = lower.match(/(\d+)\s*wochen/);
  const wocheHeads    = [...lower.matchAll(/woche\s*\.?\s*(\d+)/g)];
  const maxWocheNum   = wocheHeads.length
    ? Math.max(...wocheHeads.map((m) => parseInt(m[1])))
    : 0;
  const wochentageCount = (lower.match(/\b(montag|dienstag|mittwoch|donnerstag|freitag)\b/g) ?? []).length;

  const anzahlWochen =
    maxWocheNum > 0      ? maxWocheNum :
    wochenPhrase         ? parseInt(wochenPhrase[1]) :
    wochentageCount >= 3 ? Math.ceil(wochentageCount / 3) :
    undefined;

  const wochen = buildWochenStructure(text, lower, anzahlWochen ?? 1);

  return {
    name:         nameLine,
    sportart:     maxScore > 0 || directMatch ? sportart : undefined,
    anzahlWochen: anzahlWochen,
    wochen,
    rawText: text,
  };
}

// ─── Week / Session structure ──────────────────────────────────────────────────

function buildWochenStructure(text: string, lower: string, fallbackWochen: number): ParsedWoche[] {
  const wochen: ParsedWoche[] = [];

  const wocheSegments = splitByPattern(text, /(?:woche|week)\s*\.?\s*(\d+)/gi);

  if (wocheSegments.length > 0) {
    for (const seg of wocheSegments) {
      wochen.push({ wochennummer: parseInt(seg.label), einheiten: extractEinheiten(seg.content) });
    }
  } else {
    // No explicit week headings — put all exercises into week 1,
    // create remaining empty weeks up to fallbackWochen.
    const allEinheiten = extractEinheiten(text);
    const numWeeks = Math.max(1, fallbackWochen);
    for (let i = 1; i <= numWeeks; i++) {
      wochen.push({ wochennummer: i, einheiten: i === 1 ? allEinheiten : [] });
    }
  }

  return wochen;
}

function extractEinheiten(text: string): ParsedEinheit[] {
  const einheiten: ParsedEinheit[] = [];

  const daySegs = splitByPattern(text, /(?:tag|einheit|training|session)\s*\.?\s*(\d+|[A-D])/gi);
  const tagSegs = splitByDayName(text);
  const segs    = daySegs.length > 0 ? daySegs
                : tagSegs.length > 0 ? tagSegs
                : [{ label: '1', content: text }];

  for (const seg of segs) {
    const uebungen = extractUebungen(seg.content);
    if (uebungen.length > 0) {
      const label = /^\d+$/.test(seg.label) ? `Einheit ${seg.label}` : seg.label;
      einheiten.push({ name: label, uebungen });
    }
  }

  if (einheiten.length === 0) {
    const uebungen = extractUebungen(text);
    if (uebungen.length > 0) einheiten.push({ name: 'Trainingseinheit', uebungen });
  }

  return einheiten;
}

// ─── Exercise extraction ───────────────────────────────────────────────────────

/** Strip OCR noise chars and normalize whitespace for pattern matching. */
function normalizeLine(raw: string): string {
  return raw
    .replace(/[|]/g, ' ')   // pipe-separated table columns → space
    .replace(/\s+/g, ' ')   // collapse whitespace
    .trim();
}

function extractUebungen(text: string): ParsedUebung[] {
  const uebungen: ParsedUebung[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);

  for (const raw of lines) {
    if (HEADING_RE.test(raw)) continue;
    if (NOISE_RE.test(raw))   continue;

    const line  = normalizeLine(raw);
    const param = extractParam(line);
    if (!param) continue;

    // Exercise name: everything before the first digit block
    // Also strip common OCR noise: leading numbers, bullets
    const cleaned  = line.replace(/^[\d\s\-—•·.]+/, '');
    const namePart = cleaned
      .replace(/\d+(?:[,.]\d+)?\s*(?:kg|min|sek|s|h|km|m\b|wdh|wh|reps?|sätze?|sets?)?.*$/i, '')
      .replace(/[|]+/g, '')
      .trim();

    if (namePart.length < 2) continue;
    // Skip if the "name" is just a number
    if (/^\d+$/.test(namePart)) continue;

    uebungen.push({
      name:      titleCase(namePart),
      parameter: param,
      params:    paramStringToUebungParams(param),
    });
  }

  return uebungen;
}

function extractParam(line: string): string | null {
  const parts: string[] = [];
  let foundSets = false;

  // Priority 1: explicit "NxM" notation
  const srX = line.match(SETS_REPS_X);
  if (srX) {
    parts.push(`${srX[1]}x${srX[2]}`);
    foundSets = true;
  }

  // Priority 2: keyword-based "N Sätze" / "N Wdh"
  if (!foundSets) {
    const saetzeKw = line.match(SAETZE_KW);
    const wdhKw    = line.match(WDH_KW);
    if (saetzeKw && wdhKw) {
      parts.push(`${saetzeKw[1]}x${wdhKw[1]}`);
      foundSets = true;
    } else if (saetzeKw) {
      parts.push(`${saetzeKw[1]} Sätze`);
      foundSets = true;
    } else if (wdhKw) {
      parts.push(`${wdhKw[1]} Wdh`);
    }
  }

  // Priority 3: two adjacent short numbers (table OCR: "3  8")
  if (!foundSets) {
    const twoNums = line.match(SAETZE_WDH);
    if (twoNums) {
      parts.push(`${twoNums[1]}x${twoNums[2]}`);
      foundSets = true;
    }
  }

  const wt  = line.match(WEIGHT);
  if (wt)  parts.push(`${wt[1].replace(',', '.')} kg`);

  const dur = line.match(DURATION);
  const durUnit = dur ? normalizeDurUnit(dur[2]) : null;
  if (dur) parts.push(`${dur[1]} ${durUnit}`);

  const dist = line.match(DISTANCE);
  if (!dur && dist) parts.push(`${dist[1].replace(',', '.')} ${dist[2].toLowerCase()}`);

  return parts.length ? parts.join(' · ') : null;
}

function normalizeDurUnit(raw: string): string {
  const l = raw.toLowerCase();
  if (l.startsWith('min')) return 'min';
  if (l.startsWith('sek') || l === 's') return 'sek';
  if (l === 'h') return 'h';
  return l;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

type Segment = { label: string; content: string };

function splitByPattern(text: string, re: RegExp): Segment[] {
  const results: Segment[] = [];
  const matches = [...text.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const start = (matches[i].index ?? 0) + matches[i][0].length;
    const end   = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
    results.push({ label: matches[i][1], content: text.slice(start, end) });
  }
  return results;
}

function splitByDayName(text: string): Segment[] {
  const DAYS = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag','sonntag'];
  const re   = new RegExp(`(${DAYS.join('|')})`, 'gi');
  const segs = splitByPattern(text, re);
  return segs.map((s, i) => ({ ...s, label: String(i + 1) }));
}

/** Converts a raw param string like "3x8 · 80 kg" into structured UebungParam[]. */
export function paramStringToUebungParams(raw: string): UebungParam[] {
  const params: UebungParam[] = [];

  const srX = raw.match(/(\d+)\s*[×xX]\s*(\d+)/);
  if (srX) {
    params.push({ typ: 'serien',         wert: srX[1] });
    params.push({ typ: 'wiederholungen', wert: srX[2] });
  }

  const saetzeKw = raw.match(SAETZE_KW);
  if (!srX && saetzeKw) params.push({ typ: 'serien', wert: saetzeKw[1] });

  const wdhKw = raw.match(WDH_KW);
  if (!srX && wdhKw) params.push({ typ: 'wiederholungen', wert: wdhKw[1] });

  const wt = raw.match(/(\d+(?:[,.]\d+)?)\s*kg/i);
  if (wt) params.push({ typ: 'gewicht', wert: wt[1].replace(',', '.'), einheit: 'kg' });

  const dur = raw.match(/(\d+)\s*(min(?:uten?)?|sek(?:unden?)?|s|h)\b/i);
  if (dur) params.push({ typ: 'dauer', wert: dur[1], einheit: normalizeDurUnit(dur[2]) });

  const dist = raw.match(/(\d+(?:[,.]\d+)?)\s*(km|m)\b/i);
  if (!dur && dist) params.push({ typ: 'distanz', wert: dist[1].replace(',', '.'), einheit: dist[2].toLowerCase() });

  return params;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
