import { create } from 'zustand';
import { supabase, uid } from '../lib/supabase';

export type Nachricht = {
  id: string;
  senderId: string;
  senderName: string;
  empfaengerId: string;
  planId?: string;
  einheitId?: string;
  text: string;
  datum: string;
  gelesen: boolean;
};

function rowToNachricht(row: any): Nachricht {
  return {
    id: row.id,
    senderId: row.sender_id,
    senderName: row.sender_name,
    empfaengerId: row.empfaenger_id,
    planId: row.plan_id ?? undefined,
    einheitId: row.einheit_id ?? undefined,
    text: row.text,
    datum: row.datum,
    gelesen: row.gelesen,
  };
}

type NachrichtenState = {
  nachrichten: Nachricht[];
  hydrate:        (userId: string) => Promise<void>;
  reset:          () => void;
  sendNachricht:  (data: Omit<Nachricht, 'id' | 'datum' | 'gelesen'>) => void;
  markAsRead:     (id: string) => void;
  markAllAsRead:  (empfaengerId: string) => void;
  getNachrichtenForChat: (userId1: string, userId2: string, planId?: string) => Nachricht[];
  getUnreadCount: (empfaengerId: string) => number;
};

export const useNachrichtenStore = create<NachrichtenState>((set, get) => ({
  nachrichten: [],

  hydrate: async (userId) => {
    const { data } = await supabase
      .from('nachrichten')
      .select('*')
      .or(`sender_id.eq.${userId},empfaenger_id.eq.${userId}`)
      .order('datum', { ascending: true });
    if (data) {
      set({ nachrichten: data.map(rowToNachricht) });
    }

    // Real-time subscription for incoming messages
    supabase
      .channel(`nachrichten_${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'nachrichten',
          filter: `empfaenger_id=eq.${userId}`,
        },
        (payload: { new: any }) => {
          const msg = rowToNachricht(payload.new);
          set((s) => {
            // avoid duplicates (optimistic insert already added it for sender)
            if (s.nachrichten.some((m) => m.id === msg.id)) return s;
            return { nachrichten: [...s.nachrichten, msg] };
          });
        }
      )
      .subscribe();
  },

  reset: () => {
    supabase.removeAllChannels();
    set({ nachrichten: [] });
  },

  sendNachricht: (data) => {
    const id = uid();
    const msg: Nachricht = { ...data, id, datum: new Date().toISOString(), gelesen: false };
    set((s) => ({ nachrichten: [...s.nachrichten, msg] }));
    supabase.from('nachrichten').insert({
      id: msg.id,
      sender_id: data.senderId,
      sender_name: data.senderName,
      empfaenger_id: data.empfaengerId,
      plan_id: data.planId ?? null,
      einheit_id: data.einheitId ?? null,
      text: data.text,
      gelesen: false,
    });
  },

  markAsRead: (id) => {
    set((s) => ({
      nachrichten: s.nachrichten.map((m) => (m.id === id ? { ...m, gelesen: true } : m)),
    }));
    supabase.from('nachrichten').update({ gelesen: true }).eq('id', id);
  },

  markAllAsRead: (empfaengerId) => {
    const ids = get().nachrichten
      .filter((m) => m.empfaengerId === empfaengerId && !m.gelesen)
      .map((m) => m.id);
    set((s) => ({
      nachrichten: s.nachrichten.map((m) =>
        m.empfaengerId === empfaengerId ? { ...m, gelesen: true } : m,
      ),
    }));
    if (ids.length > 0) {
      supabase.from('nachrichten').update({ gelesen: true }).in('id', ids);
    }
  },

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
