import { create } from 'zustand';
import { AppUser, UserRole } from '../types';

const INITIAL_USERS: AppUser[] = [
  { id: 'u1', name: 'Marcus Hoffmann', initials: 'MH', role: 'trainer',  spec: 'Kraft & Kampfsport' },
  { id: 'u2', name: 'Anna Berger',     initials: 'AB', role: 'sportler', alter: 28, ziel: 'Kraftaufbau',       sportart: 'Kraftsport' },
  { id: 'u3', name: 'Lukas Reiter',    initials: 'LR', role: 'sportler', alter: 24, ziel: 'Wettkampfvorber.',  sportart: 'Kampfsport' },
];

let _uid = 100;
const uid = () => `u${++_uid}`;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type RoleState = {
  currentUser: AppUser;
  users: AppUser[];
  setCurrentUser: (userId: string) => void;
  getSportler: () => AppUser[];
  getTrainer:  () => AppUser[];
  getUserById: (id: string) => AppUser | undefined;
  addSportler:    (data: Pick<AppUser, 'name' | 'alter' | 'ziel' | 'sportart'>) => string;
  updateSportler: (id: string, data: Pick<AppUser, 'name' | 'alter' | 'ziel' | 'sportart'>) => void;
  deleteSportler: (id: string) => void;
};

export const useRoleStore = create<RoleState>((set, get) => ({
  currentUser: INITIAL_USERS[0],
  users: INITIAL_USERS,

  setCurrentUser: (userId) => {
    const user = get().users.find((u) => u.id === userId);
    if (user) set({ currentUser: user });
  },

  getSportler: () => get().users.filter((u) => u.role === 'sportler'),
  getTrainer:  () => get().users.filter((u) => u.role === 'trainer'),
  getUserById: (id) => get().users.find((u) => u.id === id),

  addSportler: (data) => {
    const id = uid();
    const user: AppUser = { id, role: 'sportler', initials: initials(data.name), ...data };
    set((s) => ({ users: [...s.users, user] }));
    return id;
  },

  updateSportler: (id, data) => {
    set((s) => ({
      users: s.users.map((u) =>
        u.id === id ? { ...u, ...data, initials: initials(data.name) } : u
      ),
    }));
  },

  deleteSportler: (id) => {
    set((s) => ({ users: s.users.filter((u) => u.id !== id) }));
  },
}));
