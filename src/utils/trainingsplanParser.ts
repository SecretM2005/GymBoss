/**
 * Extracts training plan structure from raw OCR text (German sports plans).
 */

export type ParsedEinheit = {
  name: string;
  uebungen: ParsedUebung[];
};

export type ParsedUebung = {
  name: string;
  parameter: string; // raw like "3x8 80kg" or "30min"
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
  Leichtathletik:  ['lauf', 'sprint', 'meter', 'm ', 'km', 'marathon', 'jogging', 'tempo'],
  Kampfsport:      ['kampf', 'box', 'kick', 'sparring', 'judo', 'mma', 'karate'],
  Konditionierung: ['ausdauer', 'kondition', 'cardio', 'intervall', 'hiit', 'atemübung'],
  Mobility:        ['dehnen', 'stretch', 'mobilität', 'yoga', 'movement', 'beweglichkeit'],
  Crossfit:        ['crossfit', 'wod', 'amrap', 'emom', 'burpee'],
};

// Patterns for exercises with parameters
const UEB_LINE = /^(.{3,40}?)\s{2,}(\d[\d\s×x\.]*(?:kg|min|sek|s|m|wdh|reps)?.*)?$/i;
const SETS_REPS = /(\d+)\s*[×xX]\s*(\d+)/;
const WEIGHT    = /(\d+(?:[,.]\d+)?)\s*kg/i;
const DURATION  = /(\d+)\s*(min|sek|s)\b/i;
const DISTANCE  = /(\d+(?:[,.]\d+)?)\s*(km|m)\b/i;

// Week heading patterns: "Woche 1", "WEEK 2", "1. Woche", "W1"
const WOCHE_HEAD = /(?:^|\n)\s*(?:woche|week|w)\s*\.?\s*(\d+)\b/gi;
// Day/session heading: "Tag 1", "Montag", "Training A", "Einheit 1"
const TAG_HEAD   = /(?:^|\n)\s*(?:tag|day|einheit|training|session|unit)\s*\.?\s*(\d+|[a-d])\b/gi;
const WOCHENTAG  = /(?:^|\n)\s*(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag)\b/gi;

