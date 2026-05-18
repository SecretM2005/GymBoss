import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList, PlanUebung, Wochentag } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import TopBar from '../../../components/TopBar';
import TypeChip from '../../../components/TypeChip';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO, getTypeColor } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerWorkout'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainerWorkout'>;
};

type UebungDraft = Omit<PlanUebung, 'id'> & { draftId: string; expanded: boolean };

const TYPEN = ['Krafttraining', 'Krafttraining I', 'Krafttraining II', 'Kampfsport', 'Konditionierung', 'Mobilität'];
const TAGE: Wochentag[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function emptyUebung(): UebungDraft {
  return {
    draftId: Date.now().toString() + Math.random(),
    name: '', saetze: 3, wiederholungen: 10, gewicht: undefined, pause: 60, notizen: undefined,
    expanded: true,
  };
}

function Stepper({ label, value, onMinus, onPlus, unit }: {
  label: string; value: number | undefined; onMinus: () => void; onPlus: () => void; unit?: string;
}) {
  return (
    <View style={st.stepperCol}>
      <Text style={st.stepperLabel}>{label}</Text>
      <View style={st.stepperRow}>
        <TouchableOpacity style={st.stepperBtn} onPress={onMinus} activeOpacity={0.7}>
          <Text style={st.stepperBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={st.stepperVal}>{value ?? '–'}{unit ? <Text style={st.stepperUnit}>{unit}</Text> : null}</Text>
        <TouchableOpacity style={st.stepperBtn} onPress={onPlus} activeOpacity={0.7}>
          <Text style={st.stepperBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
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
      ? existing.uebungen.map((u) => ({ ...u, draftId: u.id, expanded: false }))
      : [emptyUebung()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateUebung = (draftId: string, patch: Partial<UebungDraft>) =>
    setUebungenState((us) => us.map((u) => (u.draftId === draftId ? { ...u, ...patch } : u)));

  const removeUebung = (draftId: string, uName: string) => {
    if (uebungen.length === 1) return;
    Alert.alert('Übung entfernen', `"${uName || 'Diese Übung'}" entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Entfernen', style: 'destructive', onPress: () => setUebungenState((us) => us.filter((u) => u.draftId !== draftId)) },
    ]);
  };

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
      <View style={st.root}>
        <TopBar
          large
          subtitle={`${typ} · ${wochentag}`}
          title={name || 'Workout'}
          leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
          trailing={
            <TouchableOpacity onPress={handleSave} style={st.saveChip}>
              <Text style={st.saveChipText}>Speichern</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView contentContainerStyle={st.content} keyboardShouldPersistTaps="handled">

          {/* Name */}
          <View style={st.field}>
            <Text style={st.fieldLabel}>Workout-Name</Text>
            <TextInput
              style={[st.input, !!errors.name && st.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
              placeholder="z.B. Push A"
              placeholderTextColor={C.textDim}
            />
            {errors.name ? <Text style={st.errText}>{errors.name}</Text> : null}
          </View>

          {/* Type chips */}
          <View style={st.field}>
            <Text style={st.fieldLabel}>Typ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={st.chipRow}>
                {TYPEN.map((t) => {
                  const tc = getTypeColor(t);
                  const on = typ === t;
                  return (
                    <TouchableOpacity
                      key={t}
                      onPress={() => setTyp(t)}
                      style={[st.typeBtn, { backgroundColor: on ? tc.bg : C.surface, borderColor: on ? tc.dot : C.border }]}
                      activeOpacity={0.75}
                    >
                      <View style={[st.typeDot, { backgroundColor: tc.dot }]} />
                      <Text style={[st.typeBtnText, { color: on ? tc.fg : C.textMuted }]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </ScrollView>
          </View>

          {/* Day chips */}
          <View style={st.field}>
            <Text style={st.fieldLabel}>Wochentag</Text>
            <View style={st.dayRow}>
              {TAGE.map((t) => {
                const on = wochentag === t;
                return (
                  <TouchableOpacity
                    key={t}
                    onPress={() => setWochentag(t)}
                    style={[st.dayBtn, on && st.dayBtnActive]}
                    activeOpacity={0.75}
                  >
                    <Text style={[st.dayBtnText, on && st.dayBtnTextActive]}>{t}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Exercises */}
          <View style={st.field}>
            <Text style={st.fieldLabel}>Übungen · {uebungen.length}</Text>

            {uebungen.map((u, i) => {
              const hasErr = !!errors[`u${i}`];
              return (
                <TouchableOpacity
                  key={u.draftId}
                  style={st.exCard}
                  onPress={() => updateUebung(u.draftId, { expanded: !u.expanded })}
                  activeOpacity={0.85}
                >
                  {/* Card header */}
                  <View style={st.exHeader}>
                    <View style={st.exNum}>
                      <Text style={st.exNumText}>{String(i + 1).padStart(2, '0')}</Text>
                    </View>
                    <View style={st.exHeaderInfo}>
                      <Text style={[st.exName, !u.name && st.exNamePlaceholder]}>
                        {u.name || 'Übungsname'}
                      </Text>
                      {!u.expanded && (
                        <Text style={st.exMeta}>{u.saetze}×{u.wiederholungen}{u.gewicht ? ` · ${u.gewicht}kg` : ''}</Text>
                      )}
                    </View>
                    <GBIcon name={u.expanded ? 'chevronLeft' : 'chevronRight'} size={16} color={C.textDim} />
                  </View>

                  {/* Expanded body */}
                  {u.expanded && (
                    <View style={st.exBody}>
                      <TextInput
                        style={[st.exNameInput, hasErr && st.inputError]}
                        value={u.name}
                        onChangeText={(v) => { updateUebung(u.draftId, { name: v }); setErrors((e) => ({ ...e, [`u${i}`]: '' })); }}
                        placeholder="Übungsname eingeben…"
                        placeholderTextColor={C.textDim}
                      />
                      {hasErr ? <Text style={st.errText}>{errors[`u${i}`]}</Text> : null}

                      <View style={st.stepperGrid}>
                        <Stepper
                          label="Sätze"
                          value={u.saetze}
                          onMinus={() => updateUebung(u.draftId, { saetze: Math.max(1, u.saetze - 1) })}
                          onPlus={() => updateUebung(u.draftId, { saetze: u.saetze + 1 })}
                        />
                        <Stepper
                          label="Wdh."
                          value={u.wiederholungen}
                          onMinus={() => updateUebung(u.draftId, { wiederholungen: Math.max(1, u.wiederholungen - 1) })}
                          onPlus={() => updateUebung(u.draftId, { wiederholungen: u.wiederholungen + 1 })}
                        />
                        <Stepper
                          label="kg"
                          value={u.gewicht}
                          unit=""
                          onMinus={() => updateUebung(u.draftId, { gewicht: Math.max(0, (u.gewicht ?? 0) - 2.5) })}
                          onPlus={() => updateUebung(u.draftId, { gewicht: (u.gewicht ?? 0) + 2.5 })}
                        />
                        <Stepper
                          label="Pause"
                          value={u.pause}
                          unit="s"
                          onMinus={() => updateUebung(u.draftId, { pause: Math.max(0, u.pause - 15) })}
                          onPlus={() => updateUebung(u.draftId, { pause: u.pause + 15 })}
                        />
                      </View>

                      <TextInput
                        style={st.notizInput}
                        value={u.notizen ?? ''}
                        onChangeText={(v) => updateUebung(u.draftId, { notizen: v || undefined })}
                        placeholder="Hinweise (optional)"
                        placeholderTextColor={C.textDim}
                        multiline
                      />

                      {uebungen.length > 1 && (
                        <TouchableOpacity
                          style={st.removeBtn}
                          onPress={() => removeUebung(u.draftId, u.name)}
                        >
                          <GBIcon name="trash" size={14} color={C.danger} />
                          <Text style={st.removeBtnText}>Übung entfernen</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}

            {/* Add exercise */}
            <TouchableOpacity
              style={st.addExBtn}
              onPress={() => setUebungenState((us) => [...us, emptyUebung()])}
            >
              <GBIcon name="plus" size={14} color={C.accent} />
              <Text style={st.addExBtnText}>Übung hinzufügen</Text>
            </TouchableOpacity>
          </View>

          {/* Delete */}
          <TouchableOpacity style={st.deleteBtn} onPress={handleDelete}>
            <GBIcon name="trash" size={14} color={C.danger} />
            <Text style={st.deleteBtnText}>Workout löschen</Text>
          </TouchableOpacity>

          <View style={{ height: SP.xxxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.lg, paddingBottom: 80 },

  saveChip: { backgroundColor: C.accent, borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.xs + 2 },
  saveChipText: { color: C.accentContrast, fontWeight: '700', fontSize: FONT.sm },

  field: { gap: SP.sm },
  fieldLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  input: { backgroundColor: C.surface, borderRadius: R.md, padding: SP.md, fontSize: FONT.base, color: C.text, borderWidth: 1, borderColor: C.border },
  inputError: { borderColor: C.danger },
  errText: { fontSize: FONT.xs, color: C.danger },

  chipRow: { flexDirection: 'row', gap: SP.sm },
  typeBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.xs + 2, borderWidth: 1 },
  typeDot: { width: 6, height: 6, borderRadius: 3 },
  typeBtnText: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 0.4 },

  dayRow: { flexDirection: 'row', gap: SP.xs },
  dayBtn: { flex: 1, paddingVertical: SP.sm, borderRadius: R.sm, alignItems: 'center', backgroundColor: C.surface, borderWidth: 1.5, borderColor: C.border },
  dayBtnActive: { backgroundColor: C.accentLight, borderColor: C.accent },
  dayBtnText: { fontWeight: '700', fontSize: FONT.xs, color: C.textMuted },
  dayBtnTextActive: { color: C.accent },

  exCard: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md },
  exNum: { width: 36, height: 36, borderRadius: R.sm, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '700', color: C.accent },
  exHeaderInfo: { flex: 1 },
  exName: { fontSize: FONT.base, fontWeight: '600', color: C.text },
  exNamePlaceholder: { color: C.textDim },
  exMeta: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },

  exBody: { paddingHorizontal: SP.md, paddingBottom: SP.md, gap: SP.md, borderTopWidth: 1, borderTopColor: C.border },
  exNameInput: { backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: SP.md, fontSize: FONT.base, color: C.text, borderWidth: 1, borderColor: C.border, marginTop: SP.sm },
  notizInput: { backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: SP.md, fontSize: FONT.sm, color: C.textSub, borderWidth: 1, borderColor: C.border, minHeight: 60 },

  stepperGrid: { flexDirection: 'row', gap: SP.sm },
  stepperCol: { flex: 1, alignItems: 'center', gap: SP.xs },
  stepperLabel: { fontSize: 10, color: C.textMuted, fontWeight: '700', letterSpacing: 0.6, textTransform: 'uppercase' },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: SP.xs },
  stepperBtn: { width: 28, height: 28, borderRadius: R.sm, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border },
  stepperBtnText: { fontSize: FONT.md, color: C.text, fontWeight: '600', lineHeight: 22 },
  stepperVal: { fontFamily: FONT_MONO, fontSize: FONT.sm, fontWeight: '700', color: C.text, minWidth: 32, textAlign: 'center' },
  stepperUnit: { fontSize: FONT.xs, color: C.textMuted, fontFamily: undefined },

  removeBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, alignSelf: 'center' },
  removeBtnText: { fontSize: FONT.sm, color: C.danger },

  addExBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.xs, borderWidth: 1.5, borderColor: C.accent, borderStyle: 'dashed', borderRadius: R.lg, paddingVertical: SP.md },
  addExBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accent },

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.xs, paddingVertical: SP.md },
  deleteBtnText: { fontSize: FONT.sm, color: C.danger },
});
