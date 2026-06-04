import { create } from 'zustand';
import { EinheitTemplate } from '../types';
import { supabase, uid } from '../lib/supabase';
import { useSettingsStore } from './settingsStore';

type EinheitStoreState = {
  einheiten: EinheitTemplate[];
  hydrate:       (trainerId: string) => Promise<void>;
  reset:         () => void;
  addEinheit:    (data: Omit<EinheitTemplate, 'id'>) => string;
  updateEinheit: (id: string, data: Partial<Omit<EinheitTemplate, 'id'>>) => void;
  deleteEinheit: (id: string) => void;
};

export const useEinheitStore = create<EinheitStoreState>((set) => ({
  einheiten: [],

  hydrate: async (trainerId) => {
    const { data } = await supabase
      .from('einheit_templates')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: true });
    if (data) {
      set({
        einheiten: data.map((row: any) => ({
          id: row.id,
          name: row.name,
          warmup: row.warmup ?? [],
          haupteinheit: row.haupteinheit ?? [],
          cooldown: row.cooldown ?? [],
        })),
      });
    }
  },

  reset: () => set({ einheiten: [] }),

  addEinheit: (data) => {
    const id = uid();
    set((s) => ({ einheiten: [...s.einheiten, { ...data, id }] }));
    const trainerId = useSettingsStore.getState().trainerId;
    supabase.from('einheit_templates').insert({
      id,
      trainer_id: trainerId,
      name: data.name,
      warmup: data.warmup,
      haupteinheit: data.haupteinheit,
      cooldown: data.cooldown,
    });
    return id;
  },

  updateEinheit: (id, data) => {
    set((s) => ({ einheiten: s.einheiten.map((e) => (e.id === id ? { ...e, ...data } : e)) }));
    supabase.from('einheit_templates').update({
      name: data.name,
      warmup: data.warmup,
      haupteinheit: data.haupteinheit,
      cooldown: data.cooldown,
    }).eq('id', id);
  },

  deleteEinheit: (id) => {
    set((s) => ({ einheiten: s.einheiten.filter((e) => e.id !== id) }));
    supabase.from('einheit_templates').delete().eq('id', id);
  },
}));
