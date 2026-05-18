import React, { useState, useLayoutEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList, PlanUebung, Schwierigkeitsgrad } from '../../types';
import { useTrainingsplanStore } from '../../store/trainingsplanStore';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainingsplanForm'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainingsplanForm'>;
};

const LEVELS: Schwierigkeitsgrad[] = ['Anfänger', 'Fortgeschritten', 'Profi'];

type UebungDraft = Omit<PlanUebung, 'id'> & { draftId: string };

function emptyUebung(): UebungDraft {
  return {
    draftId: Date.now().toString() + Math.random(),
    name: '',
    saetze: 3,
    wiederholungen: 10,
    gewicht: undefined,
    pause: 60,
  };
}

export default function TrainingsplanFormScreen({ navigation, route }: Props) {
  const { addPlan, updatePlan, getPlanById } = useTrainingsplanStore();
  const { kunden } = useKundenStore();

  const isEdit = !!route.params?.planId;
  const existing = isEdit ? getPlanById(route.params.planId!) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [level, setLevel] = useState<Schwierigkeitsgrad>(existing?.schwierigkeitsgrad ?? 'Anfänger');
  const [kundeId, setKundeId] = useState<string | null>(existing?.kundeId ?? null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [kundeQuery, setKundeQuery] = useState('');
  const [notizen, setNotizen] = useState(existing?.notizen ?? '');
  const [uebungen, setUebungen] = useState<UebungDraft[]>(
    existing?.uebungen.map((u) => ({ ...u, draftId: u.id })) ?? [emptyUebung()]
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Plan bearbeiten' : 'Neuer Plan' });
  }, [navigation, isEdit]);

  const selectedKunde = kunden.find((k) => k.id === kundeId);
  const filteredKunden = useMemo(() => {
    const q = kundeQuery.toLowerCase().trim();
    return q === '' ? kunden : kunden.filter(
      (k) => `${k.vorname} ${k.nachname}`.toLowerCase().includes(q)
    );
  }, [kunden, kundeQuery]);

  const updateUebung = (draftId: string, patch: Partial<UebungDraft>) =>
    setUebungen((us) => us.map((u) => (u.draftId === draftId ? { ...u, ...patch } : u)));

  const removeUebung = (draftId: string) =>
    setUebungen((us) => us.filter((u) => u.draftId !== draftId));

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Pflichtfeld';
    const emptyUeb = uebungen.findIndex((u) => !u.name.trim());
    if (emptyUeb !== -1) e[`uebung_${emptyUeb}`] = 'Name erforderlich';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const planUebungen: PlanUebung[] = uebungen.map((u, i) => ({
      id: (i + 1).toString(),
      name: u.name.trim(),
      saetze: u.saetze,
      wiederholungen: u.wiederholungen,
      gewicht: u.gewicht,
      pause: u.pause,
    }));

    const data = {
      name: name.trim(),
      schwierigkeitsgrad: level,
      kundeId: kundeId ?? undefined,
      notizen: notizen.trim() || undefined,
      uebungen: planUebungen,
    };

    if (isEdit && existing) {
      updatePlan(existing.id, data);
    } else {
      addPlan(data);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Basis-Infos ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plan-Details</Text>
          <View>
            <Text style={styles.label}>Name *</Text>
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={name}
              onChangeText={(v) => { setName(v); setErrors((e) => ({ ...e, name: '' })); }}
              placeholder="z.B. Push/Pull/Legs"
              placeholderTextColor={C.textMuted}
            />
            {errors.name ? <Text style={styles.errorText}>{errors.name}</Text> : null}
          </View>
          <View>
            <Text style={styles.label}>Schwierigkeitsgrad</Text>
            <View style={styles.levelRow}>
              {LEVELS.map((l) => (
                <TouchableOpacity
                  key={l}
                  onPress={() => setLevel(l)}
                  style={[styles.levelBtn, level === l && styles.levelBtnActive]}
                >
                  <Text style={[styles.levelText, level === l && styles.levelTextActive]}>{l}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* ── Kunde (optional) ── */}
        <View style={styles.section}>
          <View style={styles.kundeSectionHead}>
            <Text style={styles.sectionTitle}>Kunde (optional)</Text>
            {kundeId && (
              <TouchableOpacity onPress={() => { setKundeId(null); setPickerOpen(false); }}>
                <Text style={styles.clearKunde}>Entfernen</Text>
              </TouchableOpacity>
            )}
          </View>
          <TouchableOpacity
            style={styles.picker}
            onPress={() => setPickerOpen((o) => !o)}
          >
            {selectedKunde ? (
              <View style={styles.pickerRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{selectedKunde.vorname.charAt(0)}{selectedKunde.nachname.charAt(0)}</Text>
                </View>
                <Text style={styles.pickerName}>{selectedKunde.vorname} {selectedKunde.nachname}</Text>
                <Text style={styles.chevron}>{pickerOpen ? '▲' : '▼'}</Text>
              </View>
            ) : (
              <View style={styles.pickerRow}>
                <Text style={styles.pickerPlaceholder}>Keinem Kunden zugewiesen</Text>
                <Text style={styles.chevron}>{pickerOpen ? '▲' : '▼'}</Text>
              </View>
            )}
          </TouchableOpacity>
          {pickerOpen && (
            <View style={styles.dropdown}>
              <TextInput
                style={styles.dropdownSearch}
                placeholder="Suchen..."
                placeholderTextColor={C.textMuted}
                value={kundeQuery}
                onChangeText={setKundeQuery}
                autoCapitalize="none"
              />
              {filteredKunden.map((k) => (
                <TouchableOpacity
                  key={k.id}
                  style={[styles.dropdownItem, kundeId === k.id && styles.dropdownItemActive]}
                  onPress={() => { setKundeId(k.id); setPickerOpen(false); }}
                >
                  <Text style={[styles.dropdownName, kundeId === k.id && styles.dropdownNameActive]}>
                    {k.vorname} {k.nachname}
                  </Text>
                  {kundeId === k.id && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Notizen ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notizen}
            onChangeText={setNotizen}
            placeholder="Ziele, Besonderheiten..."
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* ── Übungen ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Übungen</Text>
          {uebungen.map((u, i) => (
            <View key={u.draftId} style={styles.uebungCard}>
              <View style={styles.uebungHeader}>
                <View style={styles.uebungNum}>
                  <Text style={styles.uebungNumText}>{i + 1}</Text>
                </View>
                <TextInput
                  style={[styles.uebungNameInput, errors[`uebung_${i}`] && styles.inputError]}
                  value={u.name}
                  onChangeText={(v) => {
                    updateUebung(u.draftId, { name: v });
                    setErrors((e) => ({ ...e, [`uebung_${i}`]: '' }));
                  }}
                  placeholder="Übungsname"
                  placeholderTextColor={C.textMuted}
                />
                {uebungen.length > 1 && (
                  <TouchableOpacity onPress={() => removeUebung(u.draftId)} style={styles.removeBtn}>
                    <Text style={styles.removeBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {errors[`uebung_${i}`] ? <Text style={styles.errorText}>{errors[`uebung_${i}`]}</Text> : null}

              <View style={styles.uebungFields}>
                <NumField label="Sätze"  value={u.saetze}          onChangeFn={(v) => updateUebung(u.draftId, { saetze: v })} />
                <NumField label="Wdh."   value={u.wiederholungen}   onChangeFn={(v) => updateUebung(u.draftId, { wiederholungen: v })} />
                <NumField label="kg"     value={u.gewicht}          onChangeFn={(v) => updateUebung(u.draftId, { gewicht: v })} optional />
                <NumField label="Pause(s)"value={u.pause}           onChangeFn={(v) => updateUebung(u.draftId, { pause: v })} />
              </View>
            </View>
          ))}
          <TouchableOpacity
            style={styles.addUebungBtn}
            onPress={() => setUebungen((us) => [...us, emptyUebung()])}
          >
            <Text style={styles.addUebungBtnText}>+ Übung hinzufügen</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Änderungen speichern' : 'Plan erstellen'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function NumField({ label, value, onChangeFn, optional }: {
  label: string;
  value: number | undefined;
  onChangeFn: (v: number) => void;
  optional?: boolean;
}) {
  return (
    <View style={styles.numField}>
      <Text style={styles.numLabel}>{label}</Text>
      <TextInput
        style={styles.numInput}
        value={value !== undefined ? String(value) : ''}
        onChangeText={(v) => { const n = parseFloat(v); if (!isNaN(n)) onChangeFn(n); else if (optional && v === '') onChangeFn(undefined as unknown as number); }}
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
  textArea: { height: 72, textAlignVertical: 'top' },

  levelRow: { flexDirection: 'row', gap: SP.sm },
  levelBtn: { flex: 1, paddingVertical: SP.md - 2, borderRadius: R.sm, alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  levelBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  levelText: { fontWeight: '600', color: C.textSub, fontSize: FONT.sm },
  levelTextActive: { color: C.white },

  kundeSectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  clearKunde: { color: C.danger, fontSize: FONT.sm, fontWeight: '600' },
  picker: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm, padding: SP.md, backgroundColor: C.cardAlt },
  pickerRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: FONT.sm, fontWeight: '700', color: C.primary },
  pickerName: { flex: 1, fontWeight: '600', color: C.text, fontSize: FONT.base },
  pickerPlaceholder: { flex: 1, color: C.textMuted, fontSize: FONT.base },
  chevron: { color: C.textMuted, fontSize: 11 },

  dropdown: { borderWidth: 1, borderColor: C.border, borderRadius: R.sm, overflow: 'hidden', backgroundColor: C.card },
  dropdownSearch: { padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border, fontSize: FONT.sm, color: C.text },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.bg },
  dropdownItemActive: { backgroundColor: C.primaryLight },
  dropdownName: { flex: 1, fontSize: FONT.base, color: C.text, fontWeight: '500' },
  dropdownNameActive: { color: C.primary, fontWeight: '700' },
  check: { color: C.primary, fontSize: 16, fontWeight: '700' },

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

  addUebungBtn: { borderWidth: 1.5, borderColor: C.primary, borderRadius: R.sm, paddingVertical: SP.md - 2, alignItems: 'center', borderStyle: 'dashed' },
  addUebungBtnText: { color: C.primary, fontWeight: '700', fontSize: FONT.sm },

  saveBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', ...SHADOW_SM },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.md },
});
