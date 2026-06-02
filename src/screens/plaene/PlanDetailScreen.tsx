import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaeneStackParamList, TrainingsPlan, Einheit } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useAthletenStore } from '../../store/athletenStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import MonthCalendar from '../../components/MonthCalendar';
import { buildUebSuffix, formatWocheRange } from './EinheitDetailScreen';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';
import { useSettingsStore } from '../../store/settingsStore';
import { exportPlanAsPdf } from '../../utils/planPdfExport';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'PlanDetail'>;
  route: RouteProp<PlaeneStackParamList, 'PlanDetail'>;
};

const MONATE_KURZ = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const WOCHENTAGE_LANG = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

const SPORTART_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  'Kraftsport':      { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E', dot: '#CBFF3E' },
  'Kampfsport':      { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66', dot: '#FF6A3D' },
  'Leichtathletik':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Konditionierung': { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Mobility':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF', dot: '#C39CFF' },
  'Crossfit':        { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582', dot: '#7AE582' },
};

function parseDatum(str: string): Date | null {
  const parts = str.split('.');
  if (parts.length === 3) {
    return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
  }
  return null;
}

function getWocheIdForDate(plan: TrainingsPlan, year: number, month: number, day: number): string | null {
  if (plan.wochen.length === 0) return null;
  if (plan.wochen.length === 1) return plan.wochen[0].id;
  if (plan.startdatum) {
    const start = parseDatum(plan.startdatum);
    if (start) {
      const target = new Date(year, month, day);
      const diffDays = Math.floor((target.getTime() - start.getTime()) / 86400000);
      if (diffDays >= 0) {
        const wocheNr = Math.floor(diffDays / 7) + 1;
        const woche = plan.wochen.find((w) => w.wochennummer === wocheNr);
        if (woche) return woche.id;
      }
    }
  }
  return plan.wochen[0].id;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function dayOfWeek(iso: string): string {
  const d = new Date(iso);
  return WOCHENTAGE_LANG[(d.getDay() + 6) % 7];
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${WOCHENTAGE_LANG[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${MONATE_KURZ[d.getMonth()]}`;
}

export default function PlanDetailScreen({ navigation, route }: Props) {
  const { getPlanById, deletePlan, deleteWoche, duplicatePlan } = usePlanStore();
  const { sportler } = useAthletenStore();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const viewMode = useSettingsStore((s) => s.coachingView);
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedIso, setSelectedIso] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  const plan = getPlanById(route.params.planId);

  if (!plan) {
    navigation.goBack();
    return null;
  }

  const assignedSportler = sportler.filter((s) => plan.sportlerIds.includes(s.id));
  const sc = SPORTART_COLORS[plan.sportart ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textDim };

  // Compute marked days from einheiten with datum in current calendar month
  const markedDays = useMemo(() => {
    const days = new Set<number>();
    plan.wochen.flatMap((w) => w.einheiten).forEach((e) => {
      if (e.datum) {
        const d = new Date(e.datum);
        if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
          days.add(d.getDate());
        }
      }
    });
    return days;
  }, [plan, calYear, calMonth]);

  // Einheiten for selected day
  const dayEinheiten = useMemo((): Array<{ einheit: Einheit; wocheId: string }> => {
    if (!selectedIso) return [];
    const result: Array<{ einheit: Einheit; wocheId: string }> = [];
    plan.wochen.forEach((w) => {
      w.einheiten.forEach((e) => {
        if (e.datum === selectedIso) result.push({ einheit: e, wocheId: w.id });
      });
    });
    return result;
  }, [plan, selectedIso]);

  const handleDayPress = (year: number, month: number, day: number) => {
    const iso = isoDate(year, month, day);
    setSelectedIso((prev) => (prev === iso ? null : iso));
  };

  const handleAddOnDay = () => {
    if (!selectedIso) return;
    const [yr, mo, dy] = selectedIso.split('-').map(Number);
    const wocheId = getWocheIdForDate(plan, yr, mo - 1, dy);
    if (!wocheId) {
      Alert.alert(
        'Keine Woche',
        'Lege zuerst eine Trainingswoche an, bevor du Einheiten hinzufügst.',
        [
          { text: 'Abbrechen', style: 'cancel' },
          { text: 'Woche anlegen', onPress: () => navigation.navigate('PlanWocheForm', { planId: plan.id }) },
        ],
      );
      return;
    }
    navigation.navigate('EinheitDetail', { planId: plan.id, wocheId, datum: selectedIso });
  };

  const handleDelete = () => {
    Alert.alert('Plan löschen', `„${plan.name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => { deletePlan(plan.id); navigation.goBack(); } },
    ]);
  };

  const handleDuplicate = () => {
    const newId = duplicatePlan(plan.id);
    if (newId) navigation.navigate('PlanDetail', { planId: newId });
  };

  const handleExport = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try {
      await exportPlanAsPdf(plan);
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteWoche = (wocheId: string, nr: number) => {
    Alert.alert('Woche löschen', `Woche ${nr} wirklich entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteWoche(plan.id, wocheId) },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
          <GBIcon name="chevronLeft" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={handleDuplicate}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <GBIcon name="copy" size={18} color={C.text} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={handleExport}
          style={styles.iconBtn}
          activeOpacity={0.7}
          disabled={isExporting}
        >
          <GBIcon name="share" size={18} color={isExporting ? C.textDim : C.text} />
        </TouchableOpacity>
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
        <View style={[styles.headerCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={styles.headerCardTop}>
            <View style={styles.planIconWrap}>
              <GBIcon name="dumbbell" size={28} color={C.accentContrast} />
            </View>
            <View style={styles.headerInfo}>
              <Text style={[styles.planName, { color: C.text }]}>{plan.name}</Text>
              {plan.sportart && (
                <View style={[styles.chip, { backgroundColor: sc.bg }]}>
                  <View style={[styles.chipDot, { backgroundColor: sc.dot }]} />
                  <Text style={[styles.chipText, { color: sc.fg }]}>{plan.sportart}</Text>
                </View>
              )}
            </View>
          </View>
          {plan.beschreibung ? (
            <Text style={[styles.planDesc, { color: C.textSub }]}>{plan.beschreibung}</Text>
          ) : null}
          {plan.startdatum ? (
            <View style={styles.datumRow}>
              <GBIcon name="calendar" size={13} color={C.textMuted} />
              <Text style={[styles.datumText, { color: C.textMuted }]}>Start: {plan.startdatum}</Text>
            </View>
          ) : null}
        </View>

        {/* Assigned Athletes */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Sportler</Text>
          {assignedSportler.length === 0 ? (
            <View style={[styles.noAthletes, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[styles.noAthletesText, { color: C.textDim }]}>Kein Sportler zugewiesen</Text>
            </View>
          ) : (
            <View style={styles.athleteRow}>
              {assignedSportler.map((sp) => (
                <View key={sp.id} style={[styles.athleteChip, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <GBAvatar name={sp.name} initials={sp.initials} size={32} />
                  <Text style={[styles.athleteName, { color: C.text }]}>{sp.name.split(' ')[0]}</Text>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Wochen View */}
        {viewMode === 'wochen' && (
          <View style={styles.wochenSection}>
            {!plan.startdatum && (
              <View style={[styles.startdatumHint, { backgroundColor: C.surface, borderColor: C.border }]}>
                <GBIcon name="info" size={14} color={C.warn} />
                <Text style={[styles.startdatumHintText, { color: C.warn }]}>
                  Kein Startdatum gesetzt — Datumsberechnung nicht möglich. Im Stift-Menü festlegen.
                </Text>
              </View>
            )}
            {plan.wochen.length === 0 ? (
              <View style={styles.emptyWochen}>
                <GBIcon name="layers" size={36} color={C.textDim} />
                <Text style={[styles.emptyWochenTitle, { color: C.textSub }]}>Noch keine Wochen</Text>
                <Text style={[styles.emptyWochenSub, { color: C.textDim }]}>Füge die erste Trainingswoche hinzu.</Text>
              </View>
            ) : (
              plan.wochen.map((woche) => {
                const dateRange = plan.startdatum
                  ? formatWocheRange(plan.startdatum, woche.wochennummer)
                  : null;
                return (
                  <TouchableOpacity
                    key={woche.id}
                    style={[styles.wocheCard, { backgroundColor: C.surface, borderColor: C.border }]}
                    activeOpacity={0.75}
                    onPress={() => navigation.navigate('PlanWocheDetail', { planId: plan.id, wocheId: woche.id })}
                  >
                    <View style={styles.wocheStripe} />
                    <View style={styles.wocheBody}>
                      <View style={styles.wocheTop}>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.wocheTitle, { color: C.text }]}>Woche {woche.wochennummer}</Text>
                          {dateRange && (
                            <Text style={[styles.wocheDateRange, { color: C.textDim }]}>{dateRange}</Text>
                          )}
                        </View>
                        <View style={styles.wocheActions}>
                          <TouchableOpacity
                            onPress={() => navigation.navigate('PlanWocheForm', { planId: plan.id, wocheId: woche.id })}
                            style={[styles.wocheEditBtn, { backgroundColor: C.surfaceAlt }]}
                            activeOpacity={0.7}
                          >
                            <GBIcon name="edit" size={14} color={C.textMuted} />
                          </TouchableOpacity>
                          <TouchableOpacity
                            onPress={() => handleDeleteWoche(woche.id, woche.wochennummer)}
                            style={styles.wocheDeleteBtn}
                            activeOpacity={0.7}
                          >
                            <GBIcon name="trash" size={15} color={C.warn} />
                          </TouchableOpacity>
                        </View>
                      </View>
                      {woche.notizen ? (
                        <Text style={[styles.wocheNotiz, { color: C.textSub }]}>{woche.notizen}</Text>
                      ) : null}
                      <View style={[styles.wocheBadge, { backgroundColor: C.surfaceAlt }]}>
                        <Text style={[styles.wocheBadgeText, { color: C.textDim }]}>
                          {woche.einheiten.length} {woche.einheiten.length === 1 ? 'Einheit' : 'Einheiten'}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })
            )}

            <TouchableOpacity
              style={[styles.addWocheBtn, { borderColor: C.accent }]}
              onPress={() => navigation.navigate('PlanWocheForm', { planId: plan.id })}
              activeOpacity={0.8}
            >
              <GBIcon name="plus" size={18} color={C.accent} />
              <Text style={[styles.addWocheBtnText, { color: C.accent }]}>Woche hinzufügen</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Kalender View */}
        {viewMode === 'kalender' && (
          <View style={styles.kalenderSection}>
            <MonthCalendar
              markedDays={markedDays}
              legendLabel="Einheit geplant"
              onDayPress={handleDayPress}
              selectedIso={selectedIso}
              onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); setSelectedIso(null); }}
            />

            {/* Day detail panel */}
            {selectedIso && (
              <View style={[styles.dayPanel, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={[styles.dayPanelHeader, { borderBottomColor: C.border }]}>
                  <Text style={[styles.dayPanelTitle, { color: C.text }]}>{formatDay(selectedIso)}</Text>
                  <TouchableOpacity style={styles.dayAddBtn} onPress={handleAddOnDay} activeOpacity={0.8}>
                    <GBIcon name="plus" size={16} color={C.accentContrast} />
                    <Text style={styles.dayAddBtnText}>Einheit</Text>
                  </TouchableOpacity>
                </View>

                {dayEinheiten.length === 0 ? (
                  <View style={styles.dayEmpty}>
                    <Text style={[styles.dayEmptyText, { color: C.textDim }]}>Keine Einheiten an diesem Tag</Text>
                  </View>
                ) : (
                  dayEinheiten.map(({ einheit, wocheId }) => {
                    const totalEx = einheit.warmup.length + einheit.haupteinheit.length + einheit.cooldown.length;
                    return (
                      <TouchableOpacity
                        key={einheit.id}
                        style={[styles.dayEinheitCard, { borderBottomColor: C.border }]}
                        activeOpacity={0.75}
                        onPress={() => navigation.navigate('EinheitDetail', { planId: plan.id, wocheId, einheitId: einheit.id })}
                      >
                        <View style={styles.dayEinheitDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.dayEinheitName, { color: C.text }]}>{einheit.name}</Text>
                          {einheit.haupteinheit.length > 0 && (
                            <Text style={[styles.dayEinheitSub, { color: C.textMuted }]} numberOfLines={1}>
                              {buildUebSuffix(einheit.haupteinheit[0]) || `${totalEx} Übungen`}
                            </Text>
                          )}
                        </View>
                        <GBIcon name="chevronRight" size={14} color={C.textDim} />
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {plan.wochen.length === 0 && (
              <View style={[styles.kalenderHint, { backgroundColor: C.surface, borderColor: C.border }]}>
                <GBIcon name="layers" size={20} color={C.textDim} />
                <Text style={[styles.kalenderHintText, { color: C.textMuted }]}>
                  Lege Wochen an und setze ein Startdatum, um Einheiten im Kalender zu planen.
                </Text>
              </View>
            )}
          </View>
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

  wochenSection: { gap: SP.sm },

  startdatumHint:     { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,106,61,0.25)', padding: SP.md },
  startdatumHintText: { flex: 1, fontSize: FONT.sm, color: C.warn, lineHeight: 20 },

  wocheCard:      { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  wocheStripe:    { width: 3, backgroundColor: C.accent },
  wocheBody:      { flex: 1, padding: SP.lg, gap: SP.sm },
  wocheTop:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  wocheTitle:     { fontSize: FONT.md, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  wocheDateRange: { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600', marginTop: 2 },
  wocheActions:   { flexDirection: 'row', gap: 6 },
  wocheEditBtn:   { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  wocheDeleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,106,61,0.10)', alignItems: 'center', justifyContent: 'center' },
  wocheNotiz:     { fontSize: FONT.sm, color: C.textSub },
  wocheBadge:     { alignSelf: 'flex-start', backgroundColor: C.surfaceAlt, borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 3 },
  wocheBadgeText: { fontFamily: FONT_MONO, fontSize: 11, color: C.textDim, fontWeight: '600' },

  emptyWochen:      { alignItems: 'center', paddingVertical: 40, gap: SP.sm },
  emptyWochenTitle: { fontSize: FONT.md, fontWeight: '700', color: C.textSub },
  emptyWochenSub:   { fontSize: FONT.sm, color: C.textDim },

  addWocheBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.04)' },
  addWocheBtnText: { fontSize: FONT.base, fontWeight: '700', color: C.accent },

  kalenderSection: { gap: SP.md },
  kalenderHint:    { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.md },
  kalenderHintText: { flex: 1, fontSize: FONT.sm, color: C.textMuted, lineHeight: 20 },

  dayPanel:       { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  dayPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  dayPanelTitle:  { fontSize: FONT.base, fontWeight: '700', color: C.text },
  dayAddBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accent, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  dayAddBtnText:  { fontSize: FONT.xs, fontWeight: '700', color: C.accentContrast },
  dayEmpty:       { padding: SP.lg, alignItems: 'center' },
  dayEmptyText:   { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },
  dayEinheitCard: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  dayEinheitDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: C.accent, flexShrink: 0 },
  dayEinheitName: { fontSize: FONT.base, fontWeight: '600', color: C.text },
  dayEinheitSub:  { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2 },

  deleteBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,106,61,0.25)', backgroundColor: 'rgba(255,106,61,0.06)' },
  deleteBtnText: { fontSize: FONT.base, fontWeight: '600', color: C.warn },
});
