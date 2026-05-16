import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useUserStore } from '../store/userStore';

export default function ProfileScreen() {
  const { name, weightUnit, weeklyGoal, setName, setWeightUnit, setWeeklyGoal } = useUserStore();
  const [nameInput, setNameInput] = useState(name);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#f9fafb' }}>
      <View style={{ padding: 20 }}>
        <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#111827', marginBottom: 20 }}>
          Profile
        </Text>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 8 }}>Your Name</Text>
          <TextInput
            value={nameInput}
            onChangeText={setNameInput}
            onBlur={() => setName(nameInput)}
            placeholder="Enter your name"
            placeholderTextColor="#9ca3af"
            style={{
              borderWidth: 1,
              borderColor: '#e5e7eb',
              borderRadius: 8,
              padding: 12,
              color: '#111827',
              fontSize: 15,
            }}
          />
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 16 }}>
          <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>Weight Unit</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {(['kg', 'lbs'] as const).map((unit) => (
              <TouchableOpacity
                key={unit}
                onPress={() => setWeightUnit(unit)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: weightUnit === unit ? '#6366f1' : '#f3f4f6',
                }}
              >
                <Text style={{
                  fontWeight: '600',
                  color: weightUnit === unit ? '#fff' : '#6b7280',
                }}>
                  {unit}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 16 }}>
          <Text style={{ fontWeight: '600', color: '#374151', marginBottom: 12 }}>
            Weekly Goal: {weeklyGoal} workouts
          </Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[2, 3, 4, 5, 6].map((n) => (
              <TouchableOpacity
                key={n}
                onPress={() => setWeeklyGoal(n)}
                style={{
                  flex: 1,
                  paddingVertical: 10,
                  borderRadius: 8,
                  alignItems: 'center',
                  backgroundColor: weeklyGoal === n ? '#6366f1' : '#f3f4f6',
                }}
              >
                <Text style={{
                  fontWeight: '600',
                  color: weeklyGoal === n ? '#fff' : '#6b7280',
                }}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
