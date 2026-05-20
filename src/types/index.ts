// ─── Kunden ─────────────────────────────────────────────────────────────────

export type Kunde = {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  status: 'aktiv' | 'inaktiv';
  eintrittsdatum: string; // ISO: YYYY-MM-DD
  notizen?: string;
};

// ─── Mitgliedschaften ────────────────────────────────────────────────────────

export type MitgliedschaftTyp = 'Basic' | 'Premium';
export type MitgliedschaftStatus = 'aktiv' | 'abgelaufen' | 'gekuendigt';

export type Mitgliedschaft = {
  id: string;
  kundeId: string;
  typ: MitgliedschaftTyp;
  preis: number;
  startdatum: string;
  enddatum: string;
  status: MitgliedschaftStatus;
};

// ─── Termine ─────────────────────────────────────────────────────────────────

export type Termin = {
  id: string;
  kundeId: string;
  titel: string;
  datum: string;
  uhrzeit: string;
  dauer: number;
  notizen?: string;
};

// ─── Rollen & Nutzer ─────────────────────────────────────────────────────────

export type UserRole = 'trainer' | 'sportler';

export type AppUser = {
  id: string;
  name: string;
  initials: string;
  role: UserRole;
  alter?: number;    // Sportler: Alter in Jahren
  ziel?: string;     // Sportler: Trainingsziel
  sportart?: string; // Sportler: Sportart
  spec?: string;     // Trainer: Spezialisierung
};

// ─── Trainingspläne ──────────────────────────────────────────────────────────

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
  bewertung: number;  // 1–5
  rpe: number;        // 1–10
  notiz?: string;
  abgeschlossen: boolean;
};

// ─── Navigation ──────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Main: undefined;
};

export type BottomTabParamList = {
  Kunden: undefined;
  Kalender: undefined;
  Mitgliedschaften: undefined;
  Trainingsplaene: undefined;
};

export type KundenStackParamList = {
  KundenList: undefined;
  KundenDetail: { kundeId: string };
  KundeForm: { kundeId?: string };
};

export type KalenderStackParamList = {
  KalenderOverview: undefined;
  TerminDetail: { terminId: string };
  TerminForm: { terminId?: string; datum?: string };
};

export type MitgliedschaftenStackParamList = {
  MitgliedschaftenList: undefined;
  MitgliedschaftDetail: { mitgliedschaftId: string };
  MitgliedschaftForm: { kundeId?: string };
};

export type TrainingsplaeneStackParamList = {
  TrainingsplaeneHome: undefined;
  // Trainer
  TrainerPlanList: undefined;
  TrainerPlanForm: { planId?: string };
  TrainerWoche: { planId: string; wocheId: string };
  TrainerWorkout: { planId: string; wocheId: string; workoutId?: string; wochentag?: Wochentag };
  TrainerSportlerList: undefined;
  TrainerSportlerForm: { sportlerId?: string };
  // Sportler
  SportlerPlanList: undefined;
  SportlerWochenansicht: { planId: string };
  SportlerWorkoutDetail: { planId: string; wocheId: string; workoutId: string };
  SportlerFeedback: { planId: string; wocheId: string; workoutId: string };
};
