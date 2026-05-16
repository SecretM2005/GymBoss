import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';
import { useUserStore } from '../store/userStore';

export default function DashboardScreen() {
  const { workouts } = useWorkoutStore();
  const { name, weeklyGoal } = useUserStore();

  const thisWeekCount = workouts.filter((w) => {
    const workoutDate = new Date(w.date);
    const now = new Date();
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    return workoutDate >= startOfWeek;
  }).length;

  const recentWorkouts = workouts.slice(0, 3);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#111827', marginBottom: 4 }}>
          {name ? `Hey, ${name}! 💪` : 'Welcome to GymBoss 💪'}
        </Text>
        <Text style={{ fontSize: 14, color: '#6b7280', marginBottom: 24 }}>
          Ready to crush your workout?
        </Text>

        <View style={{
          backgroundColor: '#6366f1',
          borderRadius: 16,
          padding: 20,
          marginBottom: 20,
        }}>
          <Text style={{ color: '#c7d2fe', fontSize: 12, marginBottom: 4 }}>This Week</Text>
          <Text style={{ color: '#fff', fontSize: 36, fontWeight: 'bold' }}>
            {thisWeekCount}/{weeklyGoal}
          </Text>
          <Text style={{ color: '#c7d2fe', fontSize: 14 }}>workouts completed</Text>
          <View style={{ marginTop: 12, backgroundColor: '#4f46e5', borderRadius: 8, height: 8 }}>
            <View style={{
              backgroundColor: '#a5b4fc',
              borderRadius: 8,
              height: 8,
              width: `${Math.min((thisWeekCount / weeklyGoal) * 100, 100)}%`,
            }} />
          </View>
        </View>

        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827', marginBottom: 12 }}>
          Recent Workouts
        </Text>

        {recentWorkouts.length === 0 ? (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 24,
            alignItems: 'center',
          }}>
            <Text style={{ color: '#9ca3af', fontSize: 14 }}>No workouts yet. Start your first one!</Text>
          </View>
        ) : (
          recentWorkouts.map((workout) => (
            <View key={workout.id} style={{
              backgroundColor: '#fff',
              borderRadius: 12,
              padding: 16,
              marginBottom: 10,
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              <View>
                <Text style={{ fontWeight: '600', color: '#111827' }}>{workout.name}</Text>
                <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 2 }}>
                  {new Date(workout.date).toLocaleDateString()} · {workout.exercises.length} exercises
                </Text>
              </View>
              {workout.duration && (
                <Text style={{ color: '#6366f1', fontWeight: '600' }}>
                  {workout.duration}m
                </Text>
              )}
            </View>
          ))
        )}
      </View>
    </ScrollView>
  );
}
