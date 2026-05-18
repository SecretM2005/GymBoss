import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { KalenderStackParamList } from '../../types';
import { useTerminStore } from '../../store/terminStore';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<KalenderStackParamList, 'TerminDetail'>;
  route: RouteProp<KalenderStackParamList, 'TerminDetail'>;
};

function endzeit(uhrzeit: string, dauer: number) {
  const [h, m] = uhrzeit.split(':').map(Number);
  const total = h * 60 + m + dauer;
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

export default function TerminDetailScreen({ navigation, route }: Props) {
  const { getTerminById, deleteTermin } = useTerminStore();
  const { getKundeById } = useKundenStore();

  const termin = getTerminById(route.params.terminId);
  if (!termin) return (
    <View style={styles.notFound}>
      <Text style={styles.notFoundText}>Termin nicht gefunden.</Text>
    </View>
  );

  const kunde = getKundeById(termin.kundeId);

  const handleDelete = () =>
    Alert.alert('Termin löschen', `"${termin.titel}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive',
        onPress: () => { deleteTermin(termin.id); navigation.goBack(); },
      },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <Text style={styles.heroTime}>{termin.uhrzeit} – {endzeit(termin.uhrzeit, termin.dauer)} Uhr</Text>
        <Text style={styles.heroTitle}>{termin.titel}</Text>
        <Text style={styles.heroDate}>{formatDate(termin.datum)}</Text>
        <View style={styles.heroDauer}>
          <Text style={styles.heroDauerText}>⏱ {termin.dauer} Minuten</Text>
        </View>
      </View>

      {/* Kunde */}
      {kunde && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kunde</Text>
          <View style={styles.kundeRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{kunde.vorname.charAt(0)}{kunde.nachname.charAt(0)}</Text>
            </View>
            <View>
              <Text style={styles.kundeName}>{kunde.vorname} {kunde.nachname}</Text>
              <Text style={styles.kundeEmail}>{kunde.email}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Notizen */}
      {termin.notizen && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen</Text>
          <Text style={styles.notizen}>{termin.notizen}</Text>
        </View>
      )}

      {/* Aktionen */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('TerminForm', { terminId: termin.id })}
      >
        <Text style={styles.editBtnText}>✏️  Bearbeiten</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Termin löschen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted },

  hero: {
    backgroundColor: C.primary,
    borderRadius: R.lg,
    padding: SP.xl,
    gap: SP.xs,
  },
  heroTime: { color: 'rgba(255,255,255,0.65)', fontSize: FONT.sm, fontWeight: '600' },
  heroTitle: { color: C.white, fontSize: FONT.xl, fontWeight: '800' },
  heroDate: { color: 'rgba(255,255,255,0.8)', fontSize: FONT.sm },
  heroDauer: {
    marginTop: SP.sm,
    alignSelf: 'flex-start',
    backgroundColor: C.accent,
    borderRadius: R.full,
    paddingHorizontal: SP.md,
    paddingVertical: SP.xs,
  },
  heroDauerText: { color: C.white, fontSize: FONT.sm, fontWeight: '700' },

  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.sm, ...SHADOW_SM },
  sectionTitle: { fontWeight: '700', fontSize: FONT.sm, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  kundeRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontWeight: '700', fontSize: FONT.base, color: C.primary },
  kundeName: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  kundeEmail: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },

  notizen: { fontSize: FONT.base, color: C.textSub, lineHeight: 22 },

  editBtn: {
    backgroundColor: C.accent, borderRadius: R.md,
    paddingVertical: SP.lg - 2, alignItems: 'center', ...SHADOW_SM,
  },
  editBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },
  deleteBtn: { paddingVertical: SP.md, alignItems: 'center' },
  deleteBtnText: { color: C.textMuted, fontSize: FONT.sm },
});
