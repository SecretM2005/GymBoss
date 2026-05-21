import { create } from 'zustand';
import { UebungTemplate } from '../types';

const INITIAL_UEBUNGEN: UebungTemplate[] = [
  { id: 'ut1', name: 'Bankdrücken',     saetze: 4, wiederholungen: 8,  serienpause: 120 },
  { id: 'ut2', name: 'Kniebeuge',       saetze: 4, wiederholungen: 5,  serienpause: 180 },
  { id: 'ut3', name: 'Kreuzheben',      saetze: 3, wiederholungen: 5,  serienpause: 180 },
  { id: 'ut4', name: 'Schulterdrücken', saetze: 3, wiederholungen: 10, serienpause: 90  },
  { id: 'ut5', name: 'Klimmzüge',       saetze: 3, wiederholungen: 8,  serienpause: 120 },
  { id: 'ut6', name: 'Rudern (Kabel)',  saetze: 4, wiederholungen: 10, serienpause: 90  },
  { id: 'ut7', name: 'Liegestütze',     saetze: 3, wiederholungen: 15, serienpause: 60  },
  { id: 'ut8', name: 'Laufen',          dauer: 600, beschreibung: '10 Min Aufwärmen'    },
  { id: 'ut9', name: 'Rad fahren',      dauer: 900, beschreibung: 'Ergometer'           },
  { id: 'ut10', name: 'Stretching',     dauer: 300                                       },
  { id: 'ut11', name: 'Schattenboxen',  saetze: 5, dauer: 180, serienpause: 60          },
  { id: 'ut12', name: 'Springseil',     saetze: 3, dauer: 120, serienpause: 60          },
];

let _uid = 300;
const uid = () => `ut${++_uid}`;

type UebungState = {
  uebungen: UebungTemplate[];
  addUebung: (data: Omit<UebungTemplate, 'id'>) => string;
  updateUebung: (id: string, data: Omit<UebungTemplate, 'id'>) => void;
  deleteUebung: (id: string) => void;
};

export const useUebungStore = create<UebungState>((set) => ({
  uebungen: INITIAL_UEBUNGEN,

  addUebung: (data) => {
    const id = uid();
    set((s) => ({ uebungen: [...s.uebungen, { ...data, id }] }));
    return id;
  },

  updateUebung: (id, data) =>
    set((s) => ({ uebungen: s.uebungen.map((u) => (u.id === id ? { ...u, ...data } : u)) })),

  deleteUebung: (id) =>
    set((s) => ({ uebungen: s.uebungen.filter((u) => u.id !== id) })),
}));
