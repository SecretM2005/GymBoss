import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SportlerStackParamList } from '../../types';
import { useAthletenStore } from '../../store/athletenStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
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

// ─── Kalender-Hilfen ─────────────────────────────────────────────────────────

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WOCHENTAGE = ['Mo','Di','Mi','Do','Fr','Sa','So'];

// Platzhalter-Trainingstage (wird später aus dem Plan-Store kommen)
const DUMMY_TRAINING_TAGE = new Set([3, 5, 8, 10, 12, 15, 17, 19, 22, 24, 26]);

function getFirstWeekday(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // 0=Mo … 6=So
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function MonthCalendar({ sportlerId }: { sportlerId: string }) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstWD   = getFirstWeekday(year, month);
  const daysCount = getDaysInMonth(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const prevMonth = () => { if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const cells: (number | null)[] = [
    ...Array(firstWD).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={cal.wrap}>
      {/* Header */}
      <View style={cal.header}>
        <TouchableOpacity onPress={prevMonth} style={cal.navBtn} activeOpacity={0.7}>
          <GBIcon name="chevronLeft" size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={cal.monthTitle}>{MONATE[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={cal.navBtn} activeOpacity={0.7}>
          <GBIcon name="chevronRight" size={18} color={C.text} />
        </TouchableOpacity>
      </View>

      {/* Wochentag-Header */}
      <View style={cal.weekRow}>
        {WOCHENTAGE.map((d) => (
          <Text key={d} style={cal.weekDay}>{d}</Text>
        ))}
      </View>

      {/* Tage */}
      {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
        <View key={rowIdx} style={cal.weekRow}>
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            const isToday   = isCurrentMonth && day === today.getDate();
            const hasTrain  = day !== null && DUMMY_TRAINING_TAGE.has(day);
            const isPast    = day !== null && (
              year < today.getFullYear() ||
              (year === today.getFullYear() && month < today.getMonth()) ||
              (isCurrentMonth && day < today.getDate())
            );
            return (
              <View key={colIdx} style={cal.cell}>
                {day !== null && (
                  <>
                    <View style={[cal.dayCircle, isToday && cal.dayCircleToday]}>
                      <Text style={[
                        cal.dayText,
                        isToday && cal.dayTextToday,
                        isPast && !isToday && cal.dayTextPast,
                      ]}>{day}</Text>
                    </View>
                    {hasTrain && (
                      <View style={[cal.dot, isToday && cal.dotToday]} />
                    )}
                  </>
                )}
              </View>
            );
          })}
        </View>
      ))}

      <View style={cal.legend}>
        <View style={cal.legendItem}>
          <View style={[cal.dot, { position: 'relative', top: 0 }]} />
          <Text style={cal.legendText}>Training geplant</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Formular ────────────────────────────────────────────────────────────────

function makeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type Form = { name: string; alter: string; sportart: string; ziel: string };

// ─── Haupt-Screen ─────────────────────────────────────────────────────────────

export default function SportlerDetailScreen({ navigation, route }: Props) {
  const { getSportlerById, updateSportler, deleteSportler } = useAthletenStore();
  const sportler = getSportlerById(route.params.sportlerId);
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<Form>({
    name:     sportler?.name ?? '',
    alter:    sportler?.alter != null ? String(sportler.alter) : '',
    sportart: sportler?.sportart ?? 'Kraftsport',
    ziel:     sportler?.ziel ?? '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});
  const [saved, setSaved] = useState(false);

  if (!sportler) {
    navigation.goBack();
    return null;
  }

  const set = (key: keyof Form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    setSaved(false);
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) e.name = 'Name ist erforderlich';
    if (form.alter && (isNaN(Number(form.alter)) || Number(form.alter) < 5 || Number(form.alter) > 99))
      e.alter = 'Gültiges Alter (5–99)';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    updateSportler(sportler.id, {
      name: form.name.trim(),
      alter: form.alter ? Number(form.alter) : undefined,
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
                  {form.alter ? <Text style={styles.profileAge}>{form.alter} J.</Text> : null}
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

          <Field label="Alter" error={errors.alter}>
            <TextInput
              style={[styles.input, errors.alter && styles.inputError]}
              value={form.alter}
              onChangeText={(v) => set('alter', v.replace(/\D/g, ''))}
              placeholder="z. B. 24"
              placeholderTextColor={C.textDim}
              keyboardType="number-pad"
              maxLength={2}
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

          {/* ── Kalender ── */}
          <SectionHead>Trainingskalender</SectionHead>
          <MonthCalendar sportlerId={sportler.id} />

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

// ─── Styles ──────────────────────────────────────────────────────────────────

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

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,106,61,0.25)', backgroundColor: 'rgba(255,106,61,0.06)' },
  deleteBtnText: { fontSize: FONT.base, fontWeight: '600', color: C.warn },
});

// ─── Kalender-Styles ─────────────────────────────────────────────────────────

const cal = StyleSheet.create({
  wrap: { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.lg },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md },
  navBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  monthTitle: { fontSize: FONT.base, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  weekRow: { flexDirection: 'row' },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: C.textDim, letterSpacing: 0.5, paddingBottom: SP.sm },
  cell: { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayCircleToday: { backgroundColor: C.accent },
  dayText: { fontFamily: FONT_MONO, fontSize: 13, fontWeight: '600', color: C.text },
  dayTextToday: { color: C.accentContrast, fontWeight: '800' },
  dayTextPast: { color: C.textDim },
  dot: { position: 'absolute', bottom: 0, width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  dotToday: { backgroundColor: C.accentContrast },
  legend: { flexDirection: 'row', gap: SP.md, marginTop: SP.md, paddingTop: SP.sm, borderTopWidth: 1, borderTopColor: C.border },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText: { fontSize: 11, color: C.textDim },
});
