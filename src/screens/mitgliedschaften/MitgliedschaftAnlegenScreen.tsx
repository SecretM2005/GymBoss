import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MitgliedschaftenStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<MitgliedschaftenStackParamList, 'MitgliedschaftAnlegen'>;
};

const PAKETE = [
  { name: 'Basic', preis: '39 €/Mo', features: ['Gerätetraining', 'App-Zugang'] },
  { name: 'Premium', preis: '89 €/Mo', features: ['Alles aus Basic', 'Personal Training 4x', 'Ernährungsberatung'] },
  { name: 'Jahres-Flat', preis: '699 €/Jahr', features: ['Alles aus Premium', '2 Monate gratis'] },
];

const LAUFZEITEN = ['1 Monat', '6 Monate', '12 Monate'];

export default function MitgliedschaftAnlegenScreen({ navigation }: Props) {
  const [paket, setPaket] = useState(PAKETE[0].name);
  const [laufzeit, setLaufzeit] = useState(LAUFZEITEN[2]);
  const [kunde, setKunde] = useState('');

  const handleSave = () => {
    if (!kunde) {
      Alert.alert('Fehler', 'Bitte einen Kunden auswählen.');
      return;
    }
    Alert.alert('Gespeichert', 'Mitgliedschaft wurde angelegt.', [
      { text: 'OK', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kunde</Text>
        <TextInput
          style={styles.input}
          placeholder="Kunde suchen..."
          placeholderTextColor="#9ca3af"
          value={kunde}
          onChangeText={setKunde}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Paket wählen</Text>
        {PAKETE.map((p) => (
          <TouchableOpacity
            key={p.name}
            onPress={() => setPaket(p.name)}
            style={[styles.paketCard, paket === p.name && styles.paketCardActive]}
          >
            <View style={styles.paketHeader}>
              <Text style={[styles.paketName, paket === p.name && styles.paketNameActive]}>{p.name}</Text>
              <Text style={[styles.paketPreis, paket === p.name && styles.paketPreisActive]}>{p.preis}</Text>
            </View>
            {p.features.map((f) => (
              <Text key={f} style={[styles.paketFeature, paket === p.name && styles.paketFeatureActive]}>
                ✓  {f}
              </Text>
            ))}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Laufzeit</Text>
        <View style={styles.toggleRow}>
          {LAUFZEITEN.map((l) => (
            <TouchableOpacity
              key={l}
              onPress={() => setLaufzeit(l)}
              style={[styles.toggleBtn, laufzeit === l && styles.toggleBtnActive]}
            >
              <Text style={[styles.toggleText, laufzeit === l && styles.toggleTextActive]}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Mitgliedschaft anlegen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: '#111827',
  },
  paketCard: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: 14,
    gap: 4,
  },
  paketCardActive: { borderColor: '#6366f1', backgroundColor: '#ede9fe' },
  paketHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  paketName: { fontWeight: '700', fontSize: 15, color: '#374151' },
  paketNameActive: { color: '#6366f1' },
  paketPreis: { fontWeight: '600', color: '#6b7280' },
  paketPreisActive: { color: '#6366f1' },
  paketFeature: { color: '#6b7280', fontSize: 13 },
  paketFeatureActive: { color: '#4f46e5' },
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
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
