import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainingsplaeneList'>;
};

const PLACEHOLDER_PLAENE = [
  { id: '1', name: 'Ganzkörper Basis', level: 'Anfänger', tage: 3, kunden: 4 },
  { id: '2', name: 'Upper/Lower Split', level: 'Fortgeschritten', tage: 4, kunden: 7 },
  { id: '3', name: 'Push/Pull/Legs', level: 'Fortgeschritten', tage: 6, kunden: 2 },
  { id: '4', name: 'Ausdauer & Core', level: 'Anfänger', tage: 3, kunden: 5 },
];

const LEVEL_COLORS: Record<string, { bg: string; text: string }> = {
  Anfänger: { bg: '#dcfce7', text: '#16a34a' },
  Fortgeschritten: { bg: '#fef9c3', text: '#ca8a04' },
  Profi: { bg: '#fee2e2', text: '#ef4444' },
};

export default function TrainingsplaeneListScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <FlatList
        data={PLACEHOLDER_PLAENE}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('TrainingsplanAnlegen')}
          >
            <Text style={styles.addButtonText}>+ Neuen Trainingsplan erstellen</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => {
          const color = LEVEL_COLORS[item.level] ?? LEVEL_COLORS['Anfänger'];
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate('TrainingsplanDetail', { planId: item.id })}
            >
              <View style={styles.cardTop}>
                <Text style={styles.cardName}>{item.name}</Text>
                <View style={[styles.levelBadge, { backgroundColor: color.bg }]}>
                  <Text style={[styles.levelText, { color: color.text }]}>{item.level}</Text>
                </View>
              </View>
              <View style={styles.cardStats}>
                <Text style={styles.stat}>📅 {item.tage}x / Woche</Text>
                <Text style={styles.stat}>👥 {item.kunden} Kunden</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  list: { padding: 16, gap: 10 },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardName: { fontWeight: '700', color: '#111827', fontSize: 15, flex: 1, marginRight: 8 },
  levelBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  levelText: { fontSize: 12, fontWeight: '600' },
  cardStats: { flexDirection: 'row', gap: 16 },
  stat: { color: '#6b7280', fontSize: 13 },
});
