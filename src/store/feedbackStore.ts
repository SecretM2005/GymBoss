import { create } from 'zustand';

export type Feedback = {
  id: string;
  planId: string;
  einheitName: string;
  sportlerId: string;
  datum: string; // ISO date "2026-05-20"
  bewertung: number; // 1–5 stars
  rpe: number;       // 1–10
  notiz?: string;
};

const INITIAL_FEEDBACK: Feedback[] = [
  {
    id: 'fb1',
    planId: 'p1',
    einheitName: 'Oberkörper A',
    sportlerId: 's1',
    datum: '2026-05-20',
    bewertung: 4,
    rpe: 7,
    notiz: 'Bankdrücken fühlt sich viel besser an, Schultern noch leicht steif',
  },
  {
    id: 'fb2',
    planId: 'p2',
    einheitName: 'Intervall-Lauf',
    sportlerId: 's2',
    datum: '2026-05-19',
    bewertung: 3,
    rpe: 9,
    notiz: 'War sehr anstrengend heute, Beine schmerzen',
  },
  {
    id: 'fb3',
    planId: 'p3',
    einheitName: 'Mobility Session',
    sportlerId: 's3',
    datum: '2026-05-18',
    bewertung: 5,
    rpe: 4,
    notiz: 'Super entspannt, genau das Richtige nach dem Wettkampf',
  },
  {
    id: 'fb4',
    planId: 'p1',
    einheitName: 'Unterkörper A',
    sportlerId: 's1',
    datum: '2026-05-17',
    bewertung: 2,
    rpe: 8,
    notiz: 'Knie hat etwas gezwickt, Gewicht reduziert',
  },
  {
    id: 'fb5',
    planId: 'p2',
    einheitName: 'Schattenboxen',
    sportlerId: 's2',
    datum: '2026-05-15',
    bewertung: 5,
    rpe: 6,
  },
];

type FeedbackState = {
  feedback: Feedback[];
  addFeedback: (data: Omit<Feedback, 'id'>) => void;
  deleteFeedback: (id: string) => void;
};

let _uid = 100;

export const useFeedbackStore = create<FeedbackState>((set) => ({
  feedback: INITIAL_FEEDBACK,

  addFeedback: (data) => {
    const id = `fb${++_uid}`;
    set((s) => ({ feedback: [{ ...data, id }, ...s.feedback] }));
  },

  deleteFeedback: (id) =>
    set((s) => ({ feedback: s.feedback.filter((f) => f.id !== id) })),
}));
