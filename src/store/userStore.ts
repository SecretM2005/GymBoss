import { create } from 'zustand';

type UserState = {
  name: string;
  weightUnit: 'kg' | 'lbs';
  weeklyGoal: number;

  setName: (name: string) => void;
  setWeightUnit: (unit: 'kg' | 'lbs') => void;
  setWeeklyGoal: (goal: number) => void;
};

export const useUserStore = create<UserState>((set) => ({
  name: '',
  weightUnit: 'kg',
  weeklyGoal: 3,

  setName: (name) => set({ name }),
  setWeightUnit: (weightUnit) => set({ weightUnit }),
  setWeeklyGoal: (weeklyGoal) => set({ weeklyGoal }),
}));
