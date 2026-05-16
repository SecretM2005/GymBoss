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

export type RootStackParamList = {
  Main: undefined;
  WorkoutDetail: { workoutId: string };
  AddExercise: { workoutId: string };
  ExerciseLibrary: undefined;
};

export type BottomTabParamList = {
  Dashboard: undefined;
  Workouts: undefined;
  Progress: undefined;
  Profile: undefined;
};
