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
  preis: number;      // monatlicher Preis in EUR
  startdatum: string; // ISO: YYYY-MM-DD
  enddatum: string;   // ISO: YYYY-MM-DD
  status: MitgliedschaftStatus;
};

// ─── Termine ─────────────────────────────────────────────────────────────────

export type Termin = {
  id: string;
  kundeId: string;
  titel: string;
  datum: string;    // ISO: YYYY-MM-DD
  uhrzeit: string;  // HH:MM
  dauer: number;    // Minuten
  notizen?: string;
};

// ─── Trainingspläne ──────────────────────────────────────────────────────────

export type Schwierigkeitsgrad = 'Anfänger' | 'Fortgeschritten' | 'Profi';

export type PlanUebung = {
  id: string;
  name: string;
  saetze: number;
  wiederholungen: number;
  gewicht?: number; // kg, optional
  pause: number;    // Sekunden
};

export type Trainingsplan = {
  id: string;
  name: string;
  kundeId?: string; // optional – kein Kunde = Template
  schwierigkeitsgrad: Schwierigkeitsgrad;
  uebungen: PlanUebung[];
  erstellt: string; // ISO: YYYY-MM-DD
  notizen?: string;
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
  TrainingsplaeneList: undefined;
  TrainingsplanDetail: { planId: string };
  TrainingsplanForm: { planId?: string };
};
