import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SportlerStackParamList, TrainingsPlan, Einheit } from '../../types';
import { useAthletenStore } from '../../store/athletenStore';
import { usePlanStore } from '../../store/planStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import MonthCalendar from '../../components/MonthCalendar';
import { buildSuffix } from '../plaene/EinheitDetailScreen';
import DatePickerField from '../../components/DatePickerField';
import { C, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<SportlerStackParamList, 'SportlerDetail'>;
  route: RouteProp<SportlerStackParamList, 'SportlerDetail'>;
};

const SPORTARTEN = ['Kraftsport', 'Kampfsport', 'Leichtathletik', 'Konditionierung', 'Mobility', 'Crossfit', 'Andere'] as const;

const SPORTART_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  'Kraftsport':      { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E', dot: '#CBFF3E' },
  'Kampfsport':      { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66', dot: '#FF6A3D' },
  'Leichtathletik':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Konditionierung': { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Mobility':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF', dot: '#C39CFF' },
  'Crossfit':        { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582', dot: '#7AE582' },
};

const MONATE_KURZ = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const WOCHENTAGE_LANG = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

function makeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

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

function ageFromIso(iso?: string | null): number | null {
  if (!iso) return null;
  const b = new Date(iso);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${WOCHENTAGE_LANG[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${MONATE_KURZ[d.getMonth()]}`;
}

type Form = { name: string; geburtsdatum: string | null; sportart: string; ziel: string };

export default function SportlerDetailScreen({ navigation, route }: Props) {
  const { getSportlerById, updateSportler, deleteSportler } = useAthletenStore();
  const { getPlaeneForSportler } = usePlanStore();
  const sportler = getSportlerById(route.params.sportlerId);
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<Form>({
    name:         sportler?.name ?? '',
    geburtsdatum: sportler?.geburtsdatum ?? null,
    sportart:     sportler?.sportart ?? 'Kraftsport',
    ziel:         sportler?.ziel ?? '',
  });
  const [errors, setErrors]     = useState<Partial<Record<'name', string>>>({});
  const [saved, setSaved]       = useState(false);
  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  if (!sportler) {
    navigation.goBack();
    return null;
  }

  const plaene = getPlaeneForSportler(sportler.id);

  const markedDays = useMemo(() => {
    const days = new Set<number>();
    plaene.forEach((plan) => {
      plan.wochen.flatMap((w) => w.einheiten).forEach((e) => {
        if (e.datum) {
          const d = new Date(e.datum);
          if (d.getFullYear() === calYear && d.getMonth() === calMonth) {
            days.add(d.getDate());
          }
        }
      });
    });
    return days;
  }, [plaene, calYear, calMonth]);

  const dayEinheiten = useMemo((): Array<{ einheit: Einheit; wocheId: string; plan: TrainingsPlan }> => {
    if (!selectedIso) return [];
    const result: Array<{ einheit: Einheit; wocheId: string; plan: TrainingsPlan }> = [];
    plaene.forEach((plan) => {
      plan.wochen.forEach((w) => {
        w.einheiten.forEach((e) => {
          if (e.datum === selectedIso) result.push({ einheit: e, wocheId: w.id, plan });
        });
      });
    });
    return result;
  }, [plaene, selectedIso]);

  const handleDayPress = (year: number, month: number, day: number) => {
    const iso = isoDate(year, month, day);
    setSelectedIso((prev) => (prev === iso ? null : iso));
  };

  const handleAddOnDay = () => {
    if (!selectedIso) return;
    if (plaene.length === 0) {
      Alert.alert('Kein Plan', 'Dem Sportler ist kein Trainingsplan zugewiesen.');
      return;
    }

    const addToPlan = (plan: TrainingsPlan) => {
      const [yr, mo, dy] = selectedIso.split('-').map(Number);
      const wocheId = getWocheIdForDate(plan, yr, mo - 1, dy);
      if (!wocheId) {
        Alert.alert('Keine Woche', `„${plan.name}" hat noch keine Trainingswochen. Lege dort zuerst eine Woche an.`);
        return;
      }
      // Cross-navigator navigation to PlaeneNavigator's EinheitDetail
      navigation.getParent<any>()?.navigate('Plaene', {
        screen: 'EinheitDetail',
        params: { planId: plan.id, wocheId, datum: selectedIso },
      });
    };

    if (plaene.length === 1) {
      addToPlan(plaene[0]);
    } else {
      Alert.alert(
        'Zu welchem Plan?',
        'Wähle den Trainingsplan für diese Einheit:',
        [
          ...plaene.map((plan) => ({ text: plan.name, onPress: () => addToPlan(plan) })),
          { text: 'Abbrechen', style: 'cancel' as const },
        ],
      );
    }
  };

  const set = (key: keyof Form, val: string | null) => {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
    if (key === 'name' && errors.name) setErrors((e) => ({ ...e, name: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<'name', string>> = {};
    if (!form.name.trim()) e.name = 'Name ist erforderlich';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    updateSportler(sportler.id, {
      name: form.name.trim(),
      geburtsdatum: form.geburtsdatum ?? undefined,
      sportart: form.sportart || undefined,
      ziel: form.ziel.trim() || undefined,
    });
    setSaved(true);
  };

  const handleDelete = () => {
    Alert.alert('Sportler löschen', `${sportler.name} wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => { deleteSportler(sportler.id); navigation.goBack(); } },
    ]);
  };

  const sc = SPORTART_COLORS[form.sportart] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textDim };
  const initials = makeInitials(form.name);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, saved && styles.saveBtnDone]} activeOpacity={0.8}>
            {saved
              ? <><GBIcon name="check" size={15} color={C.accentContrast} /><Text style={styles.saveBtnText}>Gespeichert</Text></>
              : <Text style={styles.saveBtnText}>Speichern</Text>
            }
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Profil-Header */}
          <View style={styles.profileCard}>
            <View style={styles.profileCardInner}>
              <GBAvatar name={form.name || '?'} initials={initials} size={72} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>
                  {form.name.trim() || '—'}
                </Text>
                <View style={styles.profileMeta}>
                  {form.geburtsdatum ? <Text style={styles.profileAge}>{ageFromIso(form.geburtsdatum)} J.</Text> : null}
                  {form.sportart && (
                    <View style={[styles.chip, { backgroundColor: sc.bg }]}>
                      <View style={[styles.chipDot, { backgroundColor: sc.dot }]} />
                      <Text style={[styles.chipText, { color: sc.fg }]}>{form.sportart}</Text>
                    </View>
                  )}
                </View>
                {form.ziel ? <Text style={styles.profileZiel} numberOfLines={2}>{form.ziel}</Text> : null}
              </View>
            </View>
          </View>

          {/* ── Daten bearbeiten ── */}
          <SectionHead>Daten bearbeiten</SectionHead>

          <Field label="Name" required error={errors.name}>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="Vorname Nachname"
              placeholderTextColor={C.textDim}
              autoCapitalize="words"
            />
          </Field>

          <Field label="Geburtsdatum">
            <DatePickerField
              value={form.geburtsdatum}
              onChange={(iso) => set('geburtsdatum', iso)}
            />
          </Field>

          <Field label="Sportart">
            <View style={styles.chipRow}>
              {SPORTARTEN.map((s) => {
                const active = form.sportart === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => set('sportart', s)}
                    style={[styles.sportartChip, active && styles.sportartChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sportartChipText, active && styles.sportartChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          <Field label="Trainingsziel">
            <TextInput
              style={styles.input}
              value={form.ziel}
              onChangeText={(v) => set('ziel', v)}
              placeholder="z. B. Kraftaufbau, Wettkampfvorbereitung…"
              placeholderTextColor={C.textDim}
              autoCapitalize="sentences"
            />
          </Field>

          {/* ── Trainingskalender ── */}
          <SectionHead>Trainingskalender</SectionHead>

          <MonthCalendar
            markedDays={markedDays}
            legendLabel="Einheit geplant"
            onDayPress={plaene.length > 0 ? handleDayPress : undefined}
            selectedIso={selectedIso}
            onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); setSelectedIso(null); }}
          />

          {/* Day detail panel */}
          {selectedIso && (
            <View style={styles.dayPanel}>
              <View style={styles.dayPanelHeader}>
                <Text style={styles.dayPanelTitle}>{formatDay(selectedIso)}</Text>
                <TouchableOpacity style={styles.dayAddBtn} onPress={handleAddOnDay} activeOpacity={0.8}>
                  <GBIcon name="plus" size={16} color={C.accentContrast} />
                  <Text style={styles.dayAddBtnText}>Einheit</Text>
                </TouchableOpacity>
              </View>

              {dayEinheiten.length === 0 ? (
                <View style={styles.dayEmpty}>
                  <Text style={styles.dayEmptyText}>Keine Einheiten an diesem Tag</Text>
                </View>
              ) : (
                dayEinheiten.map(({ einheit, wocheId, plan }) => {
                  const override = einheit.sportlerOverrides?.[sportler.id];
                  const display = override ? { ...einheit, ...override } : einheit;
                  const hasSuffix = display.haupteinheit[0]?.parameter.length > 0;
                  return (
                    <View key={einheit.id} style={styles.dayEinheitCard}>
                      <View style={styles.dayEinheitLeft}>
                        <View style={styles.dayEinheitDot} />
                        <View style={{ flex: 1 }}>
                          <Text style={styles.dayEinheitName}>
                            {display.name}
                            {override && <Text style={styles.overrideMark}> ✎</Text>}
                          </Text>
                          <Text style={styles.dayPlanLabel}>{plan.name}</Text>
                          {hasSuffix && (
                            <Text style={styles.dayEinheitSub} numberOfLines={1}>
                              {buildSuffix(display.haupteinheit[0].parameter)}
                            </Text>
                          )}
                        </View>
                      </View>
                      <TouchableOpacity
                        style={styles.dayEditBtn}
                        activeOpacity={0.7}
                        onPress={() =>
                          navigation.navigate('SportlerEinheitDetail', {
                            planId: plan.id,
                            wocheId,
                            einheitId: einheit.id,
                            sportlerId: sportler.id,
                          })
                        }
                      >
                        <GBIcon name="edit" size={14} color={C.textMuted} />
                      </TouchableOpacity>
                    </View>
                  );
                })
              )}
            </View>
          )}

          {/* ── Aktive Pläne ── */}
          <SectionHead>Aktive Pläne</SectionHead>

          {plaene.length === 0 ? (
            <View style={styles.emptyPlans}>
              <GBIcon name="layers" size={28} color={C.textDim} />
              <Text style={styles.emptyPlansText}>Kein Trainingsplan zugewiesen</Text>
            </View>
          ) : (
            plaene.map((plan) => {
              const allEinheiten = plan.wochen.flatMap((w) =>
                w.einheiten.map((e) => ({ einheit: e, wocheId: w.id }))
              );
              const sc2 = SPORTART_COLORS[plan.sportart ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textDim };

              return (
                <View key={plan.id} style={styles.planCard}>
                  <View style={styles.planCardHeader}>
                    <Text style={styles.planCardName}>{plan.name}</Text>
                    {plan.sportart && (
                      <View style={[styles.planChip, { backgroundColor: sc2.bg }]}>
                        <View style={[styles.planChipDot, { backgroundColor: sc2.dot }]} />
                        <Text style={[styles.planChipText, { color: sc2.fg }]}>{plan.sportart}</Text>
                      </View>
                    )}
                  </View>

                  {allEinheiten.length === 0 ? (
                    <Text style={styles.planNoEinheiten}>Noch keine Einheiten</Text>
                  ) : (
                    allEinheiten.map(({ einheit, wocheId }) => {
                      const override = einheit.sportlerOverrides?.[sportler.id];
                      const display = override ? { ...einheit, ...override } : einheit;
                      const totalEx = display.warmup.length + display.haupteinheit.length + display.cooldown.length;
                      const hasSuffix = display.haupteinheit[0]?.parameter.length > 0;

                      return (
                        <View key={einheit.id} style={styles.einheitRow}>
                          <View style={styles.einheitRowInfo}>
                            <View style={styles.einheitDot} />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.einheitName}>
                                {display.name}
                                {override && <Text style={styles.overrideBadge}> ✎</Text>}
                              </Text>
                              {hasSuffix ? (
                                <Text style={styles.einheitParams} numberOfLines={1}>
                                  {buildSuffix(display.haupteinheit[0].parameter)}
                                </Text>
                              ) : (
                                <Text style={styles.einheitParams}>{totalEx} Übungen</Text>
                              )}
                              {einheit.datum && (
                                <Text style={styles.einheitDatum}>{new Date(einheit.datum).toLocaleDateString('de-DE')}</Text>
                              )}
                            </View>
                          </View>
                          <TouchableOpacity
                            style={styles.einheitEditBtn}
                            activeOpacity={0.7}
                            onPress={() =>
                              navigation.navigate('SportlerEinheitDetail', {
                                planId: plan.id,
                                wocheId,
                                einheitId: einheit.id,
                                sportlerId: sportler.id,
                              })
                            }
                          >
                            <GBIcon name="edit" size={14} color={C.textMuted} />
                          </TouchableOpacity>
                        </View>
                      );
                    })
                  )}
                </View>
              );
            })
          )}

          {/* Löschen */}
          <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.8}>
            <GBIcon name="trash" size={17} color={C.warn} />
            <Text style={styles.deleteBtnText}>Sportler löschen</Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function SectionHead({ children }: { children: React.ReactNode }) {
  return <Text style={styles.sectionHead}>{children}</Text>;
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}{required && <Text style={{ color: C.accent }}> *</Text>}</Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.md, gap: SP.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  saveBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.accent, paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.full },
  saveBtnDone: { backgroundColor: C.good },
  saveBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  content: { paddingHorizontal: SP.xl, gap: SP.lg, paddingTop: SP.sm },

  profileCard: { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  profileCardInner: { flexDirection: 'row', alignItems: 'center', gap: SP.lg, padding: SP.lg },
  profileInfo: { flex: 1, gap: 6 },
  profileName: { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  profileMeta: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  profileAge: { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textMuted, fontWeight: '600' },
  profileZiel: { fontSize: FONT.sm, color: C.textSub, lineHeight: 18 },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },

  sectionHead: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: -SP.sm },

  fieldGroup: { gap: SP.xs + 2 },
  fieldLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 },
  errorText: { fontSize: FONT.xs, color: C.warn, marginTop: 2 },
  input: { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md, fontSize: FONT.base, color: C.text },
  inputError: { borderColor: C.warn },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  sportartChip: { paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.full, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  sportartChipActive: { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.10)' },
  sportartChipText: { fontSize: FONT.sm, fontWeight: '600', color: C.textSub },
  sportartChipTextActive: { color: C.accent },

  dayPanel:       { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  dayPanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  dayPanelTitle:  { fontSize: FONT.base, fontWeight: '700', color: C.text },
  dayAddBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.accent, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  dayAddBtnText:  { fontSize: FONT.xs, fontWeight: '700', color: C.accentContrast },
  dayEmpty:       { padding: SP.lg, alignItems: 'center' },
  dayEmptyText:   { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },
  dayEinheitCard: { flexDirection: 'row', alignItems: 'center', padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border, gap: SP.sm },
  dayEinheitLeft: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm },
  dayEinheitDot:  { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent, marginTop: 5, flexShrink: 0 },
  dayEinheitName: { fontSize: FONT.base, fontWeight: '600', color: C.text },
  dayPlanLabel:   { fontSize: 10, fontWeight: '600', color: C.textMuted, marginTop: 1 },
  dayEinheitSub:  { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2 },
  dayEditBtn:     { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  overrideMark:   { color: C.accent },

  emptyPlans:     { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.xl, alignItems: 'center', gap: SP.sm },
  emptyPlansText: { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },

  planCard:       { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  planCardHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  planCardName:   { flex: 1, fontSize: FONT.base, fontWeight: '700', color: C.text },
  planChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.full },
  planChipDot:    { width: 4, height: 4, borderRadius: 2 },
  planChipText:   { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  planNoEinheiten: { padding: SP.md, fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },

  einheitRow:     { flexDirection: 'row', alignItems: 'center', padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  einheitRowInfo: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm },
  einheitDot:     { width: 7, height: 7, borderRadius: 4, backgroundColor: C.accent, marginTop: 5, flexShrink: 0 },
  einheitName:    { fontSize: FONT.base, fontWeight: '600', color: C.text },
  einheitParams:  { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2 },
  einheitDatum:   { fontSize: 10, color: C.textDim, marginTop: 2 },
  overrideBadge:  { color: C.accent },
  einheitEditBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,106,61,0.25)', backgroundColor: 'rgba(255,106,61,0.06)' },
  deleteBtnText: { fontSize: FONT.base, fontWeight: '600', color: C.warn },
});
