import { create } from 'zustand';
import { TrainingsPlan, PlanWoche, PlanWorkout, PlanUebung, Wochentag } from '../types';

// ─── Nested update helpers ────────────────────────────────────────────────────

function mapPlan(plaene: TrainingsPlan[], planId: string, fn: (p: TrainingsPlan) => TrainingsPlan): TrainingsPlan[] {
  return plaene.map((p) => (p.id === planId ? fn(p) : p));
}
function mapWoche(plaene: TrainingsPlan[], planId: string, wocheId: string, fn: (w: PlanWoche) => PlanWoche): TrainingsPlan[] {
  return mapPlan(plaene, planId, (p) => ({ ...p, wochen: p.wochen.map((w) => (w.id === wocheId ? fn(w) : w)) }));
}
function mapWorkout(plaene: TrainingsPlan[], planId: string, wocheId: string, workoutId: string, fn: (wo: PlanWorkout) => PlanWorkout): TrainingsPlan[] {
  return mapWoche(plaene, planId, wocheId, (w) => ({ ...w, workouts: w.workouts.map((wo) => (wo.id === workoutId ? fn(wo) : wo)) }));
}

// ─── Store ────────────────────────────────────────────────────────────────────

type TrainingsplanState = {
  plaene: TrainingsPlan[];
  addPlan: (p: Omit<TrainingsPlan, 'id'>) => string;
  updatePlan: (planId: string, updates: Partial<Omit<TrainingsPlan, 'id' | 'wochen'>>) => void;
  deletePlan: (planId: string) => void;
  getPlanById: (planId: string) => TrainingsPlan | undefined;
  getPlaeneByTrainerId: (trainerId: string) => TrainingsPlan[];
  getPlaeneBySportlerId: (sportlerId: string) => TrainingsPlan[];
  addWoche: (planId: string) => string;
  updateWoche: (planId: string, wocheId: string, updates: Partial<Omit<PlanWoche, 'id' | 'workouts'>>) => void;
  deleteWoche: (planId: string, wocheId: string) => void;
  addWorkout: (planId: string, wocheId: string, data: Pick<PlanWorkout, 'name' | 'wochentag' | 'typ'>) => string;
  updateWorkoutMeta: (planId: string, wocheId: string, workoutId: string, updates: Partial<Pick<PlanWorkout, 'name' | 'typ' | 'wochentag'>>) => void;
  deleteWorkout: (planId: string, wocheId: string, workoutId: string) => void;
  setUebungen: (planId: string, wocheId: string, workoutId: string, uebungen: PlanUebung[]) => void;
};

let _uid = 9000;
const uid = () => String(++_uid);

export const useTrainingsplanStore = create<TrainingsplanState>((set, get) => ({
  plaene: INITIAL_PLAENE,

  addPlan: (p) => { const id = uid(); set((s) => ({ plaene: [{ ...p, id }, ...s.plaene] })); return id; },
  updatePlan: (planId, updates) => set((s) => ({ plaene: mapPlan(s.plaene, planId, (p) => ({ ...p, ...updates })) })),
  deletePlan: (planId) => set((s) => ({ plaene: s.plaene.filter((p) => p.id !== planId) })),
  getPlanById: (planId) => get().plaene.find((p) => p.id === planId),
  getPlaeneByTrainerId: (trainerId) => get().plaene.filter((p) => p.trainerId === trainerId),
  getPlaeneBySportlerId: (sportlerId) => get().plaene.filter((p) => p.sportlerId === sportlerId),

  addWoche: (planId) => {
    const id = uid();
    set((s) => ({ plaene: mapPlan(s.plaene, planId, (p) => ({ ...p, wochen: [...p.wochen, { id, wochennummer: p.wochen.length + 1, workouts: [] }] })) }));
    return id;
  },
  updateWoche: (planId, wocheId, updates) => set((s) => ({ plaene: mapWoche(s.plaene, planId, wocheId, (w) => ({ ...w, ...updates })) })),
  deleteWoche: (planId, wocheId) => set((s) => ({ plaene: mapPlan(s.plaene, planId, (p) => ({ ...p, wochen: p.wochen.filter((w) => w.id !== wocheId).map((w, i) => ({ ...w, wochennummer: i + 1 })) })) })),

  addWorkout: (planId, wocheId, data) => {
    const id = uid();
    set((s) => ({ plaene: mapWoche(s.plaene, planId, wocheId, (w) => ({ ...w, workouts: [...w.workouts, { ...data, id, uebungen: [] }] })) }));
    return id;
  },
  updateWorkoutMeta: (planId, wocheId, workoutId, updates) => set((s) => ({ plaene: mapWorkout(s.plaene, planId, wocheId, workoutId, (wo) => ({ ...wo, ...updates })) })),
  deleteWorkout: (planId, wocheId, workoutId) => set((s) => ({ plaene: mapWoche(s.plaene, planId, wocheId, (w) => ({ ...w, workouts: w.workouts.filter((wo) => wo.id !== workoutId) })) })),
  setUebungen: (planId, wocheId, workoutId, uebungen) => set((s) => ({ plaene: mapWorkout(s.plaene, planId, wocheId, workoutId, (wo) => ({ ...wo, uebungen })) })),
}));

