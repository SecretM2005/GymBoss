import React, { useState, useLayoutEffect } from 'react';
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
import { KundenStackParamList } from '../../types';
import { useKundenStore } from '../../store/kundenStore';

type Props = {
  navigation: StackNavigationProp<KundenStackParamList, 'KundeForm'>;
  route: RouteProp<KundenStackParamList, 'KundeForm'>;
};

type FormState = {
  vorname: string;
  nachname: string;
  email: string;
  telefon: string;
  status: 'aktiv' | 'inaktiv';
  eintrittsdatum: string;
  notizen: string;
};

const EMPTY_FORM: FormState = {
  vorname: '',
  nachname: '',
  email: '',
  telefon: '',
  status: 'aktiv',
  eintrittsdatum: new Date().toISOString().split('T')[0],
  notizen: '',
};

function toIso(input: string): string {
  // Erwartet DD.MM.YYYY → YYYY-MM-DD
  const parts = input.split('.');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return input;
}

function toDisplay(iso: string): string {
  // YYYY-MM-DD → DD.MM.YYYY
  const parts = iso.split('-');
  if (parts.length === 3) return `${parts[2]}.${parts[1]}.${parts[0]}`;
  return iso;
}

function isValidDate(input: string): boolean {
  const iso = toIso(input);
  const d = new Date(iso);
  return !isNaN(d.getTime()) && iso.length === 10;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export default function KundeFormScreen({ navigation, route }: Props) {
  const { getKundeById, addKunde, updateKunde } = useKundenStore();
  const isEdit = !!route.params?.kundeId;
  const existing = isEdit ? getKundeById(route.params.kundeId!) : undefined;

  const [form, setForm] = useState<FormState>(
    existing
      ? {
          vorname: existing.vorname,
          nachname: existing.nachname,
          email: existing.email,
          telefon: existing.telefon,
          status: existing.status,
          eintrittsdatum: toDisplay(existing.eintrittsdatum),
          notizen: existing.notizen ?? '',
        }
      : EMPTY_FORM
  );

  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Kunde bearbeiten' : 'Neuer Kunde' });
  }, [navigation, isEdit]);

  const set = (key: keyof FormState, value: string) => {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const validate = (): boolean => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.vorname.trim()) e.vorname = 'Pflichtfeld';
    if (!form.nachname.trim()) e.nachname = 'Pflichtfeld';
    if (!form.email.trim()) e.email = 'Pflichtfeld';
    else if (!isValidEmail(form.email)) e.email = 'Ungültige E-Mail-Adresse';
    if (!form.telefon.trim()) e.telefon = 'Pflichtfeld';
    if (!isValidDate(form.eintrittsdatum)) e.eintrittsdatum = 'Format: TT.MM.JJJJ';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;

    const data = {
      vorname: form.vorname.trim(),
      nachname: form.nachname.trim(),
      email: form.email.trim().toLowerCase(),
      telefon: form.telefon.trim(),
      status: form.status,
      eintrittsdatum: toIso(form.eintrittsdatum),
      notizen: form.notizen.trim() || undefined,
    };

    if (isEdit && existing) {
      updateKunde(existing.id, data);
      navigation.goBack();
    } else {
      addKunde(data);
      navigation.goBack();
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Persönliche Daten */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Persönliche Daten</Text>

          <View style={styles.row}>
            <View style={styles.halfField}>
              <Field
                label="Vorname *"
                value={form.vorname}
                onChange={(v) => set('vorname', v)}
                error={errors.vorname}
                placeholder="Max"
              />
            </View>
            <View style={styles.halfField}>
              <Field
                label="Nachname *"
                value={form.nachname}
                onChange={(v) => set('nachname', v)}
                error={errors.nachname}
                placeholder="Mustermann"
              />
            </View>
          </View>

          <Field
            label="E-Mail *"
            value={form.email}
            onChange={(v) => set('email', v)}
            error={errors.email}
            placeholder="max@example.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Field
            label="Telefon *"
            value={form.telefon}
            onChange={(v) => set('telefon', v)}
            error={errors.telefon}
            placeholder="+49 151 ..."
            keyboardType="phone-pad"
          />
        </View>

        {/* Mitgliedschaft */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mitgliedschaft</Text>

          <Text style={styles.label}>Status</Text>
          <View style={styles.toggleRow}>
            {(['aktiv', 'inaktiv'] as const).map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => setForm((f) => ({ ...f, status: s }))}
                style={[styles.toggleBtn, form.status === s && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleText, form.status === s && styles.toggleTextActive]}>
                  {s === 'aktiv' ? '● Aktiv' : '○ Inaktiv'}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Field
            label="Eintrittsdatum *"
            value={form.eintrittsdatum}
            onChange={(v) => set('eintrittsdatum', v)}
            error={errors.eintrittsdatum}
            placeholder="TT.MM.JJJJ"
            keyboardType="numbers-and-punctuation"
          />
        </View>

        {/* Notizen */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Besonderheiten, Verletzungen, Ziele..."
            placeholderTextColor="#9ca3af"
            value={form.notizen}
            onChangeText={(v) => set('notizen', v)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>
            {isEdit ? 'Änderungen speichern' : 'Kunden anlegen'}
          </Text>
        </TouchableOpacity>

        {isEdit && (
          <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
            <Text style={styles.cancelButtonText}>Abbrechen</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Hilfskomponente ──────────────────────────────────────────────────────────

type FieldProps = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'phone-pad' | 'numbers-and-punctuation';
  autoCapitalize?: 'none' | 'sentences';
};

function Field({ label, value, onChange, error, placeholder, keyboardType = 'default', autoCapitalize = 'sentences' }: FieldProps) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor="#9ca3af"
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15, marginBottom: 2 },
  row: { flexDirection: 'row', gap: 10 },
  halfField: { flex: 1 },
  fieldGroup: { gap: 4 },
  label: { color: '#6b7280', fontSize: 13, fontWeight: '500' },
  input: {
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: '#111827',
    backgroundColor: '#fafafa',
  },
  inputError: { borderColor: '#ef4444' },
  textArea: { height: 90, textAlignVertical: 'top' },
  errorText: { color: '#ef4444', fontSize: 12 },
  toggleRow: { flexDirection: 'row', gap: 10 },
  toggleBtn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  toggleBtnActive: { backgroundColor: '#ede9fe', borderColor: '#6366f1' },
  toggleText: { fontWeight: '600', color: '#9ca3af', fontSize: 14 },
  toggleTextActive: { color: '#6366f1' },
  saveButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  cancelButton: {
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#6b7280', fontWeight: '600', fontSize: 15 },
});
