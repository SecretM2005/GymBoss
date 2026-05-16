# GymBoss

A mobile fitness tracking app built with Expo and React Native. Users can log workouts, track exercises and sets, monitor their weekly goals, and analyze their training progress over time.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Expo](https://expo.dev) (SDK 54) with React Native |
| Language | TypeScript (strict mode) |
| Navigation | React Navigation — Stack + Bottom Tabs |
| Styling | NativeWind (Tailwind CSS for React Native) |
| State Management | Zustand |

## Project Structure

```
GymBoss/
├── App.tsx                    # Entry point, mounts RootNavigator
├── babel.config.js            # Expo + NativeWind preset
├── tailwind.config.js         # Tailwind content paths + custom colors
├── tsconfig.json              # Path aliases (@/* → src/*)
└── src/
    ├── components/            # Reusable UI primitives
    │   ├── Button.tsx         # Primary/secondary/danger button
    │   └── Card.tsx           # White rounded card container
    ├── navigation/
    │   ├── RootNavigator.tsx  # Stack navigator wrapping all screens
    │   └── BottomTabNavigator.tsx  # 4-tab bottom navigation
    ├── screens/
    │   ├── DashboardScreen.tsx   # Weekly overview + recent workouts
    │   ├── WorkoutsScreen.tsx    # Full workout history list
    │   ├── ProgressScreen.tsx    # Stats + muscle group breakdown
    │   └── ProfileScreen.tsx     # Name, weight unit, weekly goal
    ├── store/
    │   ├── workoutStore.ts    # Workouts, exercises, templates (Zustand)
    │   └── userStore.ts       # User preferences (Zustand)
    └── types/
        └── index.ts           # All shared TypeScript types
```

## Key Types

- **Exercise** – name, muscle group, optional description
- **Set** – reps, weight, unit (kg/lbs), completed flag
- **WorkoutExercise** – exercise + sets
- **Workout** – name, date, exercises, duration, notes
- **WorkoutTemplate** – reusable workout blueprint

## Navigation Structure

```
RootNavigator (Stack)
└── Main → BottomTabNavigator
    ├── Dashboard
    ├── Workouts
    ├── Progress
    └── Profile
```

## Development

```bash
npm start          # Start Expo dev server
npm run android    # Run on Android
npm run ios        # Run on iOS (macOS only)
npm run web        # Run in browser
```

## Design Conventions

- **Primary color**: `#6366f1` (indigo-500)
- **Background**: `#f9fafb` (gray-50)
- **Cards**: white, `borderRadius: 12`, subtle shadow
- Use `StyleSheet.create` for component-level styles; NativeWind `className` for layout utilities
- Keep screens as thin presentation layers — all state lives in Zustand stores
