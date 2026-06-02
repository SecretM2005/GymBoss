import { create } from 'zustand';
import { UebungTemplate } from '../types';
import { supabase, uid } from '../lib/supabase';
import { useSettingsStore } from './settingsStore';

type UebungState = {
  uebungen: UebungTemplate[];
  hydrate:      (trainerId: string) => Promise<void>;
  reset:        () => void;
  addUebung:    (data: Omit<UebungTemplate, 'id'>) => string;
  updateUebung: (id: string, data: Omit<UebungTemplate, 'id'>) => void;
  deleteUebung: (id: string) => void;
};

export const useUebungStore = create<UebungState>((set) => ({
  uebungen: [],

  hydrate: async (trainerId) => {
    const { data } = await supabase
      .from('uebung_templates')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: true });
    if (data) {
      set({
        uebungen: data.map((row: any) => ({
          id: row.id,
          name: row.name,
          beschreibung: row.beschreibung ?? undefined,
          parameter: row.parameter ?? [],
        })),
      });
    }
  },

  reset: () => set({ uebungen: [] }),

  addUebung: (data) => {
    const id = uid();
    set((s) => ({ uebungen: [...s.uebungen, { ...data, id }] }));
    const trainerId = useSettingsStore.getState().trainerId;
    supabase.from('uebung_templates').insert({
      id,
      trainer_id: trainerId,
      name: data.name,
      beschreibung: data.beschreibung ?? null,
      parameter: data.parameter,
    });
    return id;
  },

  updateUebung: (id, data) => {
    set((s) => ({ uebungen: s.uebungen.map((u) => (u.id === id ? { ...u, ...data } : u)) }));
    supabase.from('uebung_templates').update({
      name: data.name,
      beschreibung: data.beschreibung ?? null,
      parameter: data.parameter,
    }).eq('id', id);
  },

  deleteUebung: (id) => {
    set((s) => ({ uebungen: s.uebungen.filter((u) => u.id !== id) }));
    supabase.from('uebung_templates').delete().eq('id', id);
  },
}));
