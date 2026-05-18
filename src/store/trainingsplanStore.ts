import { create } from 'zustand';
import { TrainingsPlan, PlanWoche, PlanWorkout, PlanUebung, Wochentag } from '../types';

// ─── Nested update helpers ────────────────────────────────────────────────────

function mapPlan(
  plaene: TrainingsPlan[],
  planId: string,
  fn: (p: TrainingsPlan) => TrainingsPlan,
): TrainingsPlan[] {
  return plaene.map((p) => (p.id === planId ? fn(p) : p));
}

function mapWoche(
  plaene: TrainingsPlan[],
  planId: string,
  wocheId: string,
  fn: (w: PlanWoche) => PlanWoche,
): TrainingsPlan[] {
  return mapPlan(plaene, planId, (p) => ({
    ...p,
    wochen: p.wochen.map((w) => (w.id === wocheId ? fn(w) : w)),
  }));
}

function mapWorkout(
  plaene: TrainingsPlan[],
  planId: string,
  wocheId: string,
  workoutId: string,
  fn: (wo: PlanWorkout) => PlanWorkout,
): TrainingsPlan[] {
  return mapWoche(plaene, planId, wocheId, (w) => ({
    ...w,
    workouts: w.workouts.map((wo) => (wo.id === workoutId ? fn(wo) : wo)),
  }));
}

// ─── Store ────────────────────────────────────────────────────────────────────

type TrainingsplanState = {
  plaene: TrainingsPlan[];

  // Plan CRUD
  addPlan: (p: Omit<TrainingsPlan, 'id'>) => string;
  updatePlan: (planId: string, updates: Partial<Omit<TrainingsPlan, 'id' | 'wochen'>>) => void;
  deletePlan: (planId: string) => void;
  getPlanById: (planId: string) => TrainingsPlan | undefined;
  getPlaeneByTrainerId: (trainerId: string) => TrainingsPlan[];
  getPlaeneBySportlerId: (sportlerId: string) => TrainingsPlan[];

  // Woche CRUD
  addWoche: (planId: string) => string;
  updateWoche: (planId: string, wocheId: string, updates: Partial<Omit<PlanWoche, 'id' | 'workouts'>>) => void;
  deleteWoche: (planId: string, wocheId: string) => void;

  // Workout CRUD
  addWorkout: (planId: string, wocheId: string, data: Pick<PlanWorkout, 'name' | 'wochentag' | 'typ'>) => string;
  updateWorkoutMeta: (planId: string, wocheId: string, workoutId: string, updates: Partial<Pick<PlanWorkout, 'name' | 'typ' | 'wochentag'>>) => void;
  deleteWorkout: (planId: string, wocheId: string, workoutId: string) => void;

  // Uebungen
  setUebungen: (planId: string, wocheId: string, workoutId: string, uebungen: PlanUebung[]) => void;
};

let _uid = 9000;
const uid = () => String(++_uid);

