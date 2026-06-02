import { create } from 'zustand';
import { WorkoutFeedback } from '../types';
import { supabase, uid } from '../lib/supabase';

type SessionLogState = {
  logs: WorkoutFeedback[];
  hydrate:            (athleteId: string) => Promise<void>;
  reset:              () => void;
  saveLog:            (data: Omit<WorkoutFeedback, 'id'>) => void;
  updateLog:          (id: string, data: Partial<Omit<WorkoutFeedback, 'id'>>) => void;
  getLogForEinheit:   (einheitId: string, sportlerId: string) => WorkoutFeedback | undefined;
  getLogsForSportler: (sportlerId: string) => WorkoutFeedback[];
};

export const useSessionLogStore = create<SessionLogState>((set, get) => ({
  logs: [],

  hydrate: async (athleteId) => {
    const { data } = await supabase
      .from('session_logs')
      .select('*')
      .eq('athlete_id', athleteId)
      .order('created_at', { ascending: true });
    if (data) {
      set({
        logs: data.map((row) => ({
          id: row.id,
          workoutId: row.einheit_id,
          sportlerId: row.athlete_id,
          datum: row.datum,
          bewertung: row.bewertung,
          rpe: row.rpe,
          notiz: row.notiz ?? undefined,
          abgeschlossen: row.abgeschlossen,
        })),
      });
    }
  },

  reset: () => set({ logs: [] }),

  saveLog: (data) => {
    const existing = get().logs.find(
      (l) => l.workoutId === data.workoutId && l.sportlerId === data.sportlerId,
    );
    if (existing) {
      set((s) => ({ logs: s.logs.map((l) => (l.id === existing.id ? { ...l, ...data } : l)) }));
      supabase.from('session_logs').update({
        bewertung: data.bewertung,
        rpe: data.rpe,
        notiz: data.notiz ?? null,
        abgeschlossen: data.abgeschlossen,
      }).eq('id', existing.id);
    } else {
      const id = uid();
      set((s) => ({ logs: [...s.logs, { ...data, id }] }));
      supabase.from('session_logs').insert({
        id,
        einheit_id: data.workoutId,
        athlete_id: data.sportlerId,
        workout_id: data.workoutId,
        datum: data.datum,
        bewertung: data.bewertung,
        rpe: data.rpe,
        notiz: data.notiz ?? null,
        abgeschlossen: data.abgeschlossen,
      });
    }
  },

  updateLog: (id, data) => {
    set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...data } : l)) }));
    const updates: any = {};
    if (data.bewertung !== undefined)    updates.bewertung = data.bewertung;
    if (data.rpe !== undefined)          updates.rpe = data.rpe;
    if (data.notiz !== undefined)        updates.notiz = data.notiz ?? null;
    if (data.abgeschlossen !== undefined) updates.abgeschlossen = data.abgeschlossen;
    if (Object.keys(updates).length > 0) {
      supabase.from('session_logs').update(updates).eq('id', id);
    }
  },

  getLogForEinheit: (einheitId, sportlerId) =>
    get().logs.find((l) => l.workoutId === einheitId && l.sportlerId === sportlerId),

  getLogsForSportler: (sportlerId) =>
    get().logs.filter((l) => l.sportlerId === sportlerId),
}));
