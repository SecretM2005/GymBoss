import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { KalenderStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<KalenderStackParamList, 'KalenderOverview'>;
};

const DAYS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const PLACEHOLDER_TERMINE = [
  { id: '1', time: '09:00', name: 'Personal Training – Anna Müller', dauer: '60 min' },
  { id: '2', time: '10:30', name: 'Gruppentraining – Yoga', dauer: '45 min' },
  { id: '3', time: '14:00', name: 'Personal Training – Thomas Bauer', dauer: '60 min' },
  { id: '4', time: '16:00', name: 'Erstgespräch – Neukunde', dauer: '30 min' },
];

export default function KalenderScreen({ navigation }: Props) {
  const [selectedDay, setSelectedDay] = useState(new Date().getDay() || 1);

  return (
    <View style={styles.container}>
      <View style={styles.weekStrip}>
        {DAYS.map((day, index) => {
          const dayNum = index + 1;
          const active = selectedDay === dayNum;
          return (
            <TouchableOpacity
              key={day}
              onPress={() => setSelectedDay(dayNum)}
              style={[styles.dayBtn, active && styles.dayBtnActive]}
            >
              <Text style={[styles.dayLabel, active && styles.dayLabelActive]}>{day}</Text>
              <Text style={[styles.dayNum, active && styles.dayNumActive]}>
                {new Date().getDate() - (new Date().getDay() - dayNum)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.row}>
          <Text style={styles.dateHeading}>
            {DAYS[selectedDay - 1]}, {new Date().toLocaleDateString('de-DE', { day: 'numeric', month: 'long' })}
          </Text>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('TerminAnlegen')}
          >
            <Text style={styles.addBtnText}>+ Termin</Text>
          </TouchableOpacity>
        </View>

        {PLACEHOLDER_TERMINE.map((termin) => (
          <TouchableOpacity
            key={termin.id}
            style={styles.terminCard}
            onPress={() => navigation.navigate('TerminDetail', { terminId: termin.id })}
          >
            <View style={styles.timeBadge}>
              <Text style={styles.timeText}>{termin.time}</Text>
            </View>
            <View style={styles.terminInfo}>
              <Text style={styles.terminName}>{termin.name}</Text>
              <Text style={styles.terminDauer}>{termin.dauer}</Text>
            </View>
            <View style={styles.colorDot} />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  weekStrip: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  dayBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 10,
  },
  dayBtnActive: { backgroundColor: '#6366f1' },
  dayLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  dayLabelActive: { color: '#c7d2fe' },
  dayNum: { fontSize: 16, fontWeight: '700', color: '#374151', marginTop: 2 },
  dayNumActive: { color: '#fff' },
  content: { padding: 16, gap: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  dateHeading: { fontWeight: '700', fontSize: 16, color: '#111827' },
  addBtn: { backgroundColor: '#6366f1', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  addBtnText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  terminCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  timeBadge: {
    backgroundColor: '#ede9fe',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    minWidth: 56,
    alignItems: 'center',
  },
  timeText: { color: '#6366f1', fontWeight: '700', fontSize: 13 },
  terminInfo: { flex: 1 },
  terminName: { fontWeight: '600', color: '#111827', fontSize: 14 },
  terminDauer: { color: '#9ca3af', fontSize: 12, marginTop: 2 },
  colorDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6366f1' },
});