export const useTrainingsplanStore = create<TrainingsplanState>((set, get) => ({
  plaene: INITIAL_PLAENE,

  addPlan: (p) => {
    const id = uid();
    set((s) => ({ plaene: [{ ...p, id }, ...s.plaene] }));
    return id;
  },

  updatePlan: (planId, updates) =>
    set((s) => ({ plaene: mapPlan(s.plaene, planId, (p) => ({ ...p, ...updates })) })),

  deletePlan: (planId) =>
    set((s) => ({ plaene: s.plaene.filter((p) => p.id !== planId) })),

  getPlanById: (planId) => get().plaene.find((p) => p.id === planId),
  getPlaeneByTrainerId: (trainerId) => get().plaene.filter((p) => p.trainerId === trainerId),
  getPlaeneBySportlerId: (sportlerId) => get().plaene.filter((p) => p.sportlerId === sportlerId),

  addWoche: (planId) => {
    const id = uid();
    set((s) => ({
      plaene: mapPlan(s.plaene, planId, (p) => ({
        ...p,
        wochen: [
          ...p.wochen,
          { id, wochennummer: p.wochen.length + 1, workouts: [] },
        ],
      })),
    }));
    return id;
  },

  updateWoche: (planId, wocheId, updates) =>
    set((s) => ({
      plaene: mapWoche(s.plaene, planId, wocheId, (w) => ({ ...w, ...updates })),
    })),

  deleteWoche: (planId, wocheId) =>
    set((s) => ({
      plaene: mapPlan(s.plaene, planId, (p) => ({
        ...p,
        wochen: p.wochen
          .filter((w) => w.id !== wocheId)
          .map((w, i) => ({ ...w, wochennummer: i + 1 })),
      })),
    })),

  addWorkout: (planId, wocheId, data) => {
    const id = uid();
    set((s) => ({
      plaene: mapWoche(s.plaene, planId, wocheId, (w) => ({
        ...w,
        workouts: [...w.workouts, { ...data, id, uebungen: [] }],
      })),
    }));
    return id;
  },

  updateWorkoutMeta: (planId, wocheId, workoutId, updates) =>
    set((s) => ({
      plaene: mapWorkout(s.plaene, planId, wocheId, workoutId, (wo) => ({ ...wo, ...updates })),
    })),

  deleteWorkout: (planId, wocheId, workoutId) =>
    set((s) => ({
      plaene: mapWoche(s.plaene, planId, wocheId, (w) => ({
        ...w,
        workouts: w.workouts.filter((wo) => wo.id !== workoutId),
      })),
    })),

  setUebungen: (planId, wocheId, workoutId, uebungen) =>
    set((s) => ({
      plaene: mapWorkout(s.plaene, planId, wocheId, workoutId, (wo) => ({ ...wo, uebungen })),
    })),
}));

// ─── Sample data ──────────────────────────────────────────────────────────────

function ue(id: string, name: string, saetze: number, wdh: number, gewicht: number | undefined, pause: number, notizen?: string): PlanUebung {
  return { id, name, saetze, wiederholungen: wdh, gewicht, pause, notizen };
}

function workout(id: string, name: string, wochentag: Wochentag, typ: string, uebungen: PlanUebung[]): PlanWorkout {
  return { id, name, wochentag, typ, uebungen };
}

function woche(id: string, nr: number, workouts: PlanWorkout[], notizen?: string): PlanWoche {
  return { id, wochennummer: nr, workouts, notizen };
}

// ── Plan 1: Kraftaufbau (für Anna Bauer u2) ──────────────────────────────────

const beinTag = (idPfx: string): PlanWorkout => workout(`${idPfx}a`, 'Bein-Tag', 'Mo', 'Krafttraining I', [
  ue(`${idPfx}a1`, 'Kniebeugen',              4,  8, 60,  120),
  ue(`${idPfx}a2`, 'Beinpresse',              3, 12, 100,  90),
  ue(`${idPfx}a3`, 'Ausfallschritte',         3, 10, 20,   60),
  ue(`${idPfx}a4`, 'Beinbeuger',              3, 12, 40,   60),
]);
const pushTag = (idPfx: string): PlanWorkout => workout(`${idPfx}b`, 'Push-Tag', 'Mi', 'Krafttraining II', [
  ue(`${idPfx}b1`, 'Bankdrücken',             4,  8, 60,  120),
  ue(`${idPfx}b2`, 'Schulterdrücken',         3, 10, 30,   90),
  ue(`${idPfx}b3`, 'Dips',                    3, 12, undefined, 60),
  ue(`${idPfx}b4`, 'Trizeps Seilzug',         3, 15, 15,   60),
]);
const pullTag = (idPfx: string): PlanWorkout => workout(`${idPfx}c`, 'Pull-Tag', 'Fr', 'Krafttraining III', [
  ue(`${idPfx}c1`, 'Klimmzüge',               4,  8, undefined, 120),
  ue(`${idPfx}c2`, 'Kurzhantelrudern',         4, 10, 50,  90),
  ue(`${idPfx}c3`, 'Bizeps Curls',            3, 12, 15,  60),
  ue(`${idPfx}c4`, 'Face Pulls',              3, 15, 12,  45),
]);
const coreTag = (idPfx: string): PlanWorkout => workout(`${idPfx}d`, 'Core & Mobility', 'Sa', 'Mobilität', [
  ue(`${idPfx}d1`, 'Plank',                   3, 60, undefined, 30, 'Halten in Sekunden'),
  ue(`${idPfx}d2`, 'Bird-Dog',                3, 10, undefined, 30),
  ue(`${idPfx}d3`, 'Glute Bridge',            3, 15, undefined, 30),
]);

