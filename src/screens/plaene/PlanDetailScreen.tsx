import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaeneStackParamList } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useAthletenStore } from '../../store/athletenStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import MonthCalendar from '../../components/MonthCalendar';
import { C, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'PlanDetail'>;
  route: RouteProp<PlaeneStackParamList, 'PlanDetail'>;
};

const SPORTART_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  'Kraftsport':      { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E', dot: '#CBFF3E' },
  'Kampfsport':      { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66', dot: '#FF6A3D' },
  'Leichtathletik':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Konditionierung': { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Mobility':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF', dot: '#C39CFF' },
  'Crossfit':        { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582', dot: '#7AE582' },
};

type ViewMode = 'wochen' | 'kalender';

export default function PlanDetailScreen({ navigation, route }: Props) {
  const { getPlanById, deletePlan, deleteWoche } = usePlanStore();
  const { sportler } = useAthletenStore();
  const insets = useSafeAreaInsets();
  const [viewMode, setViewMode] = useState<ViewMode>('wochen');

  const plan = getPlanById(route.params.planId);

  if (!plan) {
    navigation.goBack();
    return null;
  }

  const assignedSportler = sportler.filter((s) => plan.sportlerIds.includes(s.id));
  const sc = SPORTART_COLORS[plan.sportart ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textDim };

  const handleDelete = () => {
    Alert.alert('Plan löschen', `„${plan.name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => { deletePlan(plan.id); navigation.goBack(); } },
    ]);
  };

  const handleDeleteWoche = (wocheId: string, nr: number) => {
    Alert.alert('Woche löschen', `Woche ${nr} wirklich entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteWoche(plan.id, wocheId) },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
          <GBIcon name="chevronLeft" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => navigation.navigate('PlanForm', { planId: plan.id })}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <GBIcon name="edit" size={18} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Plan Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerCardTop}>
            <View style={styles.planIconWrap}>
              <GBIcon name="dumbbell" size={28} color={C.accentContrast} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.planName}>{plan.name}</Text>
              {plan.sportart && (
                <View style={[styles.chip, { backgroundColor: sc.bg }]}>
                  <View style={[styles.chipDot, { backgroundColor: sc.dot }]} />
                  <Text style={[styles.chipText, { color: sc.fg }]}>{plan.sportart}</Text>
                </View>
              )}
            </View>
          </View>
          {plan.beschreibung ? (
            <Text style={styles.planDesc}>{plan.beschreibung}</Text>
          ) : null}
          {plan.startdatum ? (
            <View style={styles.datumRow}>
              <GBIcon name="calendar" size={13} color={C.textMuted} />
              <Text style={styles.datumText}>Start: {plan.startdatum}</Text>
            </View>
          ) : null}
        </View>

        {/* Assigned Athletes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Sportler</Text>
          {assignedSportler.length === 0 ? (
            <View style={styles.noAthletes}>
              <Text style={styles.noAthletesText}>Kein Sportler zugewiesen</Text>
            </View>
          ) : (
            <View style={styles.athleteRow}>
              {assignedSportler.map((sp) => (
                <View key={sp.id} style={styles.athleteChip}>
                  <GBAvatar name={sp.name} initials={sp.initials} size={32} />
                  <Text style={styles.athleteName}>{sp.name.split(' ')[0]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* View Mode Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'wochen' && styles.toggleBtnActive]}
            onPress={() => setViewMode('wochen')}
            activeOpacity={0.7}
          >
            <GBIcon name="layers" size={14} color={viewMode === 'wochen' ? C.accentContrast : C.textMuted} />
            <Text style={[styles.toggleText, viewMode === 'wochen' && styles.toggleTextActive]}>
              Wochen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, viewMode === 'kalender' && styles.toggleBtnActive]}
            onPress={() => setViewMode('kalender')}
            activeOpacity={0.7}
          >
            <GBIcon name="calendar" size={14} color={viewMode === 'kalender' ? C.accentContrast : C.textMuted} />
            <Text style={[styles.toggleText, viewMode === 'kalender' && styles.toggleTextActive]}>
              Kalender
            </Text>
          </TouchableOpacity>
        </View>

        {/* Wochen View */}
        {viewMode === 'wochen' && (
          <View style={styles.wochenSection}>
            {plan.wochen.length === 0 ? (
              <View style={styles.emptyWochen}>
                <GBIcon name="layers" size={36} color={C.textDim} />
                <Text style={styles.emptyWochenTitle}>Noch keine Wochen</Text>
                <Text style={styles.emptyWochenSub}>Füge die erste Trainingswoche hinzu.</Text>
              </View>
            ) : (
              plan.wochen.map((woche) => (
                <TouchableOpacity
                  key={woche.id}
                  style={styles.wocheCard}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('PlanWocheForm', { planId: plan.id, wocheId: woche.id })}
                >
                  <View style={styles.wocheStripe} />
                  <View style={styles.wocheBody}>
                    <View style={styles.wocheTop}>
                      <Text style={styles.wocheTitle}>Woche {woche.wochennummer}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteWoche(woche.id, woche.wochennummer)}
                        style={styles.wocheDeleteBtn}
                        activeOpacity={0.7}
                      >
                        <GBIcon name="trash" size={15} color={C.warn} />
                      </TouchableOpacity>
                    </View>
                    {woche.notizen ? (
                      <Text style={styles.wocheNotiz}>{woche.notizen}</Text>
                    ) : (
                      <Text style={styles.wocheNotizEmpty}>Keine Notizen</Text>
                    )}
                    <View style={styles.wocheBadge}>
                      <Text style={styles.wocheBadgeText}>0 Einheiten</Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))
            )}

            {/* Add Week Button */}
            <TouchableOpacity
              style={styles.addWocheBtn}
              onPress={() => navigation.navigate('PlanWocheForm', { planId: plan.id })}
              activeOpacity={0.8}
            >
              <GBIcon name="plus" size={18} color={C.accent} />
              <Text style={styles.addWocheBtnText}>Woche hinzufügen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Kalender View */}
        {viewMode === 'kalender' && (
          <MonthCalendar legendLabel="Einheit geplant" />
        )}

        {/* Delete Plan */}
        <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.8}>
          <GBIcon name="trash" size={17} color={C.warn} />
          <Text style={styles.deleteBtnText}>Plan löschen</Text>
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.md, gap: SP.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },

  content: { paddingHorizontal: SP.xl, gap: SP.lg, paddingTop: SP.sm },

  headerCard:    { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.lg, gap: SP.md },
  headerCardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.md },
  planIconWrap:  { width: 52, height: 52, borderRadius: R.lg, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  headerInfo:    { flex: 1, gap: SP.sm, paddingTop: 2 },
  planName:      { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.4, lineHeight: 26 },
  planDesc:      { fontSize: FONT.sm, color: C.textSub, lineHeight: 20 },
  datumRow:      { flexDirection: 'row', alignItems: 'center', gap: 6 },
  datumText:     { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textMuted, fontWeight: '600' },

  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full, alignSelf: 'flex-start' },
  chipDot:  { width: 5, height: 5, borderRadius: 3 },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },

  section:      { gap: SP.sm },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.6 },

  athleteRow:  { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  athleteChip: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.surface, borderRadius: R.full, borderWidth: 1, borderColor: C.border, paddingRight: SP.md, paddingLeft: 4, paddingVertical: 4 },
  athleteName: { fontSize: FONT.sm, fontWeight: '600', color: C.text },

  noAthletes:     { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 1, borderColor: C.border, padding: SP.lg, alignItems: 'center' },
  noAthletesText: { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },

  toggle:          { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: 4, gap: 4 },
  toggleBtn:       { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SP.sm, borderRadius: R.md },
  toggleBtnActive: { backgroundColor: C.accent },
  toggleText:      { fontSize: FONT.sm, fontWeight: '700', color: C.textMuted },
  toggleTextActive: { color: C.accentContrast },

  wochenSection: { gap: SP.sm },

  wocheCard:      { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  wocheStripe:    { width: 3, backgroundColor: C.accent },
  wocheBody:      { flex: 1, padding: SP.lg, gap: SP.sm },
  wocheTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wocheTitle:     { fontSize: FONT.md, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  wocheDeleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,106,61,0.10)', alignItems: 'center', justifyContent: 'center' },
  wocheNotiz:     { fontSize: FONT.sm, color: C.textSub },
  wocheNotizEmpty: { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },
  wocheBadge:     { alignSelf: 'flex-start', backgroundColor: C.surfaceAlt, borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 3 },
  wocheBadgeText: { fontFamily: FONT_MONO, fontSize: 11, color: C.textDim, fontWeight: '600' },

  emptyWochen:      { alignItems: 'center', paddingVertical: 40, gap: SP.sm },
  emptyWochenTitle: { fontSize: FONT.md, fontWeight: '700', color: C.textSub },
  emptyWochenSub:   { fontSize: FONT.sm, color: C.textDim },

  addWocheBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.04)' },
  addWocheBtnText: { fontSize: FONT.base, fontWeight: '700', color: C.accent },

  deleteBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,106,61,0.25)', backgroundColor: 'rgba(255,106,61,0.06)' },
  deleteBtnText: { fontSize: FONT.base, fontWeight: '600', color: C.warn },
});
