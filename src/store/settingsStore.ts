import { create } from 'zustand';

export type AppTheme       = 'dark' | 'light';
export type AppSprache     = 'de' | 'en';
export type CoachingView   = 'kalender' | 'wochen';

type SettingsState = {
  theme:        AppTheme;
  sprache:      AppSprache;
  coachingView: CoachingView;
  setTheme:        (v: AppTheme)     => void;
  setSprache:      (v: AppSprache)   => void;
  setCoachingView: (v: CoachingView) => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  theme:        'dark',
  sprache:      'de',
  coachingView: 'kalender',
  setTheme:        (theme)        => set({ theme }),
  setSprache:      (sprache)      => set({ sprache }),
  setCoachingView: (coachingView) => set({ coachingView }),
}));
