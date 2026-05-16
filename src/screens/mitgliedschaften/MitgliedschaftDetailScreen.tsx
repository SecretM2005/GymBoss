import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MitgliedschaftenStackParamList, MitgliedschaftStatus } from '../../types';
import { useMitgliedschaftenStore, getEffectiveStatus } from '../../store/mitgliedschaftenStore';
import { useKundenStore } from '../../store/kundenStore';

type Props = {
  navigation: StackNavigationProp<MitgliedschaftenStackParamList, 'MitgliedschaftDetail'>;
  route: RouteProp<MitgliedschaftenStackParamList, 'MitgliedschaftDetail'>;
};

const STATUS_CONFIG: Record<MitgliedschaftStatus, { label: string; bg: string; text: string }> = {
  aktiv:      { label: '● Aktiv',      bg: '#dcfce7', text: '#16a34a' },
  abgelaufen: { label: '⚠ Abgelaufen', bg: '#fef9c3', text: '#ca8a04' },
  gekuendigt: { label: '✕ Gekündigt',  bg: '#fee2e2', text: '#ef4444' },
};

const FEATURES: Record<'Basic' | 'Premium', string[]> = {
  Basic:   ['Gerätetraining (unbegrenzt)', 'Umkleiden & Duschen', 'App-Zugang'],
  Premium: ['Alles aus Basic', 'Personal Training 4×/Monat', 'Ernährungsberatung', 'Alle Gruppenkurse'],
};

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

function laufzeitInMonaten(start: string, end: string): number {
  const s = new Date(start);
  const e = new Date(end);
  return Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24 * 30.44));
}

export default function MitgliedschaftDetailScreen({ navigation, route }: Props) {
  const { getMitgliedschaftById, updateMitgliedschaft, deleteMitgliedschaft } = useMitgliedschaftenStore();
  const { getKundeById } = useKundenStore();

  const m = getMitgliedschaftById(route.params.mitgliedschaftId);
  if (!m) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Mitgliedschaft nicht gefunden.</Text>
      </View>
    );
  }

  const effectiveStatus = getEffectiveStatus(m);
  const sc = STATUS_CONFIG[effectiveStatus];
  const kunde = getKundeById(m.kundeId);
  const kundeName = kunde ? `${kunde.vorname} ${kunde.nachname}` : '–';
  const monate = laufzeitInMonaten(m.startdatum, m.enddatum);
  const isPremium = m.typ === 'Premium';

  const handleKuendigen = () => {
    Alert.alert(
      'Mitgliedschaft kündigen',
      `Die Mitgliedschaft von ${kundeName} wirklich kündigen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Kündigen',
          style: 'destructive',
          onPress: () => updateMitgliedschaft(m.id, { status: 'gekuendigt' }),
        },
      ]
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Mitgliedschaft löschen',
      'Diese Mitgliedschaft endgültig löschen?',
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            deleteMitgliedschaft(m.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={[styles.hero, isPremium ? styles.heroPremium : styles.heroBasic]}>
        <Text style={styles.heroTyp}>{m.typ}</Text>
        <Text style={styles.heroPreis}>{m.preis} €<Text style={styles.heroPreisUnit}> / Monat</Text></Text>
        <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
          <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
        </View>
      </View>

      {/* Kunde */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mitglied</Text>
        <View style={styles.kundeRow}>
          <View style={styles.kundeAvatar}>
            <Text style={styles.kundeAvatarText}>
              {kunde ? `${kunde.vorname.charAt(0)}${kunde.nachname.charAt(0)}` : '?'}
            </Text>
          </View>
          <View>
            <Text style={styles.kundeName}>{kundeName}</Text>
            {kunde && <Text style={styles.kundeEmail}>{kunde.email}</Text>}
          </View>
        </View>
      </View>

      {/* Vertragsdaten */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vertragsdetails</Text>
        {[
          { label: 'Startdatum',  value: formatDatum(m.startdatum) },
          { label: 'Enddatum',    value: formatDatum(m.enddatum) },
          { label: 'Laufzeit',    value: `${monate} Monat${monate !== 1 ? 'e' : ''}` },
          { label: 'Gesamtpreis', value: `${m.preis * monate} €` },
        ].map((row) => (
          <View key={row.label} style={styles.detailRow}>
            <Text style={styles.detailLabel}>{row.label}</Text>
            <Text style={styles.detailValue}>{row.value}</Text>
          </View>
        ))}
      </View>

      {/* Leistungen */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Enthaltene Leistungen</Text>
        {FEATURES[m.typ].map((f) => (
          <View key={f} style={styles.featureRow}>
            <Text style={[styles.featureCheck, isPremium ? styles.featureCheckPremium : styles.featureCheckBasic]}>✓</Text>
            <Text style={styles.featureText}>{f}</Text>
          </View>
        ))}
      </View>

      {/* Aktionen */}
      {effectiveStatus === 'aktiv' && (
        <TouchableOpacity style={styles.kuendigenButton} onPress={handleKuendigen}>
          <Text style={styles.kuendigenText}>Mitgliedschaft kündigen</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteText}>Eintrag löschen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: '#9ca3af', fontSize: 16 },

  hero: { borderRadius: 16, padding: 24, gap: 6 },
  heroPremium: { backgroundColor: '#6366f1' },
  heroBasic: { backgroundColor: '#374151' },
  heroTyp: { color: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1 },
  heroPreis: { color: '#fff', fontSize: 36, fontWeight: '800' },
  heroPreisUnit: { fontSize: 18, fontWeight: '400' },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5, marginTop: 4 },
  statusText: { fontSize: 13, fontWeight: '700' },

  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 14, marginBottom: 8 },

  kundeRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  kundeAvatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center',
  },
  kundeAvatarText: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  kundeName: { fontWeight: '700', color: '#111827', fontSize: 15 },
  kundeEmail: { color: '#9ca3af', fontSize: 12, marginTop: 2 },

  detailRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#f9fafb',
  },
  detailLabel: { color: '#6b7280', fontSize: 14 },
  detailValue: { color: '#111827', fontSize: 14, fontWeight: '600' },

  featureRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 5 },
  featureCheck: { fontSize: 14, fontWeight: '700', width: 18 },
  featureCheckPremium: { color: '#6366f1' },
  featureCheckBasic: { color: '#6b7280' },
  featureText: { color: '#374151', fontSize: 14 },

  kuendigenButton: {
    borderWidth: 1.5, borderColor: '#ef4444',
    borderRadius: 10, paddingVertical: 14, alignItems: 'center',
  },
  kuendigenText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
  deleteButton: {
    paddingVertical: 14, alignItems: 'center',
  },
  deleteText: { color: '#9ca3af', fontSize: 14 },
});
