import { create } from 'zustand';
import { Termin } from '../types';

type TerminState = {
  termine: Termin[];
  addTermin: (t: Omit<Termin, 'id'>) => void;
  updateTermin: (id: string, updates: Partial<Omit<Termin, 'id'>>) => void;
  deleteTermin: (id: string) => void;
  getTerminById: (id: string) => Termin | undefined;
  getTermineByDatum: (datum: string) => Termin[];
  getTermineByKundeId: (kundeId: string) => Termin[];
};

export const useTerminStore = create<TerminState>((set, get) => ({
  termine: INITIAL_TERMINE,

  addTermin: (t) =>
    set((s) => ({ termine: [...s.termine, { ...t, id: Date.now().toString() }] })),

  updateTermin: (id, updates) =>
    set((s) => ({ termine: s.termine.map((t) => (t.id === id ? { ...t, ...updates } : t)) })),

  deleteTermin: (id) =>
    set((s) => ({ termine: s.termine.filter((t) => t.id !== id) })),

  getTerminById: (id) => get().termine.find((t) => t.id === id),

  getTermineByDatum: (datum) =>
    get()
      .termine.filter((t) => t.datum === datum)
      .sort((a, b) => a.uhrzeit.localeCompare(b.uhrzeit)),

  getTermineByKundeId: (kundeId) =>
    get().termine.filter((t) => t.kundeId === kundeId),
}));

const INITIAL_TERMINE: Termin[] = [
  {
    id: '1',
    kundeId: '1',
    titel: 'Personal Training',
    datum: '2026-05-18',
    uhrzeit: '09:00',
    dauer: 60,
    notizen: 'Fokus Oberkörper, Knie schonen.',
  },
  {
    id: '2',
    kundeId: '2',
    titel: 'Erstgespräch',
    datum: '2026-05-18',
    uhrzeit: '11:00',
    dauer: 30,
  },
  {
    id: '3',
    kundeId: '3',
    titel: 'Personal Training',
    datum: '2026-05-20',
    uhrzeit: '10:00',
    dauer: 60,
    notizen: 'Laufvorbereitung.',
  },
  {
    id: '4',
    kundeId: '5',
    titel: 'Gruppentraining',
    datum: '2026-05-22',
    uhrzeit: '14:00',
    dauer: 45,
  },
  {
    id: '5',
    kundeId: '1',
    titel: 'Personal Training',
    datum: '2026-05-25',
    uhrzeit: '09:00',
    dauer: 60,
  },
];
