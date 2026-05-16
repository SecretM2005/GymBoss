import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MitgliedschaftenStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<MitgliedschaftenStackParamList, 'MitgliedschaftDetail'>;
  route: RouteProp<MitgliedschaftenStackParamList, 'MitgliedschaftDetail'>;
};

export default function MitgliedschaftDetailScreen({ navigation, route }: Props) {
  const handleKuendigen = () => {
    Alert.alert('Mitgliedschaft kündigen', 'Wirklich kündigen?', [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Kündigen', style: 'destructive', onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.heroCard}>
        <Text style={styles.heroLabel}>Mitgliedschaft</Text>
        <Text style={styles.heroTitle}>Premium</Text>
        <Text style={styles.heroPrice}>89 € / Monat</Text>
        <View style={styles.heroBadge}>
          <Text style={styles.heroBadgeText}>✓ Aktiv</Text>
        </View>
      </View>

      <View style={styles.section}>
        {[
          { label: 'Mitglied', value: 'Anna Müller' },
          { label: 'Vertragsbeginn', value: '01.01.2024' },
          { label: 'Nächste Zahlung', value: '01.06.2025' },
          { label: 'Vertragslaufzeit', value: '12 Monate' },
          { label: 'Kündigungsfrist', value: '4 Wochen' },
          { label: 'Mitgliedschaft #', value: route.params.mitgliedschaftId },
        ].map((row) => (
          <View key={row.label} style={styles.row}>
            <Text style={styles.rowLabel}>{row.label}</Text>
            <Text style={styles.rowValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enthaltene Leistungen</Text>
        {['Unbegrenzt Gerätetraining', 'Personal Training 4x/Monat', 'Ernährungsberatung', 'App-Zugang'].map((l) => (
          <Text key={l} style={styles.leistung}>✓  {l}</Text>
        ))}
      </View>

      <TouchableOpacity style={styles.dangerButton} onPress={handleKuendigen}>
        <Text style={styles.dangerText}>Mitgliedschaft kündigen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  heroCard: {
    backgroundColor: '#6366f1',
    borderRadius: 16,
    padding: 20,
    gap: 4,
  },
  heroLabel: { color: '#a5b4fc', fontSize: 13 },
  heroTitle: { color: '#fff', fontSize: 28, fontWeight: '800' },
  heroPrice: { color: '#c7d2fe', fontSize: 16 },
  heroBadge: {
    marginTop: 8,
    backgroundColor: '#4f46e5',
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  heroBadgeText: { color: '#a5b4fc', fontSize: 13, fontWeight: '600' },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16 },
  sectionTitle: { fontWeight: '700', color: '#111827', marginBottom: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  rowLabel: { color: '#6b7280', fontSize: 14 },
  rowValue: { color: '#111827', fontSize: 14, fontWeight: '500' },
  leistung: { color: '#374151', fontSize: 14, paddingVertical: 5 },
  dangerButton: {
    borderWidth: 1,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  dangerText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
