import { create } from 'zustand';
import { AppUser, UserRole } from '../types';

const USERS: AppUser[] = [
  { id: 'u1', name: 'Max Müller',  role: 'trainer'  },
  { id: 'u2', name: 'Anna Bauer',  role: 'sportler' },
  { id: 'u3', name: 'Jonas Weber', role: 'sportler' },
];

type RoleState = {
  currentUser: AppUser;
  users: AppUser[];
  setCurrentUser: (userId: string) => void;
  getSportler: () => AppUser[];
  getTrainer: () => AppUser[];
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
