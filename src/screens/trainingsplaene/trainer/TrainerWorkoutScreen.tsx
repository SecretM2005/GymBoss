import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList, PlanUebung, Wochentag } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerWorkout'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainerWorkout'>;
};

type UebungDraft = Omit<PlanUebung, 'id'> & { draftId: string };

const TYPEN = ['Krafttraining', 'Kampfsport', 'Ausdauer', 'Mobilität', 'Sonstige'];
const TAGE: Wochentag[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function emptyUebung(): UebungDraft {
  return {
    draftId: Date.now().toString() + Math.random(),
    name: '', saetze: 3, wiederholungen: 10, gewicht: undefined, pause: 60, notizen: undefined,
  };
}

export default function TrainerWorkoutScreen({ navigation, route }: Props) {
  const { planId, wocheId, workoutId, wochentag: initTag } = route.params;
  const { getPlanById, updateWorkoutMeta, setUebungen, deleteWorkout } = useTrainingsplanStore();

  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);
  const existing = woche?.workouts.find((wo) => wo.id === workoutId);

  const [name, setName]           = useState(existing?.name ?? 'Neues Workout');
  const [typ, setTyp]             = useState(existing?.typ ?? TYPEN[0]);
  const [wochentag, setWochentag] = useState<Wochentag>(existing?.wochentag ?? initTag ?? 'Mo');
  const [uebungen, setUebungenState] = useState<UebungDraft[]>(
    existing?.uebungen.length
      ? existing.uebungen.map((u) => ({ ...u, draftId: u.id }))
      : [emptyUebung()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: name || 'Workout' });
  }, [navigation, name]);

  const updateUebung = (draftId: string, patch: Partial<UebungDraft>) =>
    setUebungenState((us) => us.map((u) => (u.draftId === draftId ? { ...u, ...patch } : u)));

  const removeUebung = (draftId: string) =>
    setUebungenState((us) => us.filter((u) => u.draftId !== draftId));

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name ist Pflichtfeld';
    uebungen.forEach((u, i) => { if (!u.name.trim()) e[`u${i}`] = 'Name erforderlich'; });
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (!workoutId) return;
    updateWorkoutMeta(planId, wocheId, workoutId, { name: name.trim(), typ, wochentag });
    const saved: PlanUebung[] = uebungen.map((u, i) => ({
      id: `${workoutId}-u${i}`,
      name: u.name.trim(),
      saetze: u.saetze,
      wiederholungen: u.wiederholungen,
      gewicht: u.gewicht,
      pause: u.pause,
      notizen: u.notizen?.trim() || undefined,
    }));
    setUebungen(planId, wocheId, workoutId, saved);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!workoutId) return;
    Alert.alert('Workout löschen', `"${name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      {
        text: 'Löschen', style: 'destructive',
        onPress: () => { deleteWorkout(planId, wocheId, workoutId); navigation.goBack(); },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Workout-Infos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Workout-Details</Text>

          <View>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
              placeholder="z.B. Push-Tag"
              placeholderTextColor={C.textMuted}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>Wochentag</Text>
            <View style={styles.tagRow}>
              {TAGE.map((t) => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setWochentag(t)}
                  style={[styles.tagBtn, wochentag === t && styles.tagBtnActive]}
                >
                  <Text style={[styles.tagText, wochentag === t && styles.tagTextActive]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View>
            <Text style={styles.label}>Typ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typRow}>
                {TYPEN.map((t) => (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setTyp(t)}
                    style={[styles.typBtn, typ === t && styles.typBtnActive]}
                  >
                    <Text style={[styles.typText, typ === t && styles.typTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          </View>
        </View>

        {/* Übungen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Übungen</Text>

          {uebungen.map((u, i) => (
            <View key={u.draftId} style={styles.uebungCard}>
              <View style={styles.uebungHeader}>
                <View style={styles.uebungNum}>
                  <Text style={styles.uebungNumText}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[styles.uebungNameInput, errors[`u${i}`] && styles.inputError]}
                  value={u.name}
                  onChangeText={(v) => { updateUebung(u.draftId, { name: v }); setErrors((e) => ({ ...e, [`u${i}`]: '' })); }}
                  placeholder="Übungsname"
                  placeholderTextColor={C.textMuted}
                />
                {uebungen.length > 1 && (
                  <TouchableOpacity onPress={() => removeUebung(u.draftId)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {errors[`u${i}`] ? <Text style={styles.errorText}>{errors[`u${i}`]}</Text> : null}

              <View style={styles.uebungFields}>
                <NumField label="Sätze"   value={u.saetze}        onChange={(v) => updateUebung(u.draftId, { saetze: v })} />
                <NumField label="Wdh."    value={u.wiederholungen} onChange={(v) => updateUebung(u.draftId, { wiederholungen: v })} />
                <NumField label="kg"      value={u.gewicht}        onChange={(v) => updateUebung(u.draftId, { gewicht: v })} optional />
                <NumField label="Pause(s)"value={u.pause}          onChange={(v) => updateUebung(u.draftId, { pause: v })} />
              </View>

              <TextInput
                style={styles.notizInput}
                value={u.notizen ?? ''}
                onChangeText={(v) => updateUebung(u.draftId, { notizen: v || undefined })}
                placeholder="Hinweise (optional)"
                placeholderTextColor={C.textMuted}
                multiline
              />
            </View>
          ))}

          <TouchableOpacity
            style={styles.addUebungBtn}
            onPress={() => setUebungenState((us) => [...us, emptyUebung()])}
          >
            <Text style={styles.addUebungBtnText}>+ Übung hinzufügen</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>Workout speichern</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteBtnText}>Workout löschen</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function NumField({ label, value, onChange, optional }: {
  label: string; value: number | undefined;
  onChange: (v: number) => void; optional?: boolean;
}) {
  return (
    <View style={styles.numField}>
      <Text style={styles.numLabel}>{label}</Text>
      <TextInput
        style={styles.numInput}
        value={value !== undefined ? String(value) : ''}
        onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChange(n); else if (optional && v === '') onChange(undefined as unknown as number); }}
        keyboardType="decimal-pad"
        placeholder={optional ? '–' : '0'}
        placeholderTextColor={C.textMuted}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },
  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.md, ...SHADOW_SM },
  sectionTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  label: { fontSize: FONT.sm, color: C.textSub, fontWeight: '500', marginBottom: SP.xs },
  errorText: { color: C.danger, fontSize: FONT.xs },

  input: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: SP.md, paddingVertical: SP.md - 2, fontSize: FONT.base, color: C.text, backgroundColor: C.cardAlt },
  inputError: { borderColor: C.danger },

  tagRow: { flexDirection: 'row', gap: SP.xs },
  tagBtn: { flex: 1, paddingVertical: SP.sm, borderRadius: R.sm, alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  tagBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  tagText: { fontWeight: '700', fontSize: FONT.xs, color: C.textSub },
  tagTextActive: { color: C.white },

  typRow: { flexDirection: 'row', gap: SP.sm },
  typBtn: { paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.full, backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  typBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  typText: { fontWeight: '600', fontSize: FONT.sm, color: C.textSub },
  typTextActive: { color: C.white },

  uebungCard: { backgroundColor: C.bg, borderRadius: R.md, padding: SP.md, gap: SP.sm },
  uebungHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  uebungNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  uebungNumText: { color: C.white, fontSize: FONT.sm, fontWeight: '700' },
  uebungNameInput: { flex: 1, borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: SP.md, paddingVertical: SP.xs + 2, fontSize: FONT.base, color: C.text, backgroundColor: C.card },
  removeBtn: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.dangerBg, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: C.danger, fontSize: 13, fontWeight: '700' },

  uebungFields: { flexDirection: 'row', gap: SP.sm },
  numField: { flex: 1, alignItems: 'center', gap: 3 },
  numLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '500' },
  numInput: { width: '100%', borderWidth: 1, borderColor: C.border, borderRadius: R.sm, padding: SP.xs + 2, textAlign: 'center', fontSize: FONT.sm, color: C.text, backgroundColor: C.card },

  notizInput: { borderWidth: 1, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: SP.md, paddingVertical: SP.xs + 2, fontSize: FONT.sm, color: C.textSub, backgroundColor: C.card },

  addUebungBtn: { borderWidth: 1.5, borderColor: C.primary, borderRadius: R.sm, paddingVertical: SP.md - 2, alignItems: 'center', borderStyle: 'dashed' },
  addUebungBtnText: { color: C.primary, fontWeight: '700', fontSize: FONT.sm },

  saveBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', ...SHADOW_SM },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.md },
  deleteBtn: { paddingVertical: SP.md, alignItems: 'center' },
  deleteBtnText: { color: C.textMuted, fontSize: FONT.sm },
});
