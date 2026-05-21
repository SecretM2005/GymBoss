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

// ─── Exercise Library ─────────────────────────────────────────────────────────

export type Phase = 'warmup' | 'haupteinheit' | 'cooldown';

export type UebungParams = {
  saetze?: number;
  wiederholungen?: number;
  dauer?: number;       // seconds
  pause?: number;       // seconds – rest between reps within a set
  serienpause?: number; // seconds – rest between sets
};

export type UebungTemplate = {
  id: string;
  name: string;
  beschreibung?: string;
} & UebungParams;

// An exercise instance inside a phase of an Einheit
export type EinheitUebung = {
  id: string;
  name: string;
  templateId?: string; // set when imported from UebungTemplate library
} & UebungParams;

// ─── Training Units ───────────────────────────────────────────────────────────

export type EinheitTemplate = {
  id: string;
  name: string;
  warmup: EinheitUebung[];
  haupteinheit: EinheitUebung[];
  cooldown: EinheitUebung[];
};

export type Einheit = EinheitTemplate & {
  templateId?: string; // set when imported from EinheitTemplate library
};

// ─── Training Plans ──────────────────────────────────────────────────────────

export type PlanWoche = {
  id: string;
  wochennummer: number;
  notizen?: string;
  einheiten: Einheit[];
};

export type TrainingsPlan = {
  id: string;
  name: string;
  beschreibung?: string;
  sportart?: string;
  sportlerIds: string[];
  trainerId: string;
  startdatum?: string;
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
  PlanDetail: { planId: string };
  PlanForm: { planId?: string };
  PlanWocheForm: { planId: string; wocheId?: string };
  PlanWocheDetail: { planId: string; wocheId: string };
  EinheitDetail: { planId: string; wocheId: string; einheitId?: string };
};
