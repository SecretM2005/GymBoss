import { create } from 'zustand';
import { EinheitTemplate } from '../types';

const INITIAL_EINHEITEN: EinheitTemplate[] = [
  {
    id: 'et1',
    name: 'Oberkörper A',
    warmup: [
      { id: 'eu1', name: 'Laufen', dauer: 600 },
    ],
    haupteinheit: [
      { id: 'eu2', name: 'Bankdrücken',     saetze: 4, wiederholungen: 8,  serienpause: 120 },
      { id: 'eu3', name: 'Schulterdrücken', saetze: 3, wiederholungen: 10, serienpause: 90  },
      { id: 'eu4', name: 'Klimmzüge',       saetze: 3, wiederholungen: 8,  serienpause: 120 },
    ],
    cooldown: [
      { id: 'eu5', name: 'Stretching', dauer: 300 },
    ],
  },
  {
    id: 'et2',
    name: 'Unterkörper A',
    warmup: [
      { id: 'eu6', name: 'Rad fahren', dauer: 600 },
    ],
    haupteinheit: [
      { id: 'eu7', name: 'Kniebeuge',  saetze: 4, wiederholungen: 5, serienpause: 180 },
      { id: 'eu8', name: 'Kreuzheben', saetze: 3, wiederholungen: 5, serienpause: 180 },
    ],
    cooldown: [
      { id: 'eu9', name: 'Stretching', dauer: 300 },
    ],
  },
  {
    id: 'et3',
    name: 'Kampfsport Kondition',
    warmup: [
      { id: 'eu10', name: 'Springseil', saetze: 3, dauer: 120, serienpause: 60 },
    ],
    haupteinheit: [
      { id: 'eu11', name: 'Schattenboxen', saetze: 5, dauer: 180, serienpause: 60 },
      { id: 'eu12', name: 'Liegestütze',   saetze: 3, wiederholungen: 15, serienpause: 60 },
    ],
    cooldown: [
      { id: 'eu13', name: 'Stretching', dauer: 300 },
    ],
  },
];

let _uid = 400;
const uid = () => `et${++_uid}`;

type EinheitStoreState = {
  einheiten: EinheitTemplate[];
  addEinheit: (data: Omit<EinheitTemplate, 'id'>) => string;
  updateEinheit: (id: string, data: Partial<Omit<EinheitTemplate, 'id'>>) => void;
  deleteEinheit: (id: string) => void;
};

export const useEinheitStore = create<EinheitStoreState>((set) => ({
  einheiten: INITIAL_EINHEITEN,

  addEinheit: (data) => {
    const id = uid();
    set((s) => ({ einheiten: [...s.einheiten, { ...data, id }] }));
    return id;
  },

  updateEinheit: (id, data) =>
    set((s) => ({ einheiten: s.einheiten.map((e) => (e.id === id ? { ...e, ...data } : e)) })),

  deleteEinheit: (id) =>
    set((s) => ({ einheiten: s.einheiten.filter((e) => e.id !== id) })),
}));
