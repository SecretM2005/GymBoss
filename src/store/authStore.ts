import { create } from 'zustand';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

export type UserProfile = {
  id: string;
  role: 'trainer' | 'sportler';
  name: string;
  initials: string;
};

type AuthState = {
  session:      Session | null;
  user:         User | null;
  profile:      UserProfile | null;
  initializing: boolean;
  setSession:      (session: Session | null) => void;
  setProfile:      (profile: UserProfile | null) => void;
  setInitializing: (v: boolean) => void;
  signOut:         () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  session:      null,
  user:         null,
  profile:      null,
  initializing: true,

  setSession: (session) =>
    set({ session, user: session?.user ?? null }),

  setProfile: (profile) => set({ profile }),

  setInitializing: (initializing) => set({ initializing }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ session: null, user: null, profile: null });
  },
}));
