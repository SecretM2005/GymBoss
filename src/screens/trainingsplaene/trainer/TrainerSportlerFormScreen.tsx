import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useRoleStore } from '../../../store/roleStore';
import TopBar from '../../../components/TopBar';
import GBAvatar from '../../../components/GBAvatar';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerSportlerForm'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainerSportlerForm'>;
};

const SPORTARTEN = ['Kraftsport', 'Kampfsport', 'Leichtathletik', 'Konditionierung', 'Mobility', 'Crossfit', 'Andere'] as const;

type FormState = {
  name: string;
  alter: string;
  sportart: string;
  ziel: string;
};

const EMPTY: FormState = { name: '', alter: '', sportart: 'Kraftsport', ziel: '' };

export default function TrainerSportlerFormScreen({ navigation, route }: Props) {
  const { getUserById, addSportler, updateSportler, deleteSportler } = useRoleStore();
  const isEdit = !!route.params?.sportlerId;
  const existing = isEdit ? getUserById(route.params.sportlerId!) : undefined;

  const [form, setForm] = useState<FormState>(
    existing
      ? { name: existing.name, alter: existing.alter != null ? String(existing.alter) : '', sportart: existing.sportart ?? 'Kraftsport', ziel: existing.ziel ?? '' }
      : EMPTY
  );
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  const setField = (key: keyof FormState, val: string) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = () => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = 'Name ist erforderlich';
    if (form.alter && (isNaN(Number(form.alter)) || Number(form.alter) < 5 || Number(form.alter) > 99))
      e.alter = 'Gültiges Alter eingeben (5–99)';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      name: form.name.trim(),
      alter: form.alter ? Number(form.alter) : undefined,
      sportart: form.sportart || undefined,
      ziel: form.ziel.trim() || undefined,
    };
    if (isEdit && existing) {
      updateSportler(existing.id, data);
    } else {
      addSportler(data);
    }
    navigation.goBack();
  };

  const handleDelete = () => {
    if (!existing) return;
    Alert.alert(
      'Sportler löschen',
      `${existing.name} wirklich löschen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        {
          text: 'Löschen',
          style: 'destructive',
          onPress: () => {
            deleteSportler(existing.id);
            navigation.goBack();
          },
        },
      ]
    );
  };

  const previewInitials = form.name.trim()
    ? form.name.trim().split(/\s+/).filter(Boolean).map((p) => p[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <TopBar
          large
          subtitle={isEdit ? 'Sportler bearbeiten' : 'Neuer Sportler'}
          title={form.name.trim() || (isEdit ? 'Bearbeiten' : 'Hinzufügen')}
          leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
          trailing={
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Speichern</Text>
            </TouchableOpacity>
          }
        />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Avatar preview */}
          <View style={styles.avatarWrap}>
            <GBAvatar name={form.name || '?'} initials={previewInitials} size={80} />
            <Text style={styles.avatarHint}>Initialen werden automatisch generiert</Text>
          </View>

          {/* Name */}
          <FormField
            label="Name"
            required
            error={errors.name}
          >
            <TextInput
              style={[styles.input, errors.name && styles.inputError]}
              value={form.name}
              onChangeText={(v) => setField('name', v)}
              placeholder="Vorname Nachname"
              placeholderTextColor={C.textDim}
              autoCapitalize="words"
              autoCorrect={false}
            />
          </FormField>

          {/* Alter */}
          <FormField label="Alter" error={errors.alter}>
            <TextInput
              style={[styles.input, errors.alter && styles.inputError]}
              value={form.alter}
              onChangeText={(v) => setField('alter', v.replace(/[^0-9]/g, ''))}
              placeholder="z. B. 24"
              placeholderTextColor={C.textDim}
              keyboardType="number-pad"
              maxLength={2}
            />
          </FormField>

          {/* Sportart */}
          <FormField label="Sportart">
            <View style={styles.chipRow}>
              {SPORTARTEN.map((s) => {
                const active = form.sportart === s;
                return (
                  <TouchableOpacity
                    key={s}
                    onPress={() => setField('sportart', s)}
                    style={[styles.sportartChip, active && styles.sportartChipActive]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.sportartChipText, active && styles.sportartChipTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </FormField>

          {/* Trainingsziel */}
          <FormField label="Trainingsziel">
            <TextInput
              style={styles.input}
              value={form.ziel}
              onChangeText={(v) => setField('ziel', v)}
              placeholder="z. B. Kraftaufbau, Wettkampfvorbereitung…"
              placeholderTextColor={C.textDim}
              autoCapitalize="sentences"
            />
          </FormField>

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

function FormField({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>
        {label}
        {required && <Text style={styles.fieldRequired}> *</Text>}
      </Text>
      {children}
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.xl },

  avatarWrap: { alignItems: 'center', gap: SP.sm, paddingVertical: SP.md },
  avatarHint: { fontSize: FONT.xs, color: C.textDim },

  fieldGroup: { gap: SP.xs + 2 },
  fieldLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 },
  fieldRequired: { color: C.accent },
  errorText: { fontSize: FONT.xs, color: C.warn, marginTop: 2 },

  input: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: R.md,
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
    fontSize: FONT.base,
    color: C.text,
  },
  inputError: { borderColor: C.warn },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  sportartChip: {
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderRadius: R.full,
    borderWidth: 1.5,
    borderColor: C.border,
    backgroundColor: C.surface,
  },
  sportartChipActive: { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.10)' },
  sportartChipText: { fontSize: FONT.sm, fontWeight: '600', color: C.textSub },
  sportartChipTextActive: { color: C.accent },

  saveBtn: {
    backgroundColor: C.accent,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm - 1,
    borderRadius: R.full,
  },
  saveBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP.sm,
    paddingVertical: SP.lg,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,106,61,0.25)',
    backgroundColor: 'rgba(255,106,61,0.06)',
    marginTop: SP.sm,
  },
  deleteBtnText: { fontSize: FONT.base, fontWeight: '600', color: C.warn },
});
