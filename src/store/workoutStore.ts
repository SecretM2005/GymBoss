import { create } from 'zustand';
import { Workout, WorkoutTemplate, Exercise } from '../types';

type WorkoutState = {
  workouts: Workout[];
  templates: WorkoutTemplate[];
  exercises: Exercise[];
  activeWorkoutId: string | null;

  addWorkout: (workout: Workout) => void;
  updateWorkout: (id: string, updates: Partial<Workout>) => void;
  deleteWorkout: (id: string) => void;
  setActiveWorkout: (id: string | null) => void;

  addTemplate: (template: WorkoutTemplate) => void;
  deleteTemplate: (id: string) => void;

  addExercise: (exercise: Exercise) => void;
};

export const useWorkoutStore = create<WorkoutState>((set) => ({
  workouts: [],
  templates: [],
  exercises: DEFAULT_EXERCISES,
  activeWorkoutId: null,

  addWorkout: (workout) =>
    set((state) => ({ workouts: [workout, ...state.workouts] })),

  updateWorkout: (id, updates) =>
    set((state) => ({
      workouts: state.workouts.map((w) =>
        w.id === id ? { ...w, ...updates } : w
      ),
    })),

  deleteWorkout: (id) =>
    set((state) => ({
      workouts: state.workouts.filter((w) => w.id !== id),
    })),

  setActiveWorkout: (id) => set({ activeWorkoutId: id }),

  addTemplate: (template) =>
    set((state) => ({ templates: [...state.templates, template] })),

  deleteTemplate: (id) =>
    set((state) => ({
      templates: state.templates.filter((t) => t.id !== id),
    })),

  addExercise: (exercise) =>
    set((state) => ({ exercises: [...state.exercises, exercise] })),
}));

const DEFAULT_EXERCISES: Exercise[] = [
  { id: '1', name: 'Bench Press', muscleGroup: 'chest' },
  { id: '2', name: 'Squat', muscleGroup: 'legs' },
  { id: '3', name: 'Deadlift', muscleGroup: 'back' },
  { id: '4', name: 'Overhead Press', muscleGroup: 'shoulders' },
  { id: '5', name: 'Pull-Up', muscleGroup: 'back' },
  { id: '6', name: 'Barbell Row', muscleGroup: 'back' },
  { id: '7', name: 'Dumbbell Curl', muscleGroup: 'arms' },
  { id: '8', name: 'Tricep Dip', muscleGroup: 'arms' },
  { id: '9', name: 'Plank', muscleGroup: 'core' },
  { id: '10', name: 'Leg Press', muscleGroup: 'legs' },
];
