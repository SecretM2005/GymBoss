import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { KundenStackParamList, Kunde } from '../../types';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<KundenStackParamList, 'KundenDetail'>;
  route: RouteProp<KundenStackParamList, 'KundenDetail'>;
};

function initials(k: Kunde) {
  return `${k.vorname.charAt(0)}${k.nachname.charAt(0)}`.toUpperCase();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function KundenDetailScreen({ navigation, route }: Props) {
  const { getKundeById, deleteKunde, updateKunde } = useKundenStore();
  const kunde = getKundeById(route.params.kundeId);

  if (!kunde) return (
    <View style={styles.notFound}>
      <Text style={styles.notFoundText}>Kunde nicht gefunden.</Text>
    </View>
  );

  const isAktiv = kunde.status === 'aktiv';

  const handleToggleStatus = () =>
    Alert.alert('Status ändern', `Mitgliedschaft auf "${isAktiv ? 'inaktiv' : 'aktiv'}" setzen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Ändern', onPress: () => updateKunde(kunde.id, { status: isAktiv ? 'inaktiv' : 'aktiv' }) },
    ]);

  const handleDelete = () =>
    Alert.alert('Kunde löschen', `${kunde.vorname} ${kunde.nachname} wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => { deleteKunde(kunde.id); navigation.goBack(); } },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={[styles.avatar, !isAktiv && styles.avatarInaktiv]}>
          <Text style={styles.avatarText}>{initials(kunde)}</Text>
        </View>
        <Text style={styles.heroName}>{kunde.vorname} {kunde.nachname}</Text>
        <TouchableOpacity
          onPress={handleToggleStatus}
          style={[styles.statusBadge, isAktiv ? styles.statusAktiv : styles.statusInaktiv]}
        >
          <Text style={[styles.statusText, isAktiv ? styles.statusTextAktiv : styles.statusTextInaktiv]}>
            {isAktiv ? '● Aktiv' : '○ Inaktiv'}  –  antippen zum Wechseln
          </Text>
        </TouchableOpacity>
      </View>

      {/* Kontakt */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Kontakt</Text>
        {[
          { icon: '✉️', label: 'E-Mail',        value: kunde.email },
          { icon: '📱', label: 'Telefon',       value: kunde.telefon },
          { icon: '📅', label: 'Mitglied seit', value: formatDate(kunde.eintrittsdatum) },
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
          <Text style={styles.sectionLabel}>Notizen</Text>
          <Text style={styles.notizen}>{kunde.notizen}</Text>
        </View>
      ) : null}

      {/* Aktionen */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('KundeForm', { kundeId: kunde.id })}
      >
        <Text style={styles.editBtnText}>✏️  Bearbeiten</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Kunde löschen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted },

  hero: { backgroundColor: C.card, borderRadius: R.lg, padding: SP.xl, alignItems: 'center', gap: SP.sm, ...SHADOW_SM },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SP.xs },
  avatarInaktiv: { backgroundColor: C.bg },
  avatarText: { fontSize: 28, fontWeight: '800', color: C.primary },
  heroName: { fontSize: FONT.xl, fontWeight: '800', color: C.text },
  statusBadge: { borderRadius: R.full, paddingHorizontal: SP.lg, paddingVertical: SP.xs + 2 },
  statusAktiv: { backgroundColor: C.successBg },
  statusInaktiv: { backgroundColor: C.bg },
  statusText: { fontSize: FONT.sm, fontWeight: '600' },
  statusTextAktiv: { color: C.success },
  statusTextInaktiv: { color: C.textMuted },

  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: 2, ...SHADOW_SM },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: SP.sm },

  infoRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingVertical: SP.sm, borderBottomWidth: 1, borderBottomColor: C.bg },
  infoIcon: { fontSize: 18, width: 24, textAlign: 'center' },
  infoContent: { flex: 1 },
  infoLabel: { fontSize: FONT.xs, color: C.textMuted },
  infoValue: { fontSize: FONT.base, color: C.text, fontWeight: '500', marginTop: 1 },

  notizen: { fontSize: FONT.base, color: C.textSub, lineHeight: 22 },

  editBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', ...SHADOW_SM },
  editBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },
  deleteBtn: { paddingVertical: SP.md, alignItems: 'center' },
  deleteBtnText: { color: C.textMuted, fontSize: FONT.sm },
});
