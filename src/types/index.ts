export type Exercise = {
  id: string;
  name: string;
  muscleGroup: MuscleGroup;
  description?: string;
};

export type MuscleGroup =
  | 'chest'
  | 'back'
  | 'shoulders'
  | 'arms'
  | 'legs'
  | 'core'
  | 'full_body';

export type Set = {
  id: string;
  reps: number;
  weight: number;
  unit: 'kg' | 'lbs';
  completed: boolean;
};

export type WorkoutExercise = {
  id: string;
  exercise: Exercise;
  sets: Set[];
};

export type Workout = {
  id: string;
  name: string;
  date: string;
  exercises: WorkoutExercise[];
  duration?: number;
  notes?: string;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  exercises: Omit<WorkoutExercise, 'id'>[];
};

export type Kunde = {
  id: string;
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  status: 'aktiv' | 'inaktiv';
  eintrittsdatum: string; // ISO-Datum: YYYY-MM-DD
  notizen?: string;
};

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
  KundeForm: { kundeId?: string }; // undefined = Anlegen, gesetzt = Bearbeiten
};

export type KalenderStackParamList = {
  KalenderOverview: undefined;
  TerminDetail: { terminId: string };
  TerminAnlegen: undefined;
};

export type MitgliedschaftenStackParamList = {
  MitgliedschaftenList: undefined;
  MitgliedschaftDetail: { mitgliedschaftId: string };
  MitgliedschaftAnlegen: undefined;
};

export type TrainingsplaeneStackParamList = {
  TrainingsplaeneList: undefined;
  TrainingsplanDetail: { planId: string };
  TrainingsplanAnlegen: undefined;
};