// ── Plan 2: Kampfsport (für Jonas Weber u3) ───────────────────────────────────

const technikTag = (idPfx: string): PlanWorkout => workout(`${idPfx}e`, 'Technik & Kondition', 'Di', 'Kampfsport', [
  ue(`${idPfx}e1`, 'Schattenboxen',           5,  3, undefined, 60, '3 Minuten-Runden'),
  ue(`${idPfx}e2`, 'Pratzenarbeit',           4,  3, undefined, 60, '3 Minuten-Runden'),
  ue(`${idPfx}e3`, 'Seilspringen',            3,  3, undefined, 60, '3 Minuten-Runden'),
]);
const kraftTag = (idPfx: string): PlanWorkout => workout(`${idPfx}f`, 'Kraft & Athletik', 'Do', 'Krafttraining', [
  ue(`${idPfx}f1`, 'Kreuzheben',              4,  5, 100, 180),
  ue(`${idPfx}f2`, 'Klimmzüge',               4,  8, undefined, 90),
  ue(`${idPfx}f3`, 'Kettlebell Schwingen',    3, 20, 24,   60),
  ue(`${idPfx}f4`, 'Box Jumps',               3, 10, undefined, 60),
]);
const sparringTag = (idPfx: string): PlanWorkout => workout(`${idPfx}g`, 'Sparring & Spezifisch', 'Sa', 'Kampfsport', [
  ue(`${idPfx}g1`, 'Sparring (leicht)',        5,  3, undefined, 60, '3 Minuten-Runden'),
  ue(`${idPfx}g2`, 'Clinch-Arbeit',           3,  3, undefined, 60, '3 Minuten-Runden'),
  ue(`${idPfx}g3`, 'Cool-Down Stretching',    1, 15, undefined, 30),
]);

const INITIAL_PLAENE: TrainingsPlan[] = [
  {
    id: 'p1',
    name: 'Kraftaufbau 12 Wochen',
    beschreibung: 'Progressiver Kraftaufbau mit Push/Pull/Legs-Split.',
    ziel: 'Muskelmasse aufbauen, Grundkraft steigern',
    sportlerId: 'u2',
    trainerId: 'u1',
    startdatum: '2026-04-07',
    wochen: [
      woche('w1', 1, [beinTag('1'), pushTag('1'), pullTag('1'), coreTag('1')], 'Einstiegswoche – Technik fokussieren'),
      woche('w2', 2, [beinTag('2'), pushTag('2'), pullTag('2'), coreTag('2')], '+2,5 kg beim Hauptlift'),
      woche('w3', 3, [beinTag('3'), pushTag('3'), pullTag('3'), coreTag('3')], 'Intensität leicht erhöhen'),
    ],
  },
  {
    id: 'p2',
    name: 'Kampfsport Kondition',
    beschreibung: 'Kampfsport-spezifisches Kraft- und Konditionsprogramm.',
    ziel: 'Kampfsportkondition und Explosivkraft aufbauen',
    sportlerId: 'u3',
    trainerId: 'u1',
    startdatum: '2026-05-04',
    wochen: [
      woche('w4', 1, [technikTag('4'), kraftTag('4'), sparringTag('4')], 'Basis etablieren'),
      woche('w5', 2, [technikTag('5'), kraftTag('5'), sparringTag('5')], 'Intensität steigern'),
      woche('w6', 3, [technikTag('6'), kraftTag('6'), sparringTag('6')], 'Spitzenintensität'),
    ],
  },
];
