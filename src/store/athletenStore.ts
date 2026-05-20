import { create } from 'zustand';
import { Sportler } from '../types';

const INITIAL_SPORTLER: Sportler[] = [
  { id: 's1', name: 'Anna Berger',  initials: 'AB', alter: 28, sportart: 'Kraftsport',  ziel: 'Kraftaufbau' },
  { id: 's2', name: 'Lukas Reiter', initials: 'LR', alter: 24, sportart: 'Kampfsport',  ziel: 'Wettkampfvorbereitung' },
  { id: 's3', name: 'Sophie Kern',  initials: 'SK', alter: 31, sportart: 'Mobility',    ziel: 'Beweglichkeit & Regeneration' },
];

let _uid = 100;
const uid = () => `s${++_uid}`;

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AthletenState = {
  sportler: Sportler[];
  addSportler:    (data: Omit<Sportler, 'id' | 'initials'>) => string;
  updateSportler: (id: string, data: Omit<Sportler, 'id' | 'initials'>) => void;
  deleteSportler: (id: string) => void;
  getSportlerById: (id: string) => Sportler | undefined;
};

export const useAthletenStore = create<AthletenState>((set, get) => ({
  sportler: INITIAL_SPORTLER,

  addSportler: (data) => {
    const id = uid();
    set((s) => ({ sportler: [...s.sportler, { ...data, id, initials: makeInitials(data.name) }] }));
    return id;
  },

  updateSportler: (id, data) =>
    set((s) => ({
      sportler: s.sportler.map((sp) =>
        sp.id === id ? { ...sp, ...data, initials: makeInitials(data.name) } : sp
      ),
    })),

  deleteSportler: (id) =>
    set((s) => ({ sportler: s.sportler.filter((sp) => sp.id !== id) })),

  getSportlerById: (id) => get().sportler.find((sp) => sp.id === id),
}));
