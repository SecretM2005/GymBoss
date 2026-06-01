// ─── Users & Roles ────────────────────────────────────────────────────────────

export type UserRole = 'trainer' | 'sportler';

export type Sportler = {
  id: string;
  name: string;
  initials: string;
  geburtsdatum?: string;
  sportart?: string;
  ziel?: string;
  profileId?: string; // profiles.id when athlete has a registered account
};

export type Trainer = {
  id: string;
  name: string;
  initials: string;
  spec?: string;
};

// ─── Exercise Library ─────────────────────────────────────────────────────────

export type Phase = 'warmup' | 'haupteinheit' | 'cooldown';

export type UebungParamTyp =
  | 'serien'
  | 'wiederholungen'
  | 'gewicht'
  | 'distanz'
  | 'dauer'
  | 'pause'
  | 'serienpause';

export type UebungParam = {
  typ: UebungParamTyp;
  wert: string;         // raw value, e.g. "3", "6-8", "80", "400"
  einheit?: string;     // e.g. "kg", "m", "s", "min"
  bezeichnung?: string; // custom label for pause, e.g. "Trabpause"
};

export type UebungTemplate = {
  id: string;
  name: string;
  beschreibung?: string;
  parameter: UebungParam[];
};

// An exercise instance inside a phase of an Einheit
export type EinheitUebung = {
  id: string;
  name: string;
  templateId?: string; // set when imported from UebungTemplate library
  typ?: 'kreis' | 'intervall'; // undefined = single exercise
  parameter: UebungParam[];
  kreisUebungen?: KreisUebung[]; // only when typ === 'kreis'
};

export type KreisUebung = {
  id: string;
  name: string;
  wert: string;         // e.g. "200", "30"
  einheit: string;      // e.g. "m", "Wdh", "s"
  zielzeit?: string;    // optional target time for intervals (e.g. "32")
  zeiteinheit?: string; // "s" | "min"
  pause?: string;       // per-step pause for interval training (e.g. "90")
  pauseeinheit?: string;// "s" | "min"
};

// ─── Training Units ───────────────────────────────────────────────────────────

export type EinheitTemplate = {
  id: string;
  name: string;
  warmup: EinheitUebung[];
  haupteinheit: EinheitUebung[];
  cooldown: EinheitUebung[];
};

export type Einheit = EinheitTemplate & {
  templateId?: string;
  datum?: string; // ISO date "2026-05-21" for calendar placement
  sportlerOverrides?: Record<string, EinheitTemplate>; // sportlerId → per-athlete override
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
  SportlerEinheitDetail: { planId: string; wocheId: string; einheitId: string; sportlerId: string };
  EinheitDetail: { planId: string; wocheId: string; einheitId?: string; datum?: string };
};

export type PlaeneStackParamList = {
  PlanList: undefined;
  PlanDetail: { planId: string };
  PlanForm: { planId?: string; preselectedSportlerId?: string };
  ImportPlan: { preselectedSportlerId?: string } | undefined;
  PlanWocheForm: { planId: string; wocheId?: string };
  PlanWocheDetail: { planId: string; wocheId: string };
  EinheitDetail: { planId: string; wocheId: string; einheitId?: string; datum?: string };
};

export type MehrStackParamList = {
  MehrHub: undefined;
  Einstellungen: undefined;
  Uebungsbibliothek: undefined;
  EinheitTemplateDetail: { einheitTemplateId?: string };
  UebungTemplateForm: { uebungTemplateId?: string };
  Nachrichten: { chatPartnerId?: string; chatPartnerName?: string; planId?: string } | undefined;
  Fortschritt: undefined;
};

// ─── Sportler App (Athlete View) ─────────────────────────────────────────────

export type SportlerAppTabParamList = {
  MeinTraining:     undefined;
  MeinFortschritt:  undefined;
  MeinNachrichten:  undefined;
  MeinProfil:       undefined;
};

export type MeinTrainingStackParamList = {
  MeinTrainingMain: undefined;
  EinheitLog:       { planId: string; wocheId: string; einheitId: string };
  PlanForm:         { planId?: string; preselectedSportlerId?: string };
  ImportPlan:       { preselectedSportlerId?: string } | undefined;
  PlanWocheForm:    { planId: string; wocheId?: string };
  PlanWocheDetail:  { planId: string; wocheId: string };
  EinheitDetail:    { planId: string; wocheId: string; einheitId?: string; datum?: string };
};

export type MeinProfilStackParamList = {
  MeinProfilMain:  undefined;
  Einstellungen:   undefined;
  HealthSync:      undefined;
  Benachrichtigungen: undefined;
};

export type MeinNachrichtenStackParamList = {
  NachrichtenList: undefined;
  NachrichtenChat: { chatPartnerId: string; chatPartnerName: string };
};
