import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';
import { MuscleGroup } from '../types';

const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  chest: 'Chest',
  back: 'Back',
  shoulders: 'Shoulders',
  arms: 'Arms',
  legs: 'Legs',
  core: 'Core',
  full_body: 'Full Body',
};

export default function ProgressScreen() {
  const { workouts } = useWorkoutStore();

  const totalWorkouts = workouts.length;
  const totalExercises = workouts.reduce((acc, w) => acc + w.exercises.length, 0);
  const totalSets = workouts.reduce(
    (acc, w) => acc + w.exercises.reduce((a, e) => a + e.sets.length, 0),
    0
  );

  const muscleCounts: Partial<Record<MuscleGroup, number>> = {};
  workouts.forEach((w) =>
    w.exercises.forEach((e) => {
      const mg = e.exercise.muscleGroup;
      muscleCounts[mg] = (muscleCounts[mg] ?? 0) + 1;
    })
  );
  const topMuscle = Object.entries(muscleCounts).sort(([, a], [, b]) => b - a)[0];

  const stats = [
    { label: 'Total Workouts', value: totalWorkouts, icon: '🏋️' },
    { label: 'Total Exercises', value: totalExercises, icon: '💪' },
    { label: 'Total Sets', value: totalSets, icon: '🔁' },
    { label: 'Top Muscle', value: topMuscle ? MUSCLE_LABELS[topMuscle[0] as MuscleGroup] : '—', icon: '🎯' },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>
          My Progress
        </Text>

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {stats.map((stat) => (
            <View
              key={stat.label}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                width: '47%',
              }}
            >
              <Text style={{ fontSize: 24, marginBottom: 6 }}>{stat.icon}</Text>
              <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#6366f1' }}>
                {stat.value}
              </Text>
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>{stat.label}</Text>
            </View>
          ))}
        </View>

        <Text style={{ fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
          Muscle Group Breakdown
        </Text>

        {Object.keys(muscleCounts).length === 0 ? (
          <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center' }}>
            <Text style={{ color: '#9ca3af' }}>Log workouts to see your breakdown</Text>
          </View>
        ) : (
          Object.entries(muscleCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([muscle, count]) => {
              const max = Math.max(...Object.values(muscleCounts as Record<string, number>));
              const pct = Math.round((count / max) * 100);
              return (
                <View key={muscle} style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ color: '#374151', fontSize: 13 }}>
                      {MUSCLE_LABELS[muscle as MuscleGroup]}
                    </Text>
                    <Text style={{ color: '#6b7280', fontSize: 13 }}>{count} sets</Text>
                  </View>
                  <View style={{ backgroundColor: '#e5e7eb', borderRadius: 8, height: 8 }}>
                    <View
                      style={{
                        backgroundColor: '#6366f1',
                        borderRadius: 8,
                        height: 8,
                        width: `${pct}%` as `${number}%`,
                      }}
                    />
                  </View>
                </View>
              );
            })
        )}
      </View>
    </ScrollView>
  );
}
