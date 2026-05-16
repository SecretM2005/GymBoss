import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useWorkoutStore } from '../store/workoutStore';
import { Workout } from '../types';

export default function WorkoutsScreen() {
  const { workouts, deleteWorkout } = useWorkoutStore();

  const handleDelete = (workout: Workout) => {
    Alert.alert(
      'Delete Workout',
      `Delete "${workout.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteWorkout(workout.id) },
      ]
    );
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 16 }}>
          My Workouts
        </Text>

        {workouts.length === 0 ? (
          <View style={{
            backgroundColor: '#fff',
            borderRadius: 12,
            padding: 32,
            alignItems: 'center',
          }}>
            <Text style={{ fontSize: 40, marginBottom: 12 }}>🏋️</Text>
            <Text style={{ color: '#374151', fontWeight: '600', marginBottom: 4 }}>No workouts yet</Text>
            <Text style={{ color: '#9ca3af', fontSize: 13, textAlign: 'center' }}>
              Start tracking your training sessions
            </Text>
          </View>
        ) : (
          workouts.map((workout) => (
            <TouchableOpacity
              key={workout.id}
              onLongPress={() => handleDelete(workout)}
              style={{
                backgroundColor: '#fff',
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{ fontWeight: '700', fontSize: 16, color: '#111827' }}>
                  {workout.name}
                </Text>
                {workout.duration && (
                  <Text style={{ color: '#6366f1', fontWeight: '600' }}>{workout.duration}m</Text>
                )}
              </View>
              <Text style={{ color: '#6b7280', fontSize: 12, marginTop: 4 }}>
                {new Date(workout.date).toLocaleDateString('de-DE', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
              </Text>
              <View style={{ flexDirection: 'row', marginTop: 10, gap: 8, flexWrap: 'wrap' }}>
                {workout.exercises.map((ex) => (
                  <View
                    key={ex.id}
                    style={{ backgroundColor: '#ede9fe', borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 }}
                  >
                    <Text style={{ color: '#6366f1', fontSize: 12 }}>{ex.exercise.name}</Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}
