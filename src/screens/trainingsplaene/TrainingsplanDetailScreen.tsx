import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList, PlanUebung, Schwierigkeitsgrad } from '../../types';
import { useTrainingsplanStore } from '../../store/trainingsplanStore';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainingsplanDetail'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainingsplanDetail'>;
};

const LEVEL_COLOR: Record<Schwierigkeitsgrad, { bg: string; text: string }> = {
  Anfänger:       { bg: C.successBg,  text: C.success },
  Fortgeschritten:{ bg: C.warningBg,  text: C.warning },
  Profi:          { bg: C.dangerBg,   text: C.danger },
};

export default function TrainingsplanDetailScreen({ navigation, route }: Props) {
  const { getPlanById, deletePlan } = useTrainingsplanStore();
  const { getKundeById } = useKundenStore();

  const plan = getPlanById(route.params.planId);
  if (!plan) return (
    <View style={styles.notFound}>
      <Text style={styles.notFoundText}>Plan nicht gefunden.</Text>
    </View>
  );

  const kunde = plan.kundeId ? getKundeById(plan.kundeId) : undefined;
  const lc = LEVEL_COLOR[plan.schwierigkeitsgrad];

  const handleDelete = () =>
    Alert.alert('Plan löschen', `"${plan.name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive',
        onPress: () => { deletePlan(plan.id); navigation.goBack(); },
      },
    ]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View style={[styles.levelBadge, { backgroundColor: lc.bg }]}>
            <Text style={[styles.levelText, { color: lc.text }]}>{plan.schwierigkeitsgrad}</Text>
          </View>
          {!plan.kundeId && (
            <View style={styles.templateBadge}>
              <Text style={styles.templateText}>Template</Text>
            </View>
          )}
        </View>
        <Text style={styles.heroName}>{plan.name}</Text>
        <View style={styles.heroMeta}>
          <Text style={styles.heroMetaItem}>🏋️ {plan.uebungen.length} Übungen</Text>
          <Text style={styles.heroMetaItem}>📅 {new Date(plan.erstellt).toLocaleDateString('de-DE')}</Text>
        </View>
      </View>

      {/* Kunde */}
      {kunde && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Zugewiesen an</Text>
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
      {plan.notizen && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Notizen</Text>
          <Text style={styles.notizen}>{plan.notizen}</Text>
        </View>
      )}

      {/* Übungen */}
      <View style={styles.uebungenSection}>
        <Text style={styles.uebungenTitle}>Übungen</Text>
        {plan.uebungen.map((u, i) => (
          <UebungCard key={u.id} uebung={u} index={i} />
        ))}
      </View>

      {/* Aktionen */}
      <TouchableOpacity
        style={styles.editBtn}
        onPress={() => navigation.navigate('TrainingsplanForm', { planId: plan.id })}
      >
        <Text style={styles.editBtnText}>✏️  Bearbeiten</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
        <Text style={styles.deleteBtnText}>Plan löschen</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function UebungCard({ uebung, index }: { uebung: PlanUebung; index: number }) {
  return (
    <View style={styles.uebungCard}>
      <View style={styles.uebungNum}>
        <Text style={styles.uebungNumText}>{index + 1}</Text>
      </View>
      <View style={styles.uebungBody}>
        <Text style={styles.uebungName}>{uebung.name}</Text>
        <View style={styles.uebungStats}>
          <StatChip label="Sätze" value={String(uebung.saetze)} />
          <StatChip label="Wdh."  value={String(uebung.wiederholungen)} />
          {uebung.gewicht !== undefined && (
            <StatChip label="Gewicht" value={`${uebung.gewicht} kg`} />
          )}
          <StatChip label="Pause" value={`${uebung.pause}s`} />
        </View>
      </View>
    </View>
  );
}

function StatChip({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statChip}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted },

  hero: { backgroundColor: C.primary, borderRadius: R.lg, padding: SP.xl, gap: SP.sm },
  heroTop: { flexDirection: 'row', gap: SP.sm },
  levelBadge: { borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.xs },
  levelText: { fontSize: FONT.sm, fontWeight: '700' },
  templateBadge: { backgroundColor: 'rgba(249,115,22,0.2)', borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.xs },
  templateText: { color: C.accent, fontSize: FONT.sm, fontWeight: '700' },
  heroName: { color: C.white, fontSize: FONT.xl, fontWeight: '800' },
  heroMeta: { flexDirection: 'row', gap: SP.lg },
  heroMetaItem: { color: 'rgba(255,255,255,0.7)', fontSize: FONT.sm },

  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.sm, ...SHADOW_SM },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  kundeRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontWeight: '700', fontSize: FONT.base, color: C.primary },
  kundeName: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  kundeEmail: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  notizen: { fontSize: FONT.base, color: C.textSub, lineHeight: 22 },

  uebungenSection: { gap: SP.sm },
  uebungenTitle: { fontWeight: '700', fontSize: FONT.md, color: C.text },
  uebungCard: {
    backgroundColor: C.card, borderRadius: R.md,
    flexDirection: 'row', alignItems: 'flex-start', gap: SP.md, padding: SP.lg, ...SHADOW_SM,
  },
  uebungNum: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center',
  },
  uebungNumText: { fontWeight: '800', fontSize: FONT.sm, color: C.primary },
  uebungBody: { flex: 1, gap: SP.sm },
  uebungName: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  uebungStats: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  statChip: { backgroundColor: C.bg, borderRadius: R.sm, paddingHorizontal: SP.sm, paddingVertical: SP.xs, alignItems: 'center', minWidth: 52 },
  statValue: { fontWeight: '700', fontSize: FONT.sm, color: C.primary },
  statLabel: { fontSize: FONT.xs, color: C.textMuted },

  editBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', ...SHADOW_SM },
  editBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },
  deleteBtn: { paddingVertical: SP.md, alignItems: 'center' },
  deleteBtnText: { color: C.textMuted, fontSize: FONT.sm },
});
