import { create } from 'zustand';
import { Kunde } from '../types';

type KundenState = {
  kunden: Kunde[];
  addKunde: (kunde: Omit<Kunde, 'id'>) => void;
  updateKunde: (id: string, updates: Partial<Omit<Kunde, 'id'>>) => void;
  deleteKunde: (id: string) => void;
  getKundeById: (id: string) => Kunde | undefined;
};

export const useKundenStore = create<KundenState>((set, get) => ({
  kunden: INITIAL_KUNDEN,

  addKunde: (kunde) =>
    set((state) => ({
      kunden: [{ ...kunde, id: Date.now().toString() }, ...state.kunden],
    })),

  updateKunde: (id, updates) =>
    set((state) => ({
      kunden: state.kunden.map((k) => (k.id === id ? { ...k, ...updates } : k)),
    })),

  deleteKunde: (id) =>
    set((state) => ({ kunden: state.kunden.filter((k) => k.id !== id) })),

  getKundeById: (id) => get().kunden.find((k) => k.id === id),
}));

const INITIAL_KUNDEN: Kunde[] = [
  {
    id: '1',
    vorname: 'Anna',
    nachname: 'Müller',
    email: 'anna.mueller@email.de',
    telefon: '+49 151 23456789',
    status: 'aktiv',
    eintrittsdatum: '2024-01-15',
    notizen: 'Fokus auf Kraft. Knieprobleme beachten.',
  },
  {
    id: '2',
    vorname: 'Thomas',
    nachname: 'Bauer',
    email: 'thomas.bauer@email.de',
    telefon: '+49 172 98765432',
    status: 'aktiv',
    eintrittsdatum: '2024-03-20',
  },
  {
    id: '3',
    vorname: 'Sophie',
    nachname: 'Wagner',
    email: 'sophie.wagner@gmail.com',
    telefon: '+49 160 11223344',
    status: 'aktiv',
    eintrittsdatum: '2024-02-10',
    notizen: 'Vorbereitung Halbmarathon.',
  },
  {
    id: '4',
    vorname: 'Jan',
    nachname: 'Koch',
    email: 'jan.koch@web.de',
    telefon: '+49 176 55667788',
    status: 'inaktiv',
    eintrittsdatum: '2023-11-05',
    notizen: 'Mitgliedschaft pausiert bis März.',
  },
  {
    id: '5',
    vorname: 'Laura',
    nachname: 'Schneider',
    email: 'laura.schneider@outlook.de',
    telefon: '+49 157 44332211',
    status: 'aktiv',
    eintrittsdatum: '2024-04-08',
  },
];
