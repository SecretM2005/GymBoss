import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainingsplanAnlegen'>;
};

const LEVELS = ['Anfänger', 'Fortgeschritten', 'Profi'];
const TAGE_OPTIONS = [2, 3, 4, 5, 6];

export default function TrainingsplanAnlegenScreen({ navigation }: Props) {
  const [name, setName] = useState('');
  const [level, setLevel] = useState(LEVELS[0]);
  const [tage, setTage] = useState(3);
  const [beschreibung, setBeschreibung] = useState('');

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert('Fehler', 'Bitte einen Namen angeben.');
      return;
    }
    Alert.alert('Plan erstellt', `"${name}" wurde gespeichert.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Plan-Details</Text>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="z.B. Push/Pull/Legs"
            placeholderTextColor="#9ca3af"
            value={name}
            onChangeText={setName}
          />
        </View>
        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Beschreibung (optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Ziel, Zielgruppe, Besonderheiten..."
            placeholderTextColor="#9ca3af"
            value={beschreibung}
            onChangeText={setBeschreibung}
            multiline
            numberOfLines={3}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Level</Text>
        <View style={styles.chipRow}>
          {LEVELS.map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => setLevel(l)}
              style={[styles.chip, level === l && styles.chipActive]}
            >
              <Text style={[styles.chipText, level === l && styles.chipTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trainingstage pro Woche</Text>
        <View style={styles.toggleRow}>
          {TAGE_OPTIONS.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTage(t)}
              style={[styles.toggleBtn, tage === t && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, tage === t && styles.toggleTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Übungen</Text>
        <Text style={styles.placeholder}>
          🏋️  Übungen können nach dem Erstellen hinzugefügt werden
        </Text>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Plan erstellen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  fieldGroup: { gap: 4 },
  label: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  textArea: { height: 80, textAlignVertical: 'top' },
  chipRow: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  chipActive: { backgroundColor: '#6366f1' },
  chipText: { fontWeight: '600', color: '#6b7280', fontSize: 13 },
  chipTextActive: { color: '#fff' },
  toggleRow: { flexDirection: 'row', gap: 8 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  toggleBtnActive: { backgroundColor: '#6366f1' },
  toggleText: { fontWeight: '600', color: '#6b7280', fontSize: 14 },
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
