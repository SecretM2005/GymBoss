// ─── Users & Roles ────────────────────────────────────────────────────────────

export type UserRole = 'trainer' | 'sportler';

export type Sportler = {
  id: string;
  name: string;
  initials: string;
  alter?: number;
  sportart?: string;
  ziel?: string;
};

export type Trainer = {
  id: string;
  name: string;
  initials: string;
  spec?: string;
};

// ─── Training Plans ──────────────────────────────────────────────────────────

export type Wochentag = 'Mo' | 'Di' | 'Mi' | 'Do' | 'Fr' | 'Sa' | 'So';

export type PlanUebung = {
  id: string;
  name: string;
  saetze: number;
  wiederholungen: number;
  gewicht?: number;
  pause: number;
  notizen?: string;
};

export type PlanWorkout = {
  id: string;
  name: string;
  wochentag: Wochentag;
  typ: string;
  uebungen: PlanUebung[];
};

export type PlanWoche = {
  id: string;
  wochennummer: number;
  notizen?: string;
  workouts: PlanWorkout[];
};

export type TrainingsPlan = {
  id: string;
  name: string;
  beschreibung?: string;
  ziel?: string;
  sportlerId: string;
  trainerId: string;
  startdatum: string;
  wochen: PlanWoche[];
};

export type WorkoutFeedback = {
  id: string;
  workoutId: string;
  sportlerId: string;
  datum: string;
  bewertung: number;
  rpe: number;
  notiz?: string;
  abgeschlossen: boolean;
};

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Main: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Plaene: undefined;
  Sportler: undefined;
  Mehr: undefined;
};

export type SportlerStackParamList = {
  SportlerList: undefined;
  SportlerDetail: { sportlerId: string };
  SportlerForm: { sportlerId?: string };
};

export type PlaeneStackParamList = {
  PlanList: undefined;
  PlanForm: { planId?: string };
  PlanWoche: { planId: string; wocheId: string };
  PlanWorkout: { planId: string; wocheId: string; workoutId?: string; wochentag?: Wochentag };
};
