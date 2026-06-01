/**
 * Extracts training plan structure from raw OCR text (German and English sports plans).
 * Handles both inline format ("Bankdrücken 3x8 80kg") and
 * table OCR where name and params may be on separate lines.
 */

import { UebungParam } from '../types';

export type ParsedEinheit = {
  name: string;
  uebungen: ParsedUebung[];
};

export type ParsedUebung = {
  name: string;
  parameter: string;
  params: UebungParam[];
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

// ─── Sportart detection ────────────────────────────────────────────────────────

const SPORTARTEN = ['Kraftsport', 'Kampfsport', 'Leichtathletik', 'Konditionierung', 'Mobility', 'Crossfit'];

const SPORTART_KEYWORDS: Record<string, string[]> = {
  Kraftsport:      ['kraft', 'bench', 'bankdruck', 'squat', 'kniebeuge', 'deadlift', 'kreuzheben', 'kg', 'hantel'],
  Leichtathletik:  ['lauf', 'run', 'sprint', 'marathon', 'jogging', 'tempo', 'km', 'miles'],
  Kampfsport:      ['kampf', 'box', 'kick', 'sparring', 'judo', 'mma', 'karate'],
  Konditionierung: ['ausdauer', 'kondition', 'cardio', 'intervall', 'hiit', 'conditioning', 'cross-train'],
  Mobility:        ['dehnen', 'stretch', 'mobilität', 'yoga', 'beweglichkeit', 'pilates'],
  Crossfit:        ['crossfit', 'wod', 'amrap', 'emom', 'burpee'],
};

// ─── Parameter patterns ────────────────────────────────────────────────────────

// "3x8", "3 x 8", "3×8"
const SETS_REPS_X = /(\d+)\s*[×xX]\s*(\d+)/;
// "3 Sätze" / "3 sets" / "3 Set"
const SAETZE_KW   = /\b(\d)\s*(?:sätze|satz|sets?)\b/i;
// "8 Wdh" / "8 Wiederholungen" / "8 reps"
const WDH_KW      = /\b(\d{1,2})\s*(?:wdh|wh|wiederholungen?|reps?|mal)\b/i;
// Two adjacent short numbers from table columns (Sätze + Wdh), e.g. "3  8"
const SAETZE_WDH  = /\b([1-8])\s{1,4}(\d{1,2})\b/;
// Weight
const WEIGHT      = /(\d+(?:[,.]\d+)?)\s*kg/i;
// Duration: covers "35mins", "40 min", "30 Minuten", "90s", "45sec"
// min(?:uten?|s)? handles min / mins / minute / minuten
const DURATION    = /(\d+(?:\s*[-–]\s*\d+)?)\s*(min(?:uten?|s)?|sek(?:unden?)?|secs?|seconds?|h|hours?)\b/i;
// Distance
const DISTANCE    = /(\d+(?:[,.]\d+)?)\s*(km|miles?|m)\b/i;

// ─── Structural noise filters ──────────────────────────────────────────────────

// Lines that are column headers or pure separators — skip entirely
const HEADING_RE = /^(woche|week|tag|day|einheit|training|session|montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|monday|tuesday|wednesday|thursday|friday|saturday|sunday|übung|exercise|sätze|wdh|gewicht|sets?|reps?|weight|warm.?up|cool.?down)\b/i;
const NOISE_RE   = /^[\d\s\-—|•·,.:;#*\/\\]+$/;
// Lines that are only a label like "Rest", "Ruhe", "Off" — no exercise content
const REST_RE    = /^(rest|ruhe|off|pause|erholung|regeneration|frei)$/i;

// ─── Public API ────────────────────────────────────────────────────────────────

export function parseTrainingText(rawText: string): ParsedPlan {
  // ML Kit block-ordering outputs tab-separated columns in a row.
  // Expand tabs into newlines so each cell is treated as a separate line.
  const text  = rawText.replace(/\t/g, '\n');
  const lower = text.toLowerCase();
  const lines  = text.split('\n').map((l) => l.trim());

  // Plan name: first substantial non-heading, non-noise line
  const nameLine = lines.find((l) =>
    l.length > 4 &&
    !NOISE_RE.test(l) &&
    !REST_RE.test(l) &&
    !/^\d+$/.test(l) &&
    !/^(woche|week|tag|day|einheit)/i.test(l)
  );

  // Sportart detection
  let sportart: string | undefined;
  let maxScore = 0;
  for (const [art, keywords] of Object.entries(SPORTART_KEYWORDS)) {
    const score = keywords.reduce((s, kw) => s + (lower.includes(kw) ? 1 : 0), 0);
    if (score > maxScore) { maxScore = score; sportart = art; }
  }
  const directMatch = SPORTARTEN.find((s) => lower.includes(s.toLowerCase()));
  if (directMatch) sportart = directMatch;

  // Week count detection
  const wochenPhrase   = lower.match(/(\d+)\s*(?:wochen|weeks?)/);
  const wocheHeads     = [...lower.matchAll(/(?:woche|week)\s*\.?\s*(\d+)/g)];
  const maxWocheNum    = wocheHeads.length ? Math.max(...wocheHeads.map((m) => parseInt(m[1]))) : 0;
  const dateRangeCount = (lower.match(/\d+\.\s*[-–]\s*\d+\./g) ?? []).length; // "1.-7."
  const wochentageDE   = (lower.match(/\b(montag|dienstag|mittwoch|donnerstag|freitag)\b/g) ?? []).length;
  const wochentageEN   = (lower.match(/\b(monday|tuesday|wednesday|thursday|friday)\b/g) ?? []).length;

  const anzahlWochen =
    maxWocheNum > 0           ? maxWocheNum :
    wochenPhrase              ? parseInt(wochenPhrase[1]) :
    dateRangeCount >= 2       ? dateRangeCount :
    wochentageDE >= 3         ? Math.ceil(wochentageDE / 3) :
    wochentageEN >= 3         ? Math.ceil(wochentageEN / 3) :
    undefined;

  const wochen = buildWochenStructure(text, anzahlWochen ?? 1);

  return {
    name:         nameLine,
    sportart:     (maxScore > 0 || directMatch) ? sportart : undefined,
    anzahlWochen: anzahlWochen,
    wochen,
    rawText: text,
  };
}

// ─── Week / session structure ──────────────────────────────────────────────────

function buildWochenStructure(text: string, fallbackWochen: number): ParsedWoche[] {
  const wochen: ParsedWoche[] = [];

  // 1. Explicit "Woche N" / "Week N" headings
  const wocheSegments = splitByPattern(text, /(?:woche|week)\s*\.?\s*(\d+)/gi);
  if (wocheSegments.length > 0) {
    for (const seg of wocheSegments) {
      wochen.push({ wochennummer: parseInt(seg.label), einheiten: extractEinheiten(seg.content) });
    }
    return wochen;
  }

  // 2. Date-range week headers ("1.-7. September", "8.-14. Oktober", …)
  const dateRanges = [...text.matchAll(/\d{1,2}\.\s*[-–]\s*\d{1,2}\./g)];
  if (dateRanges.length >= 2) {
    for (let i = 0; i < dateRanges.length; i++) {
      const start = (dateRanges[i].index ?? 0) + dateRanges[i][0].length;
      const end   = i + 1 < dateRanges.length ? (dateRanges[i + 1].index ?? text.length) : text.length;
      wochen.push({ wochennummer: i + 1, einheiten: extractEinheiten(text.slice(start, end)) });
    }
    return wochen;
  }

  // 3. Fallback: all einheiten distributed across weeks
  const allEinheiten = extractEinheiten(text);
  const numWeeks     = Math.max(1, fallbackWochen);
  const perWeek      = Math.ceil(allEinheiten.length / numWeeks);
  for (let i = 0; i < numWeeks; i++) {
    wochen.push({
      wochennummer: i + 1,
      einheiten:    allEinheiten.slice(i * perWeek, (i + 1) * perWeek),
    });
  }
  return wochen;
}

function extractEinheiten(text: string): ParsedEinheit[] {
  const einheiten: ParsedEinheit[] = [];

  const daySegsNum = splitByPattern(text, /(?:tag|einheit|training|session)\s*\.?\s*(\d+|[A-D])/gi);
  const daySegsDE  = splitByDayName(text, ['montag','dienstag','mittwoch','donnerstag','freitag','samstag','sonntag']);
  const daySegsEN  = splitByDayName(text, ['monday','tuesday','wednesday','thursday','friday','saturday','sunday']);

  const segs =
    daySegsNum.length > 0 ? daySegsNum :
    daySegsDE.length > 0  ? daySegsDE :
    daySegsEN.length > 0  ? daySegsEN :
    [{ label: '1', content: text }];

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

/**
 * Merge lines where the exercise name is on one line and parameters
 * are on the next (common in table OCR output).
 * e.g. ["Easy effort Run,", "35mins"] → ["Easy effort Run, 35mins"]
 */
function mergeMultilineExercises(lines: string[]): string[] {
  const result: string[] = [];
  let i = 0;
  while (i < lines.length) {
    const cur  = normalizeLine(lines[i]);
    const next = i + 1 < lines.length ? normalizeLine(lines[i + 1]) : null;

    // Current line has no params but next looks like a param continuation
    if (
      cur.length > 2 &&
      !HEADING_RE.test(cur) &&
      !NOISE_RE.test(cur) &&
      !REST_RE.test(cur) &&
      extractParam(cur) === null &&
      next &&
      !HEADING_RE.test(next) &&
      !REST_RE.test(next) &&
      isParamContinuation(next)
    ) {
      result.push(cur + ' ' + next);
      i += 2;
    } else {
      result.push(cur);
      i++;
    }
  }
  return result;
}

/** A line that starts with a number (params only, no name). */
function isParamContinuation(line: string): boolean {
  return /^\d/.test(line) && extractParam(line) !== null;
}

function extractUebungen(text: string): ParsedUebung[] {
  const uebungen: ParsedUebung[] = [];
  const rawLines  = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 1);
  const lines     = mergeMultilineExercises(rawLines);

  for (const raw of lines) {
    if (HEADING_RE.test(raw)) continue;
    if (NOISE_RE.test(raw))   continue;
    if (REST_RE.test(raw))    continue;

    const line  = normalizeLine(raw);
    const param = extractParam(line);
    if (!param) continue;

    // Name = everything before the first number + unit block
    // \d[\d\s,.–-]* allows ranges like "150-180" before the unit
    const stripped = line.replace(/^[\d\s\-—•·.]+/, '');
    const namePart = stripped
      .replace(/\s*\d[\d\s,.–\-]*(?:kg|min(?:uten?|s)?|sek(?:unden?)?|secs?|seconds?|km|miles?|m\b|wdh|wh|reps?|sätze?|sets?|h\b).*$/i, '')
      .replace(/\s*\+\s*.+$/, '')   // cut off "+ something" after first exercise
      .replace(/[,.\s]+$/, '')       // trailing comma / period / whitespace
      .replace(/[|]+/g, '')
      .trim();

    if (namePart.length < 2 || /^\d+$/.test(namePart)) continue;

    uebungen.push({
      name:      titleCase(namePart),
      parameter: param,
      params:    paramStringToUebungParams(param),
    });
  }

  return uebungen;
}

// ─── Param extraction ──────────────────────────────────────────────────────────

function normalizeLine(raw: string): string {
  return raw.replace(/[|\t]/g, ' ').replace(/\s+/g, ' ').trim();
}

function extractParam(line: string): string | null {
  const parts: string[] = [];
  let foundSets = false;

  // 1. Explicit NxM
  const srX = line.match(SETS_REPS_X);
  if (srX) { parts.push(`${srX[1]}x${srX[2]}`); foundSets = true; }

  // 2. Keyword Sätze/Wdh
  if (!foundSets) {
    const sk = line.match(SAETZE_KW);
    const wk = line.match(WDH_KW);
    if (sk && wk)      { parts.push(`${sk[1]}x${wk[1]}`); foundSets = true; }
    else if (sk)       { parts.push(`${sk[1]} Sätze`); foundSets = true; }
    else if (wk)       { parts.push(`${wk[1]} Wdh`); }
  }

  // 3. Two adjacent numbers (table column style)
  if (!foundSets) {
    const tw = line.match(SAETZE_WDH);
    if (tw) { parts.push(`${tw[1]}x${tw[2]}`); foundSets = true; }
  }

  // Weight
  const wt = line.match(WEIGHT);
  if (wt) parts.push(`${wt[1].replace(',', '.')} kg`);

  // Duration (covers "35mins", "40 min", "30 Minuten", "150-180 Minuten")
  const dur = line.match(DURATION);
  if (dur) {
    const unit = normalizeDurUnit(dur[2]);
    // Normalize range "150-180" → "150-180"
    const val  = dur[1].replace(/\s+/g, '');
    parts.push(`${val} ${unit}`);
  }

  // Distance
  const dist = line.match(DISTANCE);
  if (!dur && dist) parts.push(`${dist[1].replace(',', '.')} ${dist[2].toLowerCase()}`);

  return parts.length ? parts.join(' · ') : null;
}

function normalizeDurUnit(raw: string): string {
  const l = raw.toLowerCase();
  if (l.startsWith('min')) return 'min';
  if (l.startsWith('sek') || l === 's' || l.startsWith('sec')) return 'sek';
  if (l === 'h' || l.startsWith('hour')) return 'h';
  return l;
}

/** Converts a raw param string into structured UebungParam[]. */
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

  const dur = raw.match(DURATION);
  if (dur) {
    params.push({ typ: 'dauer', wert: dur[1].replace(/\s+/g, ''), einheit: normalizeDurUnit(dur[2]) });
  }

  const dist = raw.match(DISTANCE);
  if (!dur && dist) params.push({ typ: 'distanz', wert: dist[1].replace(',', '.'), einheit: dist[2].toLowerCase() });

  return params;
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

function splitByDayName(text: string, days: string[]): Segment[] {
  const re   = new RegExp(`\\b(${days.join('|')})\\b`, 'gi');
  const segs = splitByPattern(text, re);
  return segs.map((s) => ({ ...s, label: titleCase(s.label) }));
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
