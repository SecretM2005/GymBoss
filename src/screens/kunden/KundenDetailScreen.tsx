import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { KundenStackParamList, Kunde } from '../../types';
import { useKundenStore } from '../../store/kundenStore';

type Props = {
  navigation: StackNavigationProp<KundenStackParamList, 'KundenDetail'>;
  route: RouteProp<KundenStackParamList, 'KundenDetail'>;
};

function initials(k: Kunde) {
  return `${k.vorname.charAt(0)}${k.nachname.charAt(0)}`.toUpperCase();
}

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function KundenDetailScreen({ navigation, route }: Props) {
  const { getKundeById, deleteKunde, updateKunde } = useKundenStore();
  const kunde = getKundeById(route.params.kundeId);

  if (!kunde) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Kunde nicht gefunden.</Text>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert(
      'Kunde löschen',
      `Möchtest du ${kunde.vorname} ${kunde.nachname} wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            deleteKunde(kunde.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const handleToggleStatus = () => {
    const neuerStatus = kunde.status === 'aktiv' ? 'inaktiv' : 'aktiv';
    Alert.alert(
      'Status ändern',
      `Mitgliedschaft auf "${neuerStatus}" setzen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Ändern', onPress: () => updateKunde(kunde.id, { status: neuerStatus }) },
      ]
    );
  };

  const isAktiv = kunde.status === 'aktiv';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.avatar, !isAktiv && styles.avatarInaktiv]}>
          <Text style={styles.avatarText}>{initials(kunde)}</Text>
        </View>
        <Text style={styles.heroName}>{kunde.vorname} {kunde.nachname}</Text>
        <TouchableOpacity
          style={[styles.statusBadge, isAktiv ? styles.statusAktiv : styles.statusInaktiv]}
          onPress={handleToggleStatus}
        >
          <Text style={[styles.statusText, isAktiv ? styles.statusTextAktiv : styles.statusTextInaktiv]}>
            {isAktiv ? '● Aktiv' : '○ Inaktiv'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Kontaktdaten */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kontakt</Text>
        {[
          { icon: '✉️', label: 'E-Mail', value: kunde.email },
          { icon: '📱', label: 'Telefon', value: kunde.telefon },
          { icon: '📅', label: 'Mitglied seit', value: formatDatum(kunde.eintrittsdatum) },
        ].map((row) => (
          <View key={row.label} style={styles.infoRow}>
            <Text style={styles.infoIcon}>{row.icon}</Text>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Notizen */}
      {kunde.notizen ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen</Text>
          <Text style={styles.notizen}>{kunde.notizen}</Text>
        </View>
      ) : null}

      {/* Aktionen */}
      <View style={styles.actionsSection}>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('KundeForm', { kundeId: kunde.id })}
        >
          <Text style={styles.editButtonText}>✏️  Bearbeiten</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
          <Text style={styles.deleteButtonText}>Kunde löschen</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: '#9ca3af', fontSize: 16 },

  hero: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  avatarInaktiv: { backgroundColor: '#f3f4f6' },
  avatarText: { fontSize: 28, fontWeight: '800', color: '#6366f1' },
  heroName: { fontSize: 22, fontWeight: '800', color: '#111827' },
  statusBadge: { borderRadius: 20, paddingHorizontal: 14, paddingVertical: 6 },
  statusAktiv: { backgroundColor: '#dcfce7' },
  statusInaktiv: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 13, fontWeight: '700' },
  statusTextAktiv: { color: '#16a34a' },
  statusTextInaktiv: { color: '#9ca3af' },

  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 4 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 14, marginBottom: 8 },

  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f9fafb',
  },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: 11, color: '#9ca3af', fontWeight: '500' },
  infoValue: { fontSize: 15, color: '#111827', fontWeight: '500', marginTop: 1 },

  notizen: { fontSize: 14, color: '#374151', lineHeight: 22 },

  actionsSection: { gap: 10 },
  editButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  editButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  deleteButton: {
    borderWidth: 1.5,
    borderColor: '#ef4444',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: { color: '#ef4444', fontWeight: '600', fontSize: 15 },
});
