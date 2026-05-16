import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { KundenStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<KundenStackParamList, 'KundenDetail'>;
  route: RouteProp<KundenStackParamList, 'KundenDetail'>;
};

const INFO_ROWS = [
  { label: 'E-Mail', value: 'kunde@example.com' },
  { label: 'Telefon', value: '+49 151 23456789' },
  { label: 'Mitgliedschaft', value: 'Premium' },
  { label: 'Mitglied seit', value: 'Januar 2024' },
  { label: 'Nächste Zahlung', value: '01.02.2025' },
];

const STAT_TILES = [
  { label: 'Trainings', value: '24' },
  { label: 'Diese Woche', value: '3' },
  { label: 'Streak', value: '7d' },
];

export default function KundenDetailScreen({ route }: Props) {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>A</Text>
        </View>
        <Text style={styles.name}>Anna Müller</Text>
        <Text style={styles.sub}>Kunde #{route.params.kundeId}</Text>
      </View>

      <View style={styles.statsRow}>
        {STAT_TILES.map((s) => (
          <View key={s.label} style={styles.statTile}>
            <Text style={styles.statValue}>{s.value}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kontaktdaten</Text>
        {INFO_ROWS.map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Text style={styles.infoLabel}>{row.label}</Text>
            <Text style={styles.infoValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Aktionen</Text>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📋 Trainingsplan zuweisen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionButton}>
          <Text style={styles.actionText}>📅 Termin buchen</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.actionButton, styles.dangerButton]}>
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Mitgliedschaft kündigen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16 },
  header: { alignItems: 'center', paddingVertical: 8 },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 32, fontWeight: '700', color: '#6366f1' },
  name: { fontSize: 22, fontWeight: '700', color: '#111827' },
  sub: { color: '#9ca3af', fontSize: 13, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: 10 },
  statTile: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  statValue: { fontSize: 22, fontWeight: '700', color: '#6366f1' },
  statLabel: { fontSize: 11, color: '#6b7280', marginTop: 2 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 2 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15, marginBottom: 10 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  infoLabel: { color: '#6b7280', fontSize: 14 },
  infoValue: { color: '#111827', fontSize: 14, fontWeight: '500' },
  actionButton: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  dangerButton: { borderBottomWidth: 0, marginTop: 4 },
  actionText: { fontSize: 14, color: '#374151' },
});
