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
import { C, SP, R, FONT } from '../../theme';
import DatePickerField from '../../components/DatePickerField';

type Props = {
  navigation: StackNavigationProp<SportlerStackParamList, 'SportlerForm'>;
  route: RouteProp<SportlerStackParamList, 'SportlerForm'>;
};

const SPORTARTEN = ['Kraftsport', 'Kampfsport', 'Leichtathletik', 'Konditionierung', 'Mobility', 'Crossfit', 'Andere'] as const;

type Form = { name: string; geburtsdatum: string | null; sportart: string; ziel: string };

function makeInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function SportlerFormScreen({ navigation, route }: Props) {
  const { getSportlerById, addSportler, updateSportler, deleteSportler } = useAthletenStore();
  const isEdit = !!route.params?.sportlerId;
  const existing = isEdit ? getSportlerById(route.params.sportlerId!) : undefined;
  const insets = useSafeAreaInsets();

  const [form, setForm] = useState<Form>(
    existing
      ? { name: existing.name, geburtsdatum: existing.geburtsdatum ?? null, sportart: existing.sportart ?? 'Kraftsport', ziel: existing.ziel ?? '' }
      : { name: '', geburtsdatum: null, sportart: 'Kraftsport', ziel: '' }
  );
  const [errors, setErrors] = useState<Partial<Record<'name', string>>>({});

  const set = (key: keyof Form, val: string | null) => {
    setForm((f) => ({ ...f, [key]: val }));
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
    const data = {
      name: form.name.trim(),
      geburtsdatum: form.geburtsdatum ?? undefined,
      sportart: form.sportart || undefined,
      ziel: form.ziel.trim() || undefined,
    };
    if (isEdit && existing) updateSportler(existing.id, data);
    else addSportler(data);
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert('Sportler löschen', `${existing.name} wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => { deleteSportler(existing.id); navigation.goBack(); } },
    ]);
  };

  const initials = makeInitials(form.name);

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topSub}>{isEdit ? 'Bearbeiten' : 'Neuer Sportler'}</Text>
            <Text style={styles.topTitle} numberOfLines={1}>{form.name.trim() || '—'}</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar preview */}
          <View style={styles.avatarWrap}>
            <GBAvatar name={form.name || '?'} initials={initials} size={84} />
            <Text style={styles.avatarHint}>Initialen werden automatisch generiert</Text>
          </View>

          {/* Name */}
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

          {/* Geburtsdatum */}
          <Field label="Geburtsdatum">
            <DatePickerField
              value={form.geburtsdatum}
              onChange={(iso) => set('geburtsdatum', iso)}
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
                    style={[styles.sportartChip, active && styles.sportartChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sportartChipText, active && styles.sportartChipTextActive]}>{s}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Field>

          {/* Ziel */}
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

          {/* Delete */}
          {isEdit && (
            <TouchableOpacity onPress={handleDelete} style={styles.deleteBtn} activeOpacity={0.8}>
              <GBIcon name="trash" size={18} color={C.warn} />
              <Text style={styles.deleteBtnText}>Sportler löschen</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
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

  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingBottom: SP.md, paddingTop: SP.sm, gap: SP.md },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1 },
  topSub: { fontSize: 11, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  saveBtn: { backgroundColor: C.accent, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  saveBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.xl },

  avatarWrap: { alignItems: 'center', gap: SP.sm, paddingVertical: SP.md },
  avatarHint: { fontSize: FONT.xs, color: C.textDim },

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

  deleteBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(255,106,61,0.25)', backgroundColor: 'rgba(255,106,61,0.06)', marginTop: SP.sm },
  deleteBtnText: { fontSize: FONT.base, fontWeight: '600', color: C.warn },
});