// ─── Sample data (matches design) ─────────────────────────────────────────────

function ue(id: string, name: string, saetze: number, wdh: number, gewicht: number, pause: number, notizen?: string): PlanUebung {
  return { id, name, saetze, wiederholungen: wdh, gewicht: gewicht || undefined, pause, notizen: notizen || undefined };
}

// Plan 1: Anna Berger — Hypertrophie Block A
const PLAN_ANNA: TrainingsPlan = {
  id: 'p1',
  name: 'Hypertrophie Block A',
  beschreibung: '12-wöchiger Aufbauzyklus mit Fokus auf Oberkörperkraft und Posterior Chain.',
  ziel: 'Kraftaufbau · +5kg Magermasse',
  sportlerId: 'u2', trainerId: 'u1',
  startdatum: '2026-04-28',
  wochen: [
    {
      id: 'w1', wochennummer: 1, notizen: 'Eingewöhnung — RPE 7 Cap.',
      workouts: [
        { id: 'wo1', name: 'Push A', wochentag: 'Mo', typ: 'Krafttraining I', uebungen: [
          ue('u1', 'Bankdrücken',          4,  8, 55, 120, 'Ellbogen 45°.'),
          ue('u2', 'Schrägbankdrücken KH', 3, 10, 18,  90),
          ue('u3', 'Schulterdrücken',      3, 10, 22,  90, 'Core fest.'),
          ue('u4', 'Trizeps Pushdown',     3, 12, 25,  60),
        ]},
        { id: 'wo2', name: 'Pull A', wochentag: 'Di', typ: 'Krafttraining I', uebungen: [
          ue('u5', 'Klimmzüge (assistiert)', 4,  6,  0, 120, '-20kg Assistenz'),
          ue('u6', 'Langhantelrudern',       4,  8, 45, 120, 'Brust hoch.'),
          ue('u7', 'Latzug eng',             3, 10, 35,  90),
          ue('u8', 'Bizeps Curls KH',        3, 12, 10,  60),
        ]},
        { id: 'wo3', name: 'Legs A', wochentag: 'Do', typ: 'Krafttraining II', uebungen: [
          ue('u9',  'Kniebeugen',       5,  6, 65, 180, 'Tief, langsam.'),
          ue('u10', 'Rumänisches KH',   4,  8, 50, 120),
          ue('u11', 'Beinpresse',       3, 12, 120, 90),
        ]},
        { id: 'wo4', name: 'Conditioning', wochentag: 'Sa', typ: 'Kampfsport', uebungen: [
          ue('u12', 'Schattenboxen', 5, 3, 0, 60, '3 Min Runden'),
          ue('u13', 'Sandsack',      5, 3, 0, 60, 'Kombi 1-2-3'),
          ue('u14', 'Burpees',       4, 15, 0, 45),
        ]},
      ],
    },
    {
      id: 'w2', wochennummer: 2, notizen: 'Volumen +1 Satz, RPE 8.',
      workouts: [
        { id: 'wo5', name: 'Push A', wochentag: 'Mo', typ: 'Krafttraining I', uebungen: [
          ue('u15', 'Bankdrücken',          5,  8, 57.5, 120),
          ue('u16', 'Schrägbankdrücken KH', 4, 10, 18,   90),
          ue('u17', 'Schulterdrücken',      3, 10, 24,   90),
        ]},
        { id: 'wo6', name: 'Pull A', wochentag: 'Di', typ: 'Krafttraining I', uebungen: [
          ue('u18', 'Klimmzüge',      5,  6,   0, 120, '-15kg Assistenz'),
          ue('u19', 'Langhantelrudern', 4, 8, 47.5, 120),
          ue('u20', 'Latzug',         3, 10, 37.5,  90),
        ]},
        { id: 'wo7', name: 'Legs A', wochentag: 'Do', typ: 'Krafttraining II', uebungen: [
          ue('u21', 'Kniebeugen',    5,  6, 70, 180),
          ue('u22', 'Rumänisches KH', 4, 8, 55, 120),
        ]},
      ],
    },
    {
      id: 'w3', wochennummer: 3, notizen: 'Deload — Intensität -20%.',
      workouts: [
        { id: 'wo8', name: 'Full Body Light', wochentag: 'Mo', typ: 'Krafttraining I', uebungen: [
          ue('u23', 'Bankdrücken', 3, 8, 45, 90, 'Locker.'),
          ue('u24', 'Kniebeugen',  3, 8, 55, 90),
          ue('u25', 'Rudern',      3, 8, 40, 90),
        ]},
        { id: 'wo9', name: 'Mobility', wochentag: 'Mi', typ: 'Mobility', uebungen: [
          ue('u26', 'Hüftöffner',    3, 10, 0, 30),
          ue('u27', 'Schulter CARs', 3,  8, 0, 30),
        ]},
        { id: 'wo10', name: 'Tech Sparring', wochentag: 'Sa', typ: 'Kampfsport', uebungen: [
          ue('u28', 'Drill Jab-Cross', 4, 20, 0, 60, 'Partnerübung'),
          ue('u29', 'Footwork',         4,  3, 0, 60, '2 Min'),
        ]},
      ],
    },
  ],
};

