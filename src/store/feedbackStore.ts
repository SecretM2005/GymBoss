import { create } from 'zustand';
import { WorkoutFeedback } from '../types';

type FeedbackState = {
  feedbacks: WorkoutFeedback[];
  addFeedback: (f: Omit<WorkoutFeedback, 'id'>) => void;
  updateFeedback: (id: string, updates: Partial<Omit<WorkoutFeedback, 'id'>>) => void;
  deleteFeedback: (id: string) => void;
  getFeedbackForWorkout: (workoutId: string, sportlerId: string) => WorkoutFeedback | undefined;
  getFeedbacksBySpotler: (sportlerId: string) => WorkoutFeedback[];
};

export const useFeedbackStore = create<FeedbackState>((set, get) => ({
  feedbacks: INITIAL_FEEDBACKS,

  addFeedback: (f) =>
    set((s) => ({
      feedbacks: [...s.feedbacks, { ...f, id: Date.now().toString() }],
    })),

  updateFeedback: (id, updates) =>
    set((s) => ({
      feedbacks: s.feedbacks.map((f) => (f.id === id ? { ...f, ...updates } : f)),
    })),

  deleteFeedback: (id) =>
    set((s) => ({ feedbacks: s.feedbacks.filter((f) => f.id !== id) })),

  getFeedbackForWorkout: (workoutId, sportlerId) =>
    get().feedbacks.find((f) => f.workoutId === workoutId && f.sportlerId === sportlerId),

  getFeedbacksBySpotler: (sportlerId) =>
    get().feedbacks.filter((f) => f.sportlerId === sportlerId),
}));

const INITIAL_FEEDBACKS: WorkoutFeedback[] = [
  {
    id: 'fb1',
    workoutId: 'wo1',
    sportlerId: 'u2',
    datum: '2026-04-07',
    bewertung: 4,
    rpe: 7,
    notiz: 'Gut gelaufen, Kniebeugen fühlen sich besser an.',
    abgeschlossen: true,
  },
  {
    id: 'fb2',
    workoutId: 'wo2',
    sportlerId: 'u2',
    datum: '2026-04-09',
    bewertung: 5,
    rpe: 8,
    notiz: 'Super Session! Bankdrücken neues Gewicht geschafft.',
    abgeschlossen: true,
  },
];
