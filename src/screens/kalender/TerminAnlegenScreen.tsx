import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { KalenderStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<KalenderStackParamList, 'TerminAnlegen'>;
};

const ARTEN = ['Personal Training', 'Gruppentraining', 'Erstgespräch', 'Probe-Training'];
const DAUERN = ['30 min', '45 min', '60 min', '90 min'];

export default function TerminAnlegenScreen({ navigation }: Props) {
  const [art, setArt] = useState(ARTEN[0]);
  const [dauer, setDauer] = useState(DAUERN[2]);
  const [kunde, setKunde] = useState('');

  const handleSave = () => {
    Alert.alert('Termin erstellt', 'Der Termin wurde erfolgreich angelegt.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Art des Termins</Text>
        <View style={styles.chipRow}>
          {ARTEN.map((a) => (
            <TouchableOpacity
              key={a}
              onPress={() => setArt(a)}
              style={[styles.chip, art === a && styles.chipActive]}
            >
              <Text style={[styles.chipText, art === a && styles.chipTextActive]}>{a}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kunde</Text>
        <TextInput
          style={styles.input}
          placeholder="Name suchen..."
          placeholderTextColor="#9ca3af"
          value={kunde}
          onChangeText={setKunde}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Dauer</Text>
        <View style={styles.toggleRow}>
          {DAUERN.map((d) => (
            <TouchableOpacity
              key={d}
              onPress={() => setDauer(d)}
              style={[styles.toggleBtn, dauer === d && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, dauer === d && styles.toggleTextActive]}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Datum & Uhrzeit</Text>
        <Text style={styles.placeholder}>📅  Datum- und Zeitauswahl kommt in der nächsten Version</Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Termin anlegen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#f3f4f6',
  },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontSize: 13, color: '#6b7280', fontWeight: '500' },
  chipTextActive: { color: '#fff' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  toggleBtnActive: { backgroundColor: '#6366f1' },
  toggleText: { fontWeight: '600', color: '#6b7280', fontSize: 13 },
  toggleTextActive: { color: '#fff' },
  placeholder: { color: '#9ca3af', fontSize: 14, textAlign: 'center', paddingVertical: 8 },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
