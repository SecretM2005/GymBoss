import { create } from 'zustand';
import { WorkoutFeedback } from '../types';

let _uid = 600;
const uid = () => `sl${++_uid}`;

type SessionLogState = {
  logs: WorkoutFeedback[];
  saveLog:              (data: Omit<WorkoutFeedback, 'id'>) => void;
  updateLog:            (id: string, data: Partial<Omit<WorkoutFeedback, 'id'>>) => void;
  getLogForEinheit:     (einheitId: string, sportlerId: string) => WorkoutFeedback | undefined;
  getLogsForSportler:   (sportlerId: string) => WorkoutFeedback[];
};

export const useSessionLogStore = create<SessionLogState>((set, get) => ({
  logs: [],

  saveLog: (data) => {
    const existing = get().logs.find(
      (l) => l.workoutId === data.workoutId && l.sportlerId === data.sportlerId,
    );
    if (existing) {
      set((s) => ({ logs: s.logs.map((l) => (l.id === existing.id ? { ...l, ...data } : l)) }));
    } else {
      const id = uid();
      set((s) => ({ logs: [...s.logs, { ...data, id }] }));
    }
  },

  updateLog: (id, data) =>
    set((s) => ({ logs: s.logs.map((l) => (l.id === id ? { ...l, ...data } : l)) })),

  getLogForEinheit: (einheitId, sportlerId) =>
    get().logs.find((l) => l.workoutId === einheitId && l.sportlerId === sportlerId),

  getLogsForSportler: (sportlerId) =>
    get().logs.filter((l) => l.sportlerId === sportlerId),
}));
