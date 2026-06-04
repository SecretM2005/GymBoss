import { Phase, EinheitUebung } from '../types';
import { paramStringToUebungParams } from './trainingsplanParser';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ParsedVoiceExercise = {
  name: string;
  phase: Phase;
  parameter: string;
};

export type VoiceParseResult =
  | { ok: true; sessionName?: string; exercises: ParsedVoiceExercise[] }
  | { ok: false; message: string };

// ─── Claude API ───────────────────────────────────────────────────────────────

const CLAUDE_KEY  = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';
const CLAUDE_URL  = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-haiku-4-5-20251001';

const VOICE_PROMPT = `Du bist ein Fitness-Assistent. Der Nutzer beschreibt mündlich eine Trainingseinheit.
Extrahiere alle Übungen und gib ausschließlich gültiges JSON zurück — kein Markdown, keine Erklärungen.

JSON-Schema:
{
  "sessionName": "optionaler Name der Einheit (string oder null)",
  "exercises": [
    {
      "name": "Übungsname auf Deutsch",
      "phase": "warmup | haupteinheit | cooldown",
      "parameter": "z.B. 3x10 80kg  oder  30s  oder  '' wenn keine Angabe"
    }
  ]
}

Regeln:
- phase-Standard: "haupteinheit"
- Aufwärmen / Warm-up / Mobilisation am Anfang → "warmup"
- Cool-down / Dehnen am Ende / Ausklang → "cooldown"
- parameter: Sätze×Wiederholungen + optionales Gewicht (z.B. "4x8 60kg"), Dauer (z.B. "30s" / "5min") oder Distanz (z.B. "400m"). Leer ("") wenn keine Angabe.
- Übungsnamen auf Deutsch belassen (z.B. "Bankdrücken", "Kniebeuge", "Laufen").
- sessionName: Wenn der Nutzer einen Namen für die Einheit nennt (z.B. "Beintraining", "Push Day"), extrahiere ihn. Sonst null.`;

export async function parseWorkoutFromVoice(transcript: string): Promise<VoiceParseResult> {
  if (!CLAUDE_KEY) {
    return { ok: false, message: 'Kein API-Key konfiguriert (EXPO_PUBLIC_ANTHROPIC_API_KEY).' };
  }

  try {
    const body = {
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: VOICE_PROMPT },
          { type: 'text', text: `\nTranskript:\n${transcript}` },
        ],
      }],
    };

    const res = await fetch(CLAUDE_URL, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'x-api-key':     CLAUDE_KEY,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.text();
      return { ok: false, message: `Claude API Fehler ${res.status}: ${err.slice(0, 200)}` };
    }

    const json = await res.json();
    const raw  = (json?.content?.[0]?.text ?? '') as string;

    return parseVoiceJson(raw);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

function parseVoiceJson(raw: string): VoiceParseResult {
  try {
    const clean = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    const g = JSON.parse(clean);

    const VALID_PHASES: Phase[] = ['warmup', 'haupteinheit', 'cooldown'];

    const exercises: ParsedVoiceExercise[] = (g.exercises ?? []).map((e: Record<string, unknown>) => {
      const rawPhase = String(e.phase ?? 'haupteinheit');
      const phase: Phase = VALID_PHASES.includes(rawPhase as Phase)
        ? (rawPhase as Phase)
        : 'haupteinheit';
      return {
        name:      String(e.name ?? '').trim(),
        phase,
        parameter: String(e.parameter ?? '').trim(),
      };
    }).filter((e: ParsedVoiceExercise) => e.name.length > 0);

    const sessionName = g.sessionName ? String(g.sessionName).trim() : undefined;

    return { ok: true, sessionName: sessionName || undefined, exercises };
  } catch {
    return { ok: false, message: 'Antwort konnte nicht verarbeitet werden.' };
  }
}

// ─── Convert parsed exercises to EinheitUebung objects ────────────────────────

let _uid = 0;

export function parsedExercisesToUebungen(
  exercises: ParsedVoiceExercise[],
): Array<{ ueb: EinheitUebung; phase: Phase }> {
  return exercises.map((e) => {
    const ueb: EinheitUebung = {
      id:        `eu_v${++_uid}`,
      name:      e.name,
      parameter: paramStringToUebungParams(e.parameter),
    };
    return { ueb, phase: e.phase };
  });
}
