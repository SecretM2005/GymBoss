import { create } from 'zustand';
import { AppUser, UserRole } from '../types';

const USERS: AppUser[] = [
  { id: 'u1', name: 'Marcus Hoffmann', initials: 'MH', role: 'trainer',  spec: 'Kraft & Kampfsport' },
  { id: 'u2', name: 'Anna Berger',     initials: 'AB', role: 'sportler', alter: 28, ziel: 'Kraftaufbau' },
  { id: 'u3', name: 'Lukas Reiter',    initials: 'LR', role: 'sportler', alter: 24, ziel: 'Wettkampfvorber.' },
];

type RoleState = {
  currentUser: AppUser;
  users: AppUser[];
  setCurrentUser: (userId: string) => void;
  getSportler: () => AppUser[];
  getTrainer:  () => AppUser[];
  getUserById: (id: string) => AppUser | undefined;
};

export const useRoleStore = create<RoleState>((set, get) => ({
  currentUser: USERS[0],
  users: USERS,

  setCurrentUser: (userId) => {
    const user = USERS.find((u) => u.id === userId);
    if (user) set({ currentUser: user });
  },

  getSportler: () => get().users.filter((u) => u.role === 'sportler'),
  getTrainer:  () => get().users.filter((u) => u.role === 'trainer'),
  getUserById: (id) => get().users.find((u) => u.id === id),
}));
