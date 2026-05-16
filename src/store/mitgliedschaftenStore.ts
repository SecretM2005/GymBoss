import { create } from 'zustand';
import { Mitgliedschaft, MitgliedschaftStatus } from '../types';

/** Berechnet den effektiven Status anhand des Enddatums. */
export function getEffectiveStatus(m: Mitgliedschaft): MitgliedschaftStatus {
  if (m.status === 'gekuendigt') return 'gekuendigt';
  const today = new Date().toISOString().split('T')[0];
  return m.enddatum < today ? 'abgelaufen' : 'aktiv';
}

/** Addiert N Monate zu einem ISO-Datum und gibt das Ergebnis zurück. */
export function addMonths(isoDate: string, months: number): string {
  const d = new Date(isoDate);
  d.setMonth(d.getMonth() + months);
  return d.toISOString().split('T')[0];
}

type MitgliedschaftenState = {
  mitgliedschaften: Mitgliedschaft[];
  addMitgliedschaft: (m: Omit<Mitgliedschaft, 'id'>) => void;
  updateMitgliedschaft: (id: string, updates: Partial<Omit<Mitgliedschaft, 'id'>>) => void;
  deleteMitgliedschaft: (id: string) => void;
  getMitgliedschaftById: (id: string) => Mitgliedschaft | undefined;
  getMitgliedschaftenByKundeId: (kundeId: string) => Mitgliedschaft[];
};

export const useMitgliedschaftenStore = create<MitgliedschaftenState>((set, get) => ({
  mitgliedschaften: INITIAL_MITGLIEDSCHAFTEN,

  addMitgliedschaft: (m) =>
    set((state) => ({
      mitgliedschaften: [{ ...m, id: Date.now().toString() }, ...state.mitgliedschaften],
    })),

  updateMitgliedschaft: (id, updates) =>
    set((state) => ({
      mitgliedschaften: state.mitgliedschaften.map((m) =>
        m.id === id ? { ...m, ...updates } : m
      ),
    })),

  deleteMitgliedschaft: (id) =>
    set((state) => ({
      mitgliedschaften: state.mitgliedschaften.filter((m) => m.id !== id),
    })),

  getMitgliedschaftById: (id) => get().mitgliedschaften.find((m) => m.id === id),

  getMitgliedschaftenByKundeId: (kundeId) =>
    get().mitgliedschaften.filter((m) => m.kundeId === kundeId),
}));

// Beispieldaten – verknüpft mit den 5 Kunden aus kundenStore (IDs '1'–'5')
const INITIAL_MITGLIEDSCHAFTEN: Mitgliedschaft[] = [
  {
    id: '1',
    kundeId: '1', // Anna Müller
    typ: 'Premium',
    preis: 89,
    startdatum: '2024-01-15',
    enddatum: '2025-01-14',
    status: 'aktiv',
  },
  {
    id: '2',
    kundeId: '2', // Thomas Bauer
    typ: 'Basic',
    preis: 39,
    startdatum: '2024-03-20',
    enddatum: '2025-03-19',
    status: 'aktiv',
  },
  {
    id: '3',
    kundeId: '3', // Sophie Wagner
    typ: 'Premium',
    preis: 89,
    startdatum: '2024-02-10',
    enddatum: '2025-02-09',
    status: 'aktiv',
  },
  {
    id: '4',
    kundeId: '4', // Jan Koch
    typ: 'Basic',
    preis: 39,
    startdatum: '2023-11-05',
    enddatum: '2024-11-04',
    status: 'gekuendigt',
  },
  {
    id: '5',
    kundeId: '5', // Laura Schneider
    typ: 'Basic',
    preis: 39,
    startdatum: '2024-04-08',
    enddatum: '2025-04-07',
    status: 'aktiv',
  },
];
