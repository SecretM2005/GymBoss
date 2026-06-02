import { create } from 'zustand';
import { Sportler } from '../types';
import { supabase, uid } from '../lib/supabase';
import { useSettingsStore } from './settingsStore';

function makeInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type AthletenState = {
  sportler: Sportler[];
  hydrate:         (trainerId: string) => Promise<void>;
  reset:           () => void;
  addSportler:     (data: Omit<Sportler, 'id' | 'initials'>) => string;
  updateSportler:  (id: string, data: Omit<Sportler, 'id' | 'initials'>) => void;
  deleteSportler:  (id: string) => void;
  linkProfile:     (id: string, profileId: string) => Promise<void>;
  getSportlerById: (id: string) => Sportler | undefined;
};

export const useAthletenStore = create<AthletenState>((set, get) => ({
  sportler: [],

  hydrate: async (trainerId) => {
    const { data } = await supabase
      .from('athletes')
      .select('*')
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: true });
    if (data) {
      set({
        sportler: data.map((row: any) => ({
          id: row.id,
          name: row.name,
          initials: row.initials,
          geburtsdatum: row.geburtsdatum ?? undefined,
          sportart: row.sportart ?? undefined,
          ziel: row.ziel ?? undefined,
          profileId: row.profile_id ?? undefined,
        })),
      });
    }
  },

  reset: () => set({ sportler: [] }),

  addSportler: (data) => {
    const id = uid();
    const initials = makeInitials(data.name);
    set((s) => ({ sportler: [...s.sportler, { ...data, id, initials }] }));
    const trainerId = useSettingsStore.getState().trainerId;
    supabase.from('athletes').insert({
      id,
      trainer_id: trainerId,
      name: data.name,
      initials,
      sportart: data.sportart ?? null,
      ziel: data.ziel ?? null,
      geburtsdatum: data.geburtsdatum ?? null,
    });
    return id;
  },

  updateSportler: (id, data) => {
    const initials = makeInitials(data.name);
    set((s) => ({
      sportler: s.sportler.map((sp) =>
        sp.id === id ? { ...sp, ...data, initials } : sp
      ),
    }));
    supabase.from('athletes').update({
      name: data.name,
      initials,
      sportart: data.sportart ?? null,
      ziel: data.ziel ?? null,
      geburtsdatum: data.geburtsdatum ?? null,
    }).eq('id', id);
  },

  deleteSportler: (id) => {
    set((s) => ({ sportler: s.sportler.filter((sp) => sp.id !== id) }));
    supabase.from('athletes').delete().eq('id', id);
  },

  linkProfile: async (id, profileId) => {
    const val = profileId || undefined;
    set((s) => ({
      sportler: s.sportler.map((sp) => sp.id === id ? { ...sp, profileId: val } : sp),
    }));
    await supabase.from('athletes').update({ profile_id: profileId || null }).eq('id', id);
  },

  getSportlerById: (id) => get().sportler.find((sp) => sp.id === id),
}));
