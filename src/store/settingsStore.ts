import { create } from 'zustand';

export type AppTheme     = 'dark' | 'light';
export type AppSprache   = 'de' | 'en';
export type CoachingView = 'kalender' | 'wochen';
export type ActiveRole   = 'trainer' | 'sportler';

type SettingsState = {
  theme:            AppTheme;
  sprache:          AppSprache;
  coachingView:     CoachingView;
  activeRole:       ActiveRole;
  activeSportlerId: string | null;
  trainerId:        string;
  setTheme:            (v: AppTheme)      => void;
  setSprache:          (v: AppSprache)    => void;
  setCoachingView:     (v: CoachingView)  => void;
  setActiveRole:       (v: ActiveRole)    => void;
  setActiveSportlerId: (v: string | null) => void;
  setTrainerId:        (v: string)        => void;
};

export const useSettingsStore = create<SettingsState>((set) => ({
  theme:            'dark',
  sprache:          'de',
  coachingView:     'kalender',
  activeRole:       'trainer',
  activeSportlerId: null,
  trainerId:        '',
  setTheme:            (theme)            => set({ theme }),
  setSprache:          (sprache)          => set({ sprache }),
  setCoachingView:     (coachingView)     => set({ coachingView }),
  setActiveRole:       (activeRole)       => set({ activeRole }),
  setActiveSportlerId: (activeSportlerId) => set({ activeSportlerId }),
  setTrainerId:        (trainerId)        => set({ trainerId }),
}));

