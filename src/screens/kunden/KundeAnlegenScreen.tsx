import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { KundenStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<KundenStackParamList, 'KundeAnlegen'>;
};

type FormField = { label: string; key: string; placeholder: string; keyboardType?: 'default' | 'email-address' | 'phone-pad' };

const FIELDS: FormField[] = [
  { label: 'Vorname', key: 'vorname', placeholder: 'Max' },
  { label: 'Nachname', key: 'nachname', placeholder: 'Mustermann' },
  { label: 'E-Mail', key: 'email', placeholder: 'max@example.com', keyboardType: 'email-address' },
  { label: 'Telefon', key: 'telefon', placeholder: '+49 151 ...', keyboardType: 'phone-pad' },
];

export default function KundeAnlegenScreen({ navigation }: Props) {
  const [form, setForm] = useState<Record<string, string>>({});
  const [mitgliedschaft, setMitgliedschaft] = useState<'Basic' | 'Premium'>('Basic');

  const handleSave = () => {
    if (!form.vorname || !form.nachname) {
      Alert.alert('Pflichtfelder', 'Bitte Vor- und Nachname angeben.');
      return;
    }
    Alert.alert('Gespeichert', `${form.vorname} ${form.nachname} wurde angelegt.`, [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Persönliche Daten</Text>
        {FIELDS.map((field) => (
          <View key={field.key} style={styles.fieldGroup}>
            <Text style={styles.label}>{field.label}</Text>
            <TextInput
              style={styles.input}
              placeholder={field.placeholder}
              placeholderTextColor="#9ca3af"
              keyboardType={field.keyboardType ?? 'default'}
              value={form[field.key] ?? ''}
              onChangeText={(v) => setForm((f) => ({ ...f, [field.key]: v }))}
            />
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mitgliedschaft</Text>
        <View style={styles.toggleRow}>
          {(['Basic', 'Premium'] as const).map((opt) => (
            <TouchableOpacity
              key={opt}
              onPress={() => setMitgliedschaft(opt)}
              style={[styles.toggleBtn, mitgliedschaft === opt && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, mitgliedschaft === opt && styles.toggleTextActive]}>
                {opt}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Kunden anlegen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15, marginBottom: 4 },
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
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  toggleBtnActive: { backgroundColor: '#6366f1' },
  toggleText: { fontWeight: '600', color: '#6b7280' },
  toggleTextActive: { color: '#fff' },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
