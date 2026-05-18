import React, { useState, useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useRoleStore } from '../../../store/roleStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerPlanForm'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainerPlanForm'>;
};

export default function TrainerPlanFormScreen({ navigation, route }: Props) {
  const { addPlan, updatePlan, addWoche, deleteWoche, getPlanById } = useTrainingsplanStore();
  const { getSportler, getUserById, currentUser } = useRoleStore();

  const isEdit = !!route.params?.planId;
  const existing = isEdit ? getPlanById(route.params.planId!) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [beschreibung, setBeschreibung] = useState(existing?.beschreibung ?? '');
  const [ziel, setZiel] = useState(existing?.ziel ?? '');
  const [sportlerId, setSportlerId] = useState<string>(existing?.sportlerId ?? '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const sportlerList = getSportler();
  const selectedSportler = getUserById(sportlerId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? (existing?.name ?? 'Plan bearbeiten') : 'Neuer Plan' });
  }, [navigation, isEdit, existing?.name]);

  const plan = isEdit ? getPlanById(route.params.planId!) : undefined;

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Pflichtfeld';
    if (!sportlerId) e.sportler = 'Bitte Sportler auswählen';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const data = {
      name: name.trim(),
      beschreibung: beschreibung.trim() || undefined,
      ziel: ziel.trim() || undefined,
      sportlerId,
      trainerId: currentUser.id,
      startdatum: new Date().toISOString().split('T')[0],
      wochen: [],
    };

    if (isEdit && existing) {
      updatePlan(existing.id, { name: data.name, beschreibung: data.beschreibung, ziel: data.ziel, sportlerId: data.sportlerId });
      navigation.setOptions({ title: data.name });
    } else {
      const newId = addPlan(data);
      navigation.replace('TrainerPlanForm', { planId: newId });
    }
  };

  const handleAddWoche = () => {
    if (!plan) return;
    const wocheId = addWoche(plan.id);
    navigation.navigate('TrainerWoche', { planId: plan.id, wocheId });
  };

  const handleDeleteWoche = (wocheId: string, nr: number) => {
    Alert.alert('Woche löschen', `Woche ${nr} wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteWoche(plan!.id, wocheId) },
    ]);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Basis-Infos */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan-Details</Text>

          <View>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
              placeholder="z.B. Kraftaufbau 12 Wochen"
              placeholderTextColor={C.textMuted}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>

          <View>
            <Text style={styles.label}>Ziel</Text>
            <TextInput
              style={styles.input}
              value={ziel}
              onChangeText={setZiel}
              placeholder="z.B. Muskelmasse aufbauen"
              placeholderTextColor={C.textMuted}
            />
          </View>

          <View>
            <Text style={styles.label}>Beschreibung</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={beschreibung}
              onChangeText={setBeschreibung}
              placeholder="Kurze Beschreibung des Plans..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Sportler-Picker */}
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>Sportler *</Text>
            {selectedSportler && (
              <TouchableOpacity onPress={() => setSportlerId('')}>
                <Text style={styles.clearBtn}>Entfernen</Text>
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.picker, errors.sportler && styles.inputError]}
            onPress={() => setPickerOpen((o) => !o)}
          >
            <View style={styles.pickerRow}>
              {selectedSportler ? (
                <>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {selectedSportler.name.split(' ').map((n) => n[0]).join('')}
                    </Text>
                  </View>
                  <Text style={styles.pickerName}>{selectedSportler.name}</Text>
                </>
              ) : (
                <Text style={styles.pickerPlaceholder}>Sportler auswählen...</Text>
              )}
              <Text style={styles.chevron}>{pickerOpen ? '▲' : '▼'}</Text>
            </View>
          </TouchableOpacity>
          {errors.sportler ? <Text style={styles.errorText}>{errors.sportler}</Text> : null}

          {pickerOpen && (
            <View style={styles.dropdown}>
              {sportlerList.map((s) => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.dropdownItem, sportlerId === s.id && styles.dropdownItemActive]}
                  onPress={() => { setSportlerId(s.id); setPickerOpen(false); setErrors((e) => ({ ...e, sportler: '' })); }}
                >
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{s.name.split(' ').map((n) => n[0]).join('')}</Text>
                  </View>
                  <Text style={[styles.dropdownName, sportlerId === s.id && styles.dropdownNameActive]}>
                    {s.name}
                  </Text>
                  {sportlerId === s.id && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Änderungen speichern' : 'Plan erstellen & Wochen planen'}</Text>
        </TouchableOpacity>

        {/* Wochen – nur im Edit-Modus */}
        {isEdit && plan && (
          <View style={styles.section}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>Wochen ({plan.wochen.length})</Text>
            </View>

            {plan.wochen.map((w) => (
              <TouchableOpacity
                key={w.id}
                style={styles.wocheCard}
                onPress={() => navigation.navigate('TrainerWoche', { planId: plan.id, wocheId: w.id })}
              >
                <View style={styles.wocheLeft}>
                  <View style={styles.wocheNumBadge}>
                    <Text style={styles.wocheNumText}>{w.wochennummer}</Text>
                  </View>
                  <View>
                    <Text style={styles.wocheTitle}>Woche {w.wochennummer}</Text>
                    <Text style={styles.wocheSub}>{w.workouts.length} Workouts</Text>
                  </View>
                </View>
                <View style={styles.wocheRight}>
                  <TouchableOpacity
                    onPress={() => handleDeleteWoche(w.id, w.wochennummer)}
                    style={styles.deleteWocheBtn}
                  >
                    <Text style={styles.deleteWocheBtnText}>✕</Text>
                  </TouchableOpacity>
                  <Text style={styles.wocheChevron}>›</Text>
                </View>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.addWocheBtn} onPress={handleAddWoche}>
              <Text style={styles.addWocheBtnText}>+ Woche hinzufügen</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },
  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.md, ...SHADOW_SM },
  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  label: { fontSize: FONT.sm, color: C.textSub, fontWeight: '500', marginBottom: SP.xs },
  errorText: { color: C.danger, fontSize: FONT.xs },
  clearBtn: { color: C.danger, fontSize: FONT.sm, fontWeight: '600' },

  input: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: SP.md, paddingVertical: SP.md - 2, fontSize: FONT.base, color: C.text, backgroundColor: C.cardAlt },
  inputError: { borderColor: C.danger },
  textArea: { height: 72, textAlignVertical: 'top' },

  picker: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm, padding: SP.md, backgroundColor: C.cardAlt },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FONT.sm, fontWeight: '700', color: C.primary },
  pickerName: { flex: 1, fontWeight: '600', color: C.text, fontSize: FONT.base },
  pickerPlaceholder: { flex: 1, color: C.textMuted, fontSize: FONT.base },
  chevron: { color: C.textMuted, fontSize: 11 },
  dropdown: { borderWidth: 1, borderColor: C.border, borderRadius: R.sm, overflow: 'hidden', backgroundColor: C.card },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.bg },
  dropdownItemActive: { backgroundColor: C.primaryLight },
  dropdownName: { flex: 1, fontSize: FONT.base, color: C.text, fontWeight: '500' },
  dropdownNameActive: { color: C.primary, fontWeight: '700' },
  check: { color: C.primary, fontSize: 16, fontWeight: '700' },

  saveBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', ...SHADOW_SM },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },

  wocheCard: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: C.bg, borderRadius: R.sm, padding: SP.md },
  wocheLeft: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  wocheNumBadge: { width: 36, height: 36, borderRadius: 18, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  wocheNumText: { color: C.white, fontWeight: '800', fontSize: FONT.base },
  wocheTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  wocheSub: { fontSize: FONT.xs, color: C.textMuted },
  wocheRight: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  deleteWocheBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.dangerBg, alignItems: 'center', justifyContent: 'center' },
  deleteWocheBtnText: { color: C.danger, fontSize: 11, fontWeight: '700' },
  wocheChevron: { fontSize: 20, color: C.textMuted },

  addWocheBtn: { borderWidth: 1.5, borderColor: C.primary, borderRadius: R.sm, paddingVertical: SP.md - 2, alignItems: 'center', borderStyle: 'dashed' },
  addWocheBtnText: { color: C.primary, fontWeight: '700', fontSize: FONT.sm },
});
