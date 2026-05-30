import { create } from 'zustand';
import { EinheitTemplate } from '../types';

const INITIAL_EINHEITEN: EinheitTemplate[] = [
  {
    id: 'et1',
    name: 'Oberkörper A',
    warmup: [
      { id: 'eu1', name: 'Laufen (Aufwärmen)', parameter: [{ typ: 'dauer', wert: '10', einheit: 'min' }] },
    ],
    haupteinheit: [
      { id: 'eu2', name: 'Bankdrücken', parameter: [
        { typ: 'serien', wert: '4' }, { typ: 'wiederholungen', wert: '8' },
        { typ: 'gewicht', wert: '80', einheit: 'kg' }, { typ: 'serienpause', wert: '120', einheit: 's' },
      ]},
      { id: 'eu3', name: 'Schulterdrücken', parameter: [
        { typ: 'serien', wert: '3' }, { typ: 'wiederholungen', wert: '10' },
        { typ: 'gewicht', wert: '50', einheit: 'kg' }, { typ: 'serienpause', wert: '90', einheit: 's' },
      ]},
      { id: 'eu4', name: 'Klimmzüge', parameter: [
        { typ: 'serien', wert: '3' }, { typ: 'wiederholungen', wert: '8' },
        { typ: 'serienpause', wert: '120', einheit: 's' },
      ]},
    ],
    cooldown: [
      { id: 'eu5', name: 'Stretching', parameter: [{ typ: 'dauer', wert: '5', einheit: 'min' }] },
    ],
  },
  {
    id: 'et2',
    name: 'Unterkörper A',
    warmup: [
      { id: 'eu6', name: 'Radfahren', parameter: [{ typ: 'dauer', wert: '10', einheit: 'min' }] },
    ],
    haupteinheit: [
      { id: 'eu7', name: 'Kniebeuge', parameter: [
        { typ: 'serien', wert: '4' }, { typ: 'wiederholungen', wert: '5' },
        { typ: 'gewicht', wert: '100', einheit: 'kg' }, { typ: 'serienpause', wert: '180', einheit: 's' },
      ]},
      { id: 'eu8', name: 'Kreuzheben', parameter: [
        { typ: 'serien', wert: '3' }, { typ: 'wiederholungen', wert: '5' },
        { typ: 'gewicht', wert: '120', einheit: 'kg' }, { typ: 'serienpause', wert: '180', einheit: 's' },
      ]},
    ],
    cooldown: [
      { id: 'eu9', name: 'Stretching', parameter: [{ typ: 'dauer', wert: '5', einheit: 'min' }] },
    ],
  },
  {
    id: 'et3',
    name: 'Intervall-Lauf',
    warmup: [
      { id: 'eu10', name: 'Laufen (Aufwärmen)', parameter: [{ typ: 'dauer', wert: '10', einheit: 'min' }] },
    ],
    haupteinheit: [
      { id: 'eu11', name: '400m Intervall', parameter: [
        { typ: 'serien', wert: '6' }, { typ: 'distanz', wert: '400', einheit: 'm' },
        { typ: 'dauer', wert: '63', einheit: 's' }, { typ: 'pause', wert: '30', einheit: 's', bezeichnung: 'Trabpause' },
      ]},
    ],
    cooldown: [
      { id: 'eu12', name: 'Stretching', parameter: [{ typ: 'dauer', wert: '5', einheit: 'min' }] },
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
