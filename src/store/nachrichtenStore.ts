import { create } from 'zustand';

export type Nachricht = {
  id: string;
  senderId: string;
  senderName: string;
  empfaengerId: string;
  planId?: string;
  einheitId?: string;
  text: string;
  datum: string; // ISO
  gelesen: boolean;
};

let _uid = 900;
const uid = () => `msg${++_uid}`;

const now = () => new Date().toISOString();

const INITIAL_NACHRICHTEN: Nachricht[] = [
  {
    id: 'msg1',
    senderId: 't1',
    senderName: 'Trainer',
    empfaengerId: 's1',
    planId: 'p1',
    text: 'Gute Leistung diese Woche! Denk daran, die Technik beim Kreuzheben zu fokussieren.',
    datum: new Date(Date.now() - 2 * 86400000).toISOString(),
    gelesen: true,
  },
  {
    id: 'msg2',
    senderId: 's1',
    senderName: 'Max Müller',
    empfaengerId: 't1',
    planId: 'p1',
    text: 'Danke! Hatte leichte Knieschmerzen beim Kniebeuge. Soll ich Gewicht reduzieren?',
    datum: new Date(Date.now() - 1 * 86400000).toISOString(),
    gelesen: false,
  },
  {
    id: 'msg3',
    senderId: 't1',
    senderName: 'Trainer',
    empfaengerId: 's1',
    planId: 'p1',
    text: 'Ja, reduziere auf 70% und fokussiere auf Bewegungsqualität. Ich schau es mir nächste Woche an.',
    datum: new Date(Date.now() - 3600000).toISOString(),
    gelesen: false,
  },
];

type NachrichtenState = {
  nachrichten: Nachricht[];
  sendNachricht: (data: Omit<Nachricht, 'id' | 'datum' | 'gelesen'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: (empfaengerId: string) => void;
  getNachrichtenForChat: (userId1: string, userId2: string, planId?: string) => Nachricht[];
  getUnreadCount: (empfaengerId: string) => number;
};

export const useNachrichtenStore = create<NachrichtenState>((set, get) => ({
  nachrichten: INITIAL_NACHRICHTEN,

  sendNachricht: (data) => {
    set((s) => ({
      nachrichten: [...s.nachrichten, { ...data, id: uid(), datum: now(), gelesen: false }],
    }));
  },

  markAsRead: (id) =>
    set((s) => ({
      nachrichten: s.nachrichten.map((m) => (m.id === id ? { ...m, gelesen: true } : m)),
    })),

  markAllAsRead: (empfaengerId) =>
    set((s) => ({
      nachrichten: s.nachrichten.map((m) =>
        m.empfaengerId === empfaengerId ? { ...m, gelesen: true } : m,
      ),
    })),

  getNachrichtenForChat: (userId1, userId2, planId) =>
    get()
      .nachrichten.filter(
        (m) =>
          ((m.senderId === userId1 && m.empfaengerId === userId2) ||
            (m.senderId === userId2 && m.empfaengerId === userId1)) &&
          (planId === undefined || m.planId === planId),
      )
      .sort((a, b) => a.datum.localeCompare(b.datum)),

  getUnreadCount: (empfaengerId) =>
    get().nachrichten.filter((m) => m.empfaengerId === empfaengerId && !m.gelesen).length,
}));
