import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaeneStackParamList } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useAthletenStore } from '../../store/athletenStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import { C, useColors, SP, R, FONT } from '../../theme';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'PlanForm'>;
  route: RouteProp<PlaeneStackParamList, 'PlanForm'>;
};

const SPORTARTEN = ['Kraftsport', 'Kampfsport', 'Leichtathletik', 'Konditionierung', 'Mobility', 'Crossfit', 'Andere'] as const;

type Form = {
  name: string;
  sportart: string;
  beschreibung: string;
  startdatum: string;
};

export default function PlanFormScreen({ navigation, route }: Props) {
  const C = useColors();
  const { getPlanById, addPlan, updatePlan, deletePlan } = usePlanStore();
  const { sportler } = useAthletenStore();

  const isEdit = !!route.params?.planId;
  const existing = isEdit ? getPlanById(route.params.planId!) : undefined;
  const preselectedSportlerId = route.params?.preselectedSportlerId;

  const [form, setForm] = useState<Form>(
    existing
      ? {
          name:        existing.name,
          sportart:    existing.sportart ?? 'Kraftsport',
          beschreibung: existing.beschreibung ?? '',
          startdatum:  existing.startdatum ?? '',
        }
      : { name: '', sportart: 'Kraftsport', beschreibung: '', startdatum: '' }
  );
  const [selectedSportler, setSelectedSportler] = useState<Set<string>>(() => {
    const ids = new Set(existing?.sportlerIds ?? []);
    if (preselectedSportlerId) ids.add(preselectedSportlerId);
    return ids;
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Form, string>>>({});

  const set = (key: keyof Form, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const toggleSportler = (id: string) => {
    setSelectedSportler((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const validate = () => {
    const e: Partial<Record<keyof Form, string>> = {};
    if (!form.name.trim()) e.name = 'Name ist erforderlich';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      name:        form.name.trim(),
      sportart:    form.sportart || undefined,
      beschreibung: form.beschreibung.trim() || undefined,
      startdatum:  form.startdatum.trim() || undefined,
      sportlerIds: Array.from(selectedSportler),
      trainerId:   't1',
    };
    if (isEdit && existing) updatePlan(existing.id, data);
    else addPlan(data);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Plan löschen', `„${existing.name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => { deletePlan(existing.id); navigation.popToTop(); } },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: useSafeAreaInsets().top, backgroundColor: C.bg }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={[styles.topSub, { color: C.textMuted }]}>{isEdit ? 'Bearbeiten' : 'Neuer Plan'}</Text>
            <Text style={[styles.topTitle, { color: C.text }]} numberOfLines={1}>{form.name.trim() || '—'}</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: C.accent }]} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Import shortcut */}
          {!isEdit && (
            <TouchableOpacity
              style={[styles.importRow, { backgroundColor: C.surface, borderColor: C.border }]}
              onPress={() => navigation.replace('ImportPlan', { preselectedSportlerId: route.params?.preselectedSportlerId })}
              activeOpacity={0.75}
            >
              <GBIcon name="camera" size={17} color={C.textMuted} />
              <Text style={[styles.importRowText, { color: C.textMuted }]}>Lieber aus Foto/PDF importieren?</Text>
              <GBIcon name="chevronRight" size={14} color={C.textDim} />
            </TouchableOpacity>
          )}

          {/* Name */}
          <Field label="Planname" required error={errors.name}>
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, borderColor: errors.name ? C.warn : C.border, color: C.text }]}
              value={form.name}
              onChangeText={(v) => set('name', v)}
              placeholder="z. B. Kraftaufbau Basis"
              placeholderTextColor={C.textDim}
              autoCapitalize="words"
            />
          </Field>

          {/* Sportart */}
          <Field label="Sportart">
            <View style={styles.chipRow}>
              {SPORTARTEN.map((s) => {
                const active = form.sportart === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => set('sportart', s)}
                    style={[styles.sportChip, { backgroundColor: C.surface, borderColor: C.border }, active && styles.sportChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sportChipText, { color: C.textSub }, active && styles.sportChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          {/* Beschreibung */}
          <Field label="Beschreibung">
            <TextInput
              style={[styles.input, styles.inputMulti, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              value={form.beschreibung}
              onChangeText={(v) => set('beschreibung', v)}
              placeholder="Kurze Beschreibung des Plans…"
              placeholderTextColor={C.textDim}
              autoCapitalize="sentences"
              multiline
              numberOfLines={3}
            />
          </Field>

          {/* Startdatum */}
          <Field label="Startdatum">
            <TextInput
              style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              value={form.startdatum}
              onChangeText={(v) => set('startdatum', v)}
              placeholder="TT.MM.JJJJ"
              placeholderTextColor={C.textDim}
              keyboardType="numbers-and-punctuation"
            />
          </Field>

          {/* Sportler */}
          {!preselectedSportlerId && (
            <Field label="Sportler zuweisen">
              {sportler.length === 0 ? (
                <View style={[styles.emptyAthletes, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <Text style={[styles.emptyAthletesText, { color: C.textDim }]}>Noch keine Sportler angelegt</Text>
                </View>
              ) : (
                <View style={styles.athleteList}>
                  {sportler.map((sp) => {
                    const selected = selectedSportler.has(sp.id);
                    return (
                      <TouchableOpacity
                        key={sp.id}
                        style={[styles.athleteRow, { backgroundColor: C.surface, borderColor: C.border }, selected && styles.athleteRowSelected]}
                        onPress={() => toggleSportler(sp.id)}
                        activeOpacity={0.75}
                      >
                        <GBAvatar name={sp.name} initials={sp.initials} size={38} />
                        <View style={styles.athleteInfo}>
                          <Text style={[styles.athleteName, { color: C.text }]}>{sp.name}</Text>
                          {sp.sportart && <Text style={[styles.athleteSport, { color: C.textMuted }]}>{sp.sportart}</Text>}
                        </View>
                        <View style={[styles.checkBox, { borderColor: C.border, backgroundColor: C.surfaceAlt }, selected && styles.checkBoxSelected]}>
                          {selected && <GBIcon name="check" size={14} color={C.accentContrast} />}
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </Field>
          )}

          {/* Delete */}
          {isEdit && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.8}>
              <GBIcon name="trash" size={18} color={C.warn} />
              <Text style={styles.deleteBtnText}>Plan löschen</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  const C = useColors();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: C.textMuted }]}>{label}{required && <Text style={{ color: C.accent }}> *</Text>}</Text>
      {children}
      {error && <Text style={[styles.errorText, { color: C.warn }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar:       { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingBottom: SP.md, paddingTop: SP.sm, gap: SP.md },
  backBtn:      { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topCenter:    { flex: 1 },
  topSub:       { fontSize: 11, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle:     { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  saveBtn:      { backgroundColor: C.accent, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  saveBtnText:  { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  importRow:     { flexDirection: 'row', alignItems: 'center', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  importRowText: { flex: 1, fontSize: FONT.sm, fontWeight: '600' },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.xl },

  fieldGroup: { gap: SP.xs + 2 },
  fieldLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 },
  errorText:  { fontSize: FONT.xs, color: C.warn, marginTop: 2 },

  input:       { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md, fontSize: FONT.base, color: C.text },
  inputError:  { borderColor: C.warn },
  inputMulti:  { minHeight: 80, textAlignVertical: 'top' },

  chipRow:           { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  sportChip:         { paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.full, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface },
  sportChipActive:   { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.10)' },
  sportChipText:     { fontSize: FONT.sm, fontWeight: '600', color: C.textSub },
  sportChipTextActive: { color: C.accent },

  athleteList:         { gap: SP.sm },
  athleteRow:          { flexDirection: 'row', alignItems: 'center', gap: SP.md, backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, borderWidth: 1, borderColor: C.border },
  athleteRowSelected:  { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.06)' },
  athleteInfo:         { flex: 1 },
  athleteName:         { fontSize: FONT.base, fontWeight: '600', color: C.text },
  athleteSport:        { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  checkBox:            { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  checkBoxSelected:    { borderColor: C.accent, backgroundColor: C.accent },

  emptyAthletes:     { backgroundColor: C.surface, borderRadius: R.md, borderWidth: 1, borderColor: C.border, padding: SP.lg, alignItems: 'center' },
  emptyAthletesText: { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },

  deleteBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,106,61,0.25)', backgroundColor: 'rgba(255,106,61,0.06)', marginTop: SP.sm },
  deleteBtnText: { fontSize: FONT.base, fontWeight: '600', color: C.warn },
});
