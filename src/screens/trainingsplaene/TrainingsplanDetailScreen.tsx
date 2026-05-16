import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainingsplanDetail'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainingsplanDetail'>;
};

const PLAN_TAGE = [
  {
    tag: 'Tag A – Oberkörper Push',
    uebungen: ['Bankdrücken 4×8', 'Schulterdrücken 3×10', 'Dips 3×12', 'Seitheben 3×15'],
  },
  {
    tag: 'Tag B – Oberkörper Pull',
    uebungen: ['Klimmzüge 4×8', 'Rudern 3×10', 'Face Pulls 3×15', 'Bizeps Curl 3×12'],
  },
  {
    tag: 'Tag C – Unterkörper',
    uebungen: ['Kniebeugen 4×8', 'Rumänisches Kreuzheben 3×10', 'Beinpresse 3×12', 'Wadenheben 4×20'],
  },
];

export default function TrainingsplanDetailScreen({ route }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.headerLabel}>Trainingsplan #{route.params.planId}</Text>
        <Text style={styles.headerTitle}>Upper/Lower Split</Text>
        <View style={styles.headerMeta}>
          <Text style={styles.metaChip}>📅 4x / Woche</Text>
          <Text style={styles.metaChip}>⚡ Fortgeschritten</Text>
          <Text style={styles.metaChip}>👥 7 Kunden</Text>
        </View>
      </View>

      {PLAN_TAGE.map((tag) => (
        <View key={tag.tag} style={styles.section}>
          <Text style={styles.sectionTitle}>{tag.tag}</Text>
          {tag.uebungen.map((u) => (
            <View key={u} style={styles.uebungRow}>
              <View style={styles.uebungDot} />
              <Text style={styles.uebungText}>{u}</Text>
            </View>
          ))}
        </View>
      ))}

      <View style={styles.actionsSection}>
        <TouchableOpacity style={styles.primaryAction}>
          <Text style={styles.primaryActionText}>👤 Kunden zuweisen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.secondaryAction}>
          <Text style={styles.secondaryActionText}>✏️ Plan bearbeiten</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  header: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    gap: 8,
  },
  headerLabel: { color: '#a5b4fc', fontSize: 13 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: '800' },
  headerMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  metaChip: {
    backgroundColor: '#4f46e5',
    color: '#c7d2fe',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '500',
    overflow: 'hidden',
  },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 8 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 14, marginBottom: 4 },
  uebungRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  uebungDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#6366f1' },
  uebungText: { color: '#374151', fontSize: 14 },
  actionsSection: { gap: 10 },
  primaryAction: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryActionText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  secondaryAction: {
    borderWidth: 1,
    borderColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryActionText: { color: '#6366f1', fontWeight: '600', fontSize: 15 },
});