export function parseTrainingText(text: string): ParsedPlan {
  const lower = text.toLowerCase();
  const lines  = text.split('\n').map((l) => l.trim());

  // ── Plan name ──────────────────────────────────────────────────────────────
  // Take the first non-empty line that isn't just a number or week heading
  const nameLine = lines.find((l) =>
    l.length > 3 &&
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
  // Hard override: if we literally find the name
  const directMatch = SPORTARTEN.find((s) => lower.includes(s.toLowerCase()));
  if (directMatch) sportart = directMatch;

  // ── Wochen count ───────────────────────────────────────────────────────────
  // Strategy 1: explicit "X Wochen" phrase
  const wochenPhrase = lower.match(/(\d+)\s*wochen/);
  // Strategy 2: highest "Woche N" occurrence
  const wocheHeads = [...lower.matchAll(/woche\s*\.?\s*(\d+)/g)];
  const maxWocheNum = wocheHeads.length
    ? Math.max(...wocheHeads.map((m) => parseInt(m[1])))
    : 0;
  // Strategy 3: count weekday blocks
  const wochentageCount = (lower.match(/\b(montag|dienstag|mittwoch|donnerstag|freitag)\b/g) ?? []).length;

  const anzahlWochen =
    maxWocheNum > 0    ? maxWocheNum :
    wochenPhrase       ? parseInt(wochenPhrase[1]) :
    wochentageCount >= 3 ? Math.ceil(wochentageCount / 3) :
    undefined;

  // ── Parse weekly structure ─────────────────────────────────────────────────
  const wochen: ParsedWoche[] = buildWochenStructure(text, anzahlWochen ?? 0);

  return {
    name:        nameLine,
    sportart:    maxScore > 0 || directMatch ? sportart : undefined,
    anzahlWochen: anzahlWochen,
    wochen,
    rawText: text,
  };
}

function buildWochenStructure(text: string, fallbackWochen: number): ParsedWoche[] {
  const wochen: ParsedWoche[] = [];

  // Split text into week blocks
  const wocheSegments = splitByPattern(text, /(?:woche|week)\s*\.?\s*(\d+)/gi);

  if (wocheSegments.length > 0) {
    for (const seg of wocheSegments) {
      const wochennummer = parseInt(seg.label);
      const einheiten = extractEinheiten(seg.content);
      wochen.push({ wochennummer, einheiten });
    }
  } else if (fallbackWochen > 0) {
    // No week headings — treat whole text as one "week" per week count
    const allEinheiten = extractEinheiten(text);
    for (let i = 1; i <= fallbackWochen; i++) {
      wochen.push({ wochennummer: i, einheiten: i === 1 ? allEinheiten : [] });
    }
  }

  return wochen;
}

type Segment = { label: string; content: string };

function splitByPattern(text: string, re: RegExp): Segment[] {
  const results: Segment[] = [];
  const matches = [...text.matchAll(re)];
  for (let i = 0; i < matches.length; i++) {
    const start  = (matches[i].index ?? 0) + matches[i][0].length;
    const end    = i + 1 < matches.length ? (matches[i + 1].index ?? text.length) : text.length;
    results.push({ label: matches[i][1], content: text.slice(start, end) });
  }
  return results;
}

function extractEinheiten(text: string): ParsedEinheit[] {
  const einheiten: ParsedEinheit[] = [];

  // Try to split by day/session headings
  const daySegs = splitByPattern(text, /(?:tag|einheit|training|session)\s*\.?\s*(\d+|[A-D])/gi);
  const tagSegs = splitByDayName(text);
  const segs    = daySegs.length > 0 ? daySegs : tagSegs.length > 0 ? tagSegs : [{ label: '1', content: text }];

  for (const seg of segs) {
    const uebungen = extractUebungen(seg.content);
    if (uebungen.length > 0) {
      einheiten.push({ name: `Einheit ${seg.label}`, uebungen });
    }
  }

  // If no structure found, extract all exercises as one unit
  if (einheiten.length === 0) {
    const uebungen = extractUebungen(text);
    if (uebungen.length > 0) {
      einheiten.push({ name: 'Trainingseinheit', uebungen });
    }
  }

  return einheiten;
}

function splitByDayName(text: string): Segment[] {
  const DAYS = ['montag','dienstag','mittwoch','donnerstag','freitag','samstag','sonntag'];
  const re   = new RegExp(`(${DAYS.join('|')})`, 'gi');
  const segs = splitByPattern(text, re);
  return segs.map((s, i) => ({ ...s, label: String(i + 1) }));
}

function extractUebungen(text: string): ParsedUebung[] {
  const uebungen: ParsedUebung[] = [];
  const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 2);

  for (const line of lines) {
    // Skip headings and short noise
    if (/^(woche|tag|einheit|training|session|montag|dienstag|mittwoch|donnerstag|freitag)/i.test(line)) continue;
    if (line.length < 4 || /^\d+$/.test(line)) continue;

    const param = extractParam(line);
    if (!param) continue; // skip lines with no recognizable parameter

    // Exercise name = everything before the first number-like chunk
    const namePart = line.replace(/\d[\d\s×x\.]*(?:kg|min|sek|s|m|wdh|reps|mal)?.*$/i, '').trim();
    if (namePart.length < 2) continue;

    uebungen.push({ name: titleCase(namePart), parameter: param });
  }

  return uebungen;
}

function extractParam(line: string): string | null {
  const parts: string[] = [];

  const sr = line.match(SETS_REPS);
  if (sr) parts.push(`${sr[1]}x${sr[2]}`);

  const wt = line.match(WEIGHT);
  if (wt) parts.push(`${wt[1]} kg`);

  const dr = line.match(DURATION);
  if (dr) parts.push(`${dr[1]} ${dr[2]}`);

  const ds = line.match(DISTANCE);
  if (!dr && ds) parts.push(`${ds[1]} ${ds[2]}`);

  return parts.length ? parts.join(' · ') : null;
}

function titleCase(s: string): string {
  return s.replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
