import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useRoleStore } from '../../../store/roleStore';
import TopBar from '../../../components/TopBar';
import GBAvatar from '../../../components/GBAvatar';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerPlanForm'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainerPlanForm'>;
};

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

export default function TrainerPlanFormScreen({ navigation, route }: Props) {
  const { addPlan, updatePlan, addWoche, deleteWoche, getPlanById } = useTrainingsplanStore();
  const { getSportler, getUserById, currentUser } = useRoleStore();

  const isEdit = !!route.params?.planId;
  const existing = isEdit ? getPlanById(route.params.planId!) : undefined;

  const [name, setName]           = useState(existing?.name ?? '');
  const [ziel, setZiel]           = useState(existing?.ziel ?? '');
  const [beschreibung, setBeschreibung] = useState(existing?.beschreibung ?? '');
  const [sportlerId, setSportlerId] = useState(existing?.sportlerId ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors]         = useState<Record<string, string>>({});

  const sportlerList = getSportler();
  const selectedSp   = getUserById(sportlerId);
  const plan = isEdit ? getPlanById(route.params.planId!) : undefined;

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Name erforderlich';
    if (!sportlerId)  e.sp   = 'Sportler auswählen';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    if (isEdit && existing) {
      updatePlan(existing.id, { name: name.trim(), ziel: ziel.trim() || undefined, beschreibung: beschreibung.trim() || undefined, sportlerId });
      navigation.goBack();
    } else {
      const newId = addPlan({ name: name.trim(), ziel: ziel.trim() || undefined, beschreibung: beschreibung.trim() || undefined, sportlerId, trainerId: currentUser.id, startdatum: new Date().toISOString().split('T')[0], wochen: [] });
      navigation.replace('TrainerPlanForm', { planId: newId });
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <TopBar
          large
          subtitle={isEdit ? 'Plan bearbeiten' : 'Neuer Plan'}
          title="Plandetails"
          leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
          trailing={
            <TouchableOpacity onPress={handleSave} style={styles.saveChip}>
              <Text style={styles.saveChipText}>Speichern</Text>
            </TouchableOpacity>
          }
        />
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Basis-Infos */}
          <Field label="Plan-Name">
            <TextInput
              style={[styles.input, !!errors.name && styles.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
              placeholder="z.B. Hypertrophie Block A"
              placeholderTextColor={C.textDim}
            />
            {errors.name ? <Text style={styles.errText}>{errors.name}</Text> : null}
          </Field>

          <Field label="Ziel">
            <TextInput style={styles.input} value={ziel} onChangeText={setZiel} placeholder="z.B. +5kg Magermasse" placeholderTextColor={C.textDim} />
          </Field>

          <Field label="Beschreibung">
            <TextInput style={[styles.input, styles.textarea]} value={beschreibung} onChangeText={setBeschreibung} placeholder="Kurze Beschreibung…" placeholderTextColor={C.textDim} multiline numberOfLines={3} textAlignVertical="top" />
          </Field>

          {/* Sportler picker */}
          <View>
            <Text style={styles.fieldLabel}>Sportler zuweisen</Text>
            {sportlerList.map((s) => {
              const on = sportlerId === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  onPress={() => { setSportlerId(s.id); setErrors((e) => ({ ...e, sp: '' })); }}
                  style={[styles.sportlerBtn, on && styles.sportlerBtnActive]}
                  activeOpacity={0.75}
                >
                  <GBAvatar name={s.name} initials={s.initials} size={40} />
                  <View style={styles.sportlerInfo}>
                    <Text style={styles.sportlerName}>{s.name}</Text>
                    <Text style={styles.sportlerSub}>{s.alter} J · {s.ziel}</Text>
                  </View>
                  <View style={[styles.radio, on && styles.radioActive]}>
                    {on && <GBIcon name="check" size={14} color={C.accentContrast} />}
                  </View>
                </TouchableOpacity>
              );
            })}
            {errors.sp ? <Text style={styles.errText}>{errors.sp}</Text> : null}
          </View>

          {/* Wochen */}
          {isEdit && plan && (
            <View>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionLabel}>Wochen · {plan.wochen.length}</Text>
                <TouchableOpacity
                  style={styles.addWocheBtn}
                  onPress={() => {
                    const wocheId = addWoche(plan.id);
                    navigation.navigate('TrainerWoche', { planId: plan.id, wocheId });
                  }}
                >
                  <GBIcon name="plus" size={14} color={C.accent} />
                  <Text style={styles.addWocheBtnText}>Woche</Text>
                </TouchableOpacity>
              </View>

              {plan.wochen.map((w) => (
                <TouchableOpacity
                  key={w.id}
                  style={styles.wocheCard}
                  onPress={() => navigation.navigate('TrainerWoche', { planId: plan.id, wocheId: w.id })}
                  activeOpacity={0.75}
                >
                  <View style={styles.wocheNum}>
                    <Text style={styles.wocheNumText}>W{w.wochennummer}</Text>
                  </View>
                  <View style={styles.wocheInfo}>
                    <Text style={styles.wocheTitle}>Woche {w.wochennummer}</Text>
                    <Text style={styles.wocheSub} numberOfLines={1}>
                      {w.workouts.length} Workouts{w.notizen ? ` · ${w.notizen}` : ''}
                    </Text>
                  </View>
                  <GBIcon name="chevronRight" size={18} color={C.textDim} />
                </TouchableOpacity>
              ))}

              {plan.wochen.length === 0 && (
                <Text style={styles.emptyNote}>Noch keine Wochen — tippe oben auf +Woche.</Text>
              )}
            </View>
          )}

          <View style={{ height: SP.xxxl }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.lg, paddingBottom: 80 },

  saveChip: { backgroundColor: C.accent, borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.xs + 2 },
  saveChipText: { color: C.accentContrast, fontWeight: '700', fontSize: FONT.sm },

  field: { gap: SP.sm },
  fieldLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  input: { backgroundColor: C.surface, borderRadius: R.md, padding: SP.md, fontSize: FONT.base, color: C.text, borderWidth: 1, borderColor: C.border },
  inputError: { borderColor: C.danger },
  textarea: { height: 80, textAlignVertical: 'top' },
  errText: { fontSize: FONT.xs, color: C.danger },

  sportlerBtn: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, borderRadius: R.lg, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surface, marginBottom: SP.sm },
  sportlerBtnActive: { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.06)' },
  sportlerInfo: { flex: 1 },
  sportlerName: { fontSize: FONT.base, fontWeight: '600', color: C.text },
  sportlerSub: { fontSize: FONT.xs, color: C.textMuted },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioActive: { backgroundColor: C.accent, borderColor: C.accent },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP.sm },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },
  addWocheBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: C.accentLight, borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: SP.xs },
  addWocheBtnText: { color: C.accent, fontWeight: '600', fontSize: FONT.xs },

  wocheCard: { flexDirection: 'row', alignItems: 'center', gap: SP.md, backgroundColor: C.surface, borderRadius: R.md, padding: SP.md, borderWidth: 1, borderColor: C.border, marginBottom: SP.sm },
  wocheNum: { width: 38, height: 38, borderRadius: R.sm, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  wocheNumText: { fontFamily: FONT_MONO, fontSize: FONT.base, fontWeight: '700', color: C.accent },
  wocheInfo: { flex: 1 },
  wocheTitle: { fontSize: FONT.base, fontWeight: '600', color: C.text },
  wocheSub: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },

  emptyNote: { fontSize: FONT.sm, color: C.textDim, textAlign: 'center', paddingVertical: SP.lg },
});
