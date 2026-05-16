import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { KalenderStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<KalenderStackParamList, 'TerminDetail'>;
  route: RouteProp<KalenderStackParamList, 'TerminDetail'>;
};

export default function TerminDetailScreen({ navigation, route }: Props) {
  const handleAbsagen = () => {
    Alert.alert('Termin absagen', 'Möchtest du diesen Termin wirklich absagen?', [
      { text: 'Nein', style: 'cancel' },
      { text: 'Ja, absagen', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.time}>09:00 – 10:00 Uhr</Text>
        <Text style={styles.title}>Personal Training</Text>
        <Text style={styles.sub}>Termin #{route.params.terminId}</Text>
      </View>

      <View style={styles.section}>
        {[
          { label: 'Kunde', value: 'Anna Müller' },
          { label: 'Trainer', value: 'Max Trainer' },
          { label: 'Datum', value: new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
          { label: 'Dauer', value: '60 Minuten' },
          { label: 'Status', value: 'Bestätigt' },
        ].map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notizen</Text>
        <Text style={styles.notes}>Fokus auf Oberkörper. Kniebeschwerden beachten.</Text>
      </View>

      <TouchableOpacity style={styles.dangerButton} onPress={handleAbsagen}>
        <Text style={styles.dangerText}>Termin absagen</Text>
      </TouchableOpacity>
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
    gap: 4,
  },
  time: { color: '#c7d2fe', fontSize: 13, fontWeight: '500' },
  title: { color: '#fff', fontSize: 22, fontWeight: '700' },
  sub: { color: '#a5b4fc', fontSize: 13 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontWeight: '700', color: '#111827', marginBottom: 8 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLabel: { color: '#6b7280', fontSize: 14 },
  rowValue: { color: '#111827', fontSize: 14, fontWeight: '500' },
  notes: { color: '#374151', fontSize: 14, lineHeight: 22 },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
