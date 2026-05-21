import { create } from 'zustand';
import { TrainingsPlan, PlanWoche } from '../types';

const INITIAL_PLAENE: TrainingsPlan[] = [
  {
    id: 'p1',
    name: 'Kraftaufbau Basis',
    beschreibung: '12-Wochen Hypertrophieprogramm für Einsteiger',
    sportart: 'Kraftsport',
    sportlerIds: ['s1'],
    trainerId: 't1',
    startdatum: '01.05.2026',
    wochen: [
      { id: 'w1', wochennummer: 1, notizen: 'Eingewöhnung & Technik', workouts: [] },
      { id: 'w2', wochennummer: 2, notizen: 'Volumen steigern', workouts: [] },
      { id: 'w3', wochennummer: 3, notizen: '', workouts: [] },
    ],
  },
  {
    id: 'p2',
    name: 'Wettkampfvorbereitung',
    beschreibung: 'Intensivphase für den Kampfsport-Wettkampf',
    sportart: 'Kampfsport',
    sportlerIds: ['s2'],
    trainerId: 't1',
    startdatum: '15.05.2026',
    wochen: [
      { id: 'w4', wochennummer: 1, notizen: 'Ausdaueraufbau', workouts: [] },
      { id: 'w5', wochennummer: 2, notizen: 'Technikfokus', workouts: [] },
    ],
  },
  {
    id: 'p3',
    name: 'Mobility & Recovery',
    beschreibung: 'Fokus auf Beweglichkeit und aktive Regeneration',
    sportart: 'Mobility',
    sportlerIds: ['s3', 's1'],
    trainerId: 't1',
    startdatum: '01.06.2026',
    wochen: [],
  },
];

let _uid = 200;
const uid = (prefix: string) => `${prefix}${++_uid}`;

type PlanState = {
  plaene: TrainingsPlan[];
  addPlan: (data: Omit<TrainingsPlan, 'id' | 'wochen'>) => string;
  updatePlan: (id: string, data: Partial<Omit<TrainingsPlan, 'id' | 'wochen'>>) => void;
  deletePlan: (id: string) => void;
  getPlanById: (id: string) => TrainingsPlan | undefined;
  getPlaeneForSportler: (sportlerId: string) => TrainingsPlan[];
  addWoche: (planId: string, notizen?: string) => string;
  updateWoche: (planId: string, wocheId: string, notizen: string) => void;
  deleteWoche: (planId: string, wocheId: string) => void;
};

export const usePlanStore = create<PlanState>((set, get) => ({
  plaene: INITIAL_PLAENE,

  addPlan: (data) => {
    const id = uid('p');
    set((s) => ({ plaene: [...s.plaene, { ...data, id, wochen: [] }] }));
    return id;
  },

  updatePlan: (id, data) =>
    set((s) => ({
      plaene: s.plaene.map((p) => (p.id === id ? { ...p, ...data } : p)),
    })),

  deletePlan: (id) =>
    set((s) => ({ plaene: s.plaene.filter((p) => p.id !== id) })),

  getPlanById: (id) => get().plaene.find((p) => p.id === id),

  getPlaeneForSportler: (sportlerId) =>
    get().plaene.filter((p) => p.sportlerIds.includes(sportlerId)),

  addWoche: (planId, notizen = '') => {
    const plan = get().plaene.find((p) => p.id === planId);
    if (!plan) return '';
    const wochennummer = plan.wochen.length + 1;
    const id = uid('w');
    set((s) => ({
      plaene: s.plaene.map((p) =>
        p.id === planId
          ? { ...p, wochen: [...p.wochen, { id, wochennummer, notizen, workouts: [] }] }
          : p
      ),
    }));
    return id;
  },

  updateWoche: (planId, wocheId, notizen) =>
    set((s) => ({
      plaene: s.plaene.map((p) =>
        p.id === planId
          ? { ...p, wochen: p.wochen.map((w) => (w.id === wocheId ? { ...w, notizen } : w)) }
          : p
      ),
    })),

  deleteWoche: (planId, wocheId) =>
    set((s) => ({
      plaene: s.plaene.map((p) =>
        p.id === planId
          ? {
              ...p,
              wochen: p.wochen
                .filter((w) => w.id !== wocheId)
                .map((w, i) => ({ ...w, wochennummer: i + 1 })),
            }
          : p
      ),
    })),
}));
