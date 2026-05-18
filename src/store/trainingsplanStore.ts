import { create } from 'zustand';
import { Trainingsplan, PlanUebung } from '../types';

type TrainingsplanState = {
  plaene: Trainingsplan[];
  addPlan: (p: Omit<Trainingsplan, 'id' | 'erstellt'>) => void;
  updatePlan: (id: string, updates: Partial<Omit<Trainingsplan, 'id'>>) => void;
  deletePlan: (id: string) => void;
  getPlanById: (id: string) => Trainingsplan | undefined;
  getPlaeneByKundeId: (kundeId: string) => Trainingsplan[];
};

export const useTrainingsplanStore = create<TrainingsplanState>((set, get) => ({
  plaene: INITIAL_PLAENE,

  addPlan: (p) =>
    set((s) => ({
      plaene: [
        { ...p, id: Date.now().toString(), erstellt: new Date().toISOString().split('T')[0] },
        ...s.plaene,
      ],
    })),

  updatePlan: (id, updates) =>
    set((s) => ({ plaene: s.plaene.map((p) => (p.id === id ? { ...p, ...updates } : p)) })),

  deletePlan: (id) =>
    set((s) => ({ plaene: s.plaene.filter((p) => p.id !== id) })),

  getPlanById: (id) => get().plaene.find((p) => p.id === id),

  getPlaeneByKundeId: (kundeId) => get().plaene.filter((p) => p.kundeId === kundeId),
}));

function ue(id: string, name: string, saetze: number, wdh: number, gewicht: number | undefined, pause: number): PlanUebung {
  return { id, name, saetze, wiederholungen: wdh, gewicht, pause };
}

const INITIAL_PLAENE: Trainingsplan[] = [
  {
    id: '1',
    name: 'Ganzkörper Basis',
    kundeId: '1',
    schwierigkeitsgrad: 'Anfänger',
    erstellt: '2024-01-20',
    notizen: 'Einsteigerprogramm für 3x pro Woche.',
    uebungen: [
      ue('1a', 'Kniebeugen',       3, 12, 40,        90),
      ue('1b', 'Bankdrücken',      3, 10, 30,        90),
      ue('1c', 'Rudern am Kabel',  3, 12, 25,        60),
      ue('1d', 'Plank',            3,  1, undefined,  60),
    ],
  },
  {
    id: '2',
    name: 'Upper / Lower Split',
    kundeId: '2',
    schwierigkeitsgrad: 'Fortgeschritten',
    erstellt: '2024-03-25',
    uebungen: [
      ue('2a', 'Bankdrücken',          4,  8, 80, 120),
      ue('2b', 'Klimmzüge',            4,  8, undefined, 120),
      ue('2c', 'Schulterdrücken',      3, 10, 50,  90),
      ue('2d', 'Kniebeugen',           4,  8, 100, 120),
      ue('2e', 'Rumänisches Kreuzheben',3, 10, 70,  90),
      ue('2f', 'Beinpresse',           3, 12, 120,  90),
    ],
  },
  {
    id: '3',
    name: 'Core & Mobility',
    kundeId: undefined,
    schwierigkeitsgrad: 'Anfänger',
    erstellt: '2024-02-15',
    notizen: 'Template – kein fester Kunde.',
    uebungen: [
      ue('3a', 'Plank',              3,  1, undefined, 45),
      ue('3b', 'Bird-Dog',           3, 10, undefined, 45),
      ue('3c', 'Glute Bridge',       3, 15, undefined, 45),
      ue('3d', 'Dead Bug',           3, 10, undefined, 45),
    ],
  },
];
