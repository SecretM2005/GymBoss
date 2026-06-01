import { create } from 'zustand';
import { UebungTemplate } from '../types';

const INITIAL_UEBUNGEN: UebungTemplate[] = [
  { id: 'ut1', name: 'Bankdrücken', muskelgruppe: 'Brust', parameter: [
    { typ: 'serien', wert: '4' },
    { typ: 'wiederholungen', wert: '8' },
    { typ: 'gewicht', wert: '80', einheit: 'kg' },
    { typ: 'serienpause', wert: '120', einheit: 's' },
  ]},
  { id: 'ut2', name: 'Kniebeuge', muskelgruppe: 'Oberschenkel', parameter: [
    { typ: 'serien', wert: '4' },
    { typ: 'wiederholungen', wert: '5' },
    { typ: 'gewicht', wert: '100', einheit: 'kg' },
    { typ: 'serienpause', wert: '180', einheit: 's' },
  ]},
  { id: 'ut3', name: 'Kreuzheben', muskelgruppe: 'Rücken', parameter: [
    { typ: 'serien', wert: '3' },
    { typ: 'wiederholungen', wert: '5' },
    { typ: 'gewicht', wert: '120', einheit: 'kg' },
    { typ: 'serienpause', wert: '180', einheit: 's' },
  ]},
  { id: 'ut4', name: 'Schulterdrücken', muskelgruppe: 'Schultern', parameter: [
    { typ: 'serien', wert: '3' },
    { typ: 'wiederholungen', wert: '10' },
    { typ: 'gewicht', wert: '50', einheit: 'kg' },
    { typ: 'serienpause', wert: '90', einheit: 's' },
  ]},
  { id: 'ut5', name: 'Klimmzüge', muskelgruppe: 'Rücken', parameter: [
    { typ: 'serien', wert: '3' },
    { typ: 'wiederholungen', wert: '8' },
    { typ: 'serienpause', wert: '120', einheit: 's' },
  ]},
  { id: 'ut6', name: 'Liegestütze', muskelgruppe: 'Brust', parameter: [
    { typ: 'serien', wert: '3' },
    { typ: 'wiederholungen', wert: '15' },
    { typ: 'serienpause', wert: '60', einheit: 's' },
  ]},
  { id: 'ut7', name: 'Laufen (Aufwärmen)', muskelgruppe: 'Ganzkörper', parameter: [
    { typ: 'dauer', wert: '10', einheit: 'min' },
  ]},
  { id: 'ut8', name: 'Stretching', muskelgruppe: 'Ganzkörper', parameter: [
    { typ: 'dauer', wert: '5', einheit: 'min' },
  ]},
  { id: 'ut9', name: '400m Intervall', muskelgruppe: 'Oberschenkel', parameter: [
    { typ: 'serien', wert: '6' },
    { typ: 'distanz', wert: '400', einheit: 'm' },
    { typ: 'dauer', wert: '63', einheit: 's' },
    { typ: 'pause', wert: '30', einheit: 's', bezeichnung: 'Trabpause' },
  ]},
  { id: 'ut10', name: 'VO2 Max Intervall', muskelgruppe: 'Ganzkörper', parameter: [
    { typ: 'serien', wert: '5' },
    { typ: 'distanz', wert: '1', einheit: 'km' },
    { typ: 'pause', wert: '3', einheit: 'min', bezeichnung: 'Gehpause' },
  ]},
  { id: 'ut11', name: 'Schattenboxen', muskelgruppe: 'Ganzkörper', parameter: [
    { typ: 'serien', wert: '5' },
    { typ: 'dauer', wert: '3', einheit: 'min' },
    { typ: 'serienpause', wert: '60', einheit: 's' },
  ]},
  { id: 'ut12', name: 'Springseil', muskelgruppe: 'Wade', parameter: [
    { typ: 'serien', wert: '3' },
    { typ: 'dauer', wert: '2', einheit: 'min' },
    { typ: 'serienpause', wert: '60', einheit: 's' },
  ]},
  { id: 'ut13', name: 'Radfahren', muskelgruppe: 'Oberschenkel', parameter: [
    { typ: 'dauer', wert: '45', einheit: 'min' },
  ]},
  { id: 'ut14', name: 'Aufschlag (Tennis)', muskelgruppe: 'Schultern', parameter: [
    { typ: 'serien', wert: '4' },
    { typ: 'wiederholungen', wert: '10' },
    { typ: 'pause', wert: '90', einheit: 's' },
  ]},
  { id: 'ut15', name: 'Kurzhantel-Curl', muskelgruppe: 'Bizeps', parameter: [
    { typ: 'serien', wert: '3' },
    { typ: 'wiederholungen', wert: '12' },
    { typ: 'gewicht', wert: '15', einheit: 'kg' },
    { typ: 'serienpause', wert: '60', einheit: 's' },
  ]},
  { id: 'ut16', name: 'Trizeps-Dips', muskelgruppe: 'Trizeps', parameter: [
    { typ: 'serien', wert: '3' },
    { typ: 'wiederholungen', wert: '10' },
    { typ: 'serienpause', wert: '90', einheit: 's' },
  ]},
  { id: 'ut17', name: 'Plank', muskelgruppe: 'Bauch', parameter: [
    { typ: 'serien', wert: '3' },
    { typ: 'dauer', wert: '60', einheit: 's' },
    { typ: 'serienpause', wert: '30', einheit: 's' },
  ]},
  { id: 'ut18', name: 'Hip Thrust', muskelgruppe: 'Gesäß', parameter: [
    { typ: 'serien', wert: '4' },
    { typ: 'wiederholungen', wert: '12' },
    { typ: 'gewicht', wert: '60', einheit: 'kg' },
    { typ: 'serienpause', wert: '90', einheit: 's' },
  ]},
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