// Plan 2: Lukas Reiter — Fight Camp 8W
const PLAN_LUKAS: TrainingsPlan = {
  id: 'p2',
  name: 'Fight Camp 8W',
  beschreibung: 'Wettkampfvorbereitung 8 Wochen. Mix aus Kraft, Konditionierung und Sparring.',
  ziel: 'Wettkampfvorbereitung',
  sportlerId: 'u3', trainerId: 'u1',
  startdatum: '2026-05-04',
  wochen: [
    {
      id: 'w4', wochennummer: 1, notizen: 'Basis Volumen aufbauen.',
      workouts: [
        { id: 'wo11', name: 'Sparring',   wochentag: 'Mo', typ: 'Kampfsport', uebungen: [
          ue('u30', 'Aufwärmen Seilspringen', 3,  3, 0, 60, '3 Min Runden'),
          ue('u31', 'Pratzen Kombi',          5,  3, 0, 60),
          ue('u32', 'Sparring',               4,  3, 0, 90, 'Kontrolliert'),
        ]},
        { id: 'wo12', name: 'Kraft Push', wochentag: 'Di', typ: 'Krafttraining I', uebungen: [
          ue('u33', 'Bankdrücken',   5, 5, 85, 180),
          ue('u34', 'Military Press', 4, 6, 45, 120),
        ]},
        { id: 'wo13', name: 'Conditioning', wochentag: 'Do', typ: 'Konditionierung', uebungen: [
          ue('u35', '400m Sprints', 6, 1, 0, 90, '<75s'),
          ue('u36', 'Hill Sprints', 8, 1, 0, 60),
        ]},
        { id: 'wo14', name: 'Technik', wochentag: 'Sa', typ: 'Kampfsport', uebungen: [
          ue('u37', 'Schattenboxen', 5, 3, 0, 60),
          ue('u38', 'Sandsack',      6, 3, 0, 60),
        ]},
      ],
    },
    {
      id: 'w5', wochennummer: 2, notizen: 'Intensität +.',
      workouts: [
        { id: 'wo15', name: 'Sparring',   wochentag: 'Mo', typ: 'Kampfsport', uebungen: [
          ue('u39', 'Sparring 5×3', 5, 3, 0, 90),
        ]},
        { id: 'wo16', name: 'Kraft Pull', wochentag: 'Mi', typ: 'Krafttraining I', uebungen: [
          ue('u40', 'Kreuzheben',  5, 5, 130, 180),
          ue('u41', 'Klimmzüge',   4, 8,   0,  90, '+10kg Gürtel'),
        ]},
        { id: 'wo17', name: 'Sprints',    wochentag: 'Fr', typ: 'Konditionierung', uebungen: [
          ue('u42', '400m Repeats', 8, 1, 0, 90, '<72s'),
        ]},
      ],
    },
    {
      id: 'w6', wochennummer: 3, notizen: 'Schärfe-Woche vor Test.',
      workouts: [
        { id: 'wo18', name: 'Sparring Test', wochentag: 'Mo', typ: 'Kampfsport', uebungen: [
          ue('u43', 'Aufwärmen', 3, 3, 0,  60),
          ue('u44', 'Sparring',  6, 3, 0,  90, 'Wettkampftempo'),
        ]},
        { id: 'wo19', name: 'Explosivität', wochentag: 'Mi', typ: 'Krafttraining II', uebungen: [
          ue('u45', 'Power Cleans', 6, 3, 70, 180),
          ue('u46', 'Box Jumps',    5, 5,  0,  90, '60cm'),
        ]},
        { id: 'wo20', name: 'Regeneration', wochentag: 'Fr', typ: 'Mobility', uebungen: [
          ue('u47', 'Foam Rolling', 1, 1, 0, 0, '20 Min gesamt'),
          ue('u48', 'Stretching',   1, 1, 0, 0),
        ]},
        { id: 'wo21', name: 'Liga-Sparring', wochentag: 'Sa', typ: 'Kampfsport', uebungen: [
          ue('u49', 'Wettkampf', 3, 3, 0, 60, 'Volle Intensität'),
        ]},
      ],
    },
  ],
};

const INITIAL_PLAENE: TrainingsPlan[] = [PLAN_ANNA, PLAN_LUKAS];
