import React, { useState, useLayoutEffect, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { KalenderStackParamList, Kunde } from '../../types';
import { useTerminStore } from '../../store/terminStore';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<KalenderStackParamList, 'TerminForm'>;
  route: RouteProp<KalenderStackParamList, 'TerminForm'>;
};

const DAUERN = [30, 45, 60, 90];
const TITEL_VORSCHLAEGE = ['Personal Training', 'Erstgespräch', 'Gruppentraining', 'Probe-Training', 'Check-in'];

function todayIso() { return new Date().toISOString().split('T')[0]; }

function isoToDisplay(iso: string) {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

function displayToIso(s: string): string {
  const p = s.split('.');
  if (p.length === 3 && p[2].length === 4)
    return `${p[2]}-${p[1].padStart(2,'0')}-${p[0].padStart(2,'0')}`;
  return s;
}

function isValidDate(s: string) {
  const iso = displayToIso(s);
  return iso.length === 10 && !isNaN(new Date(iso).getTime());
}

function isValidTime(s: string) {
  return /^\d{2}:\d{2}$/.test(s) && parseInt(s.split(':')[0]) < 24 && parseInt(s.split(':')[1]) < 60;
}

export default function TerminFormScreen({ navigation, route }: Props) {
  const { addTermin, updateTermin, getTerminById } = useTerminStore();
  const { kunden } = useKundenStore();

  const isEdit = !!route.params?.terminId;
  const existing = isEdit ? getTerminById(route.params.terminId!) : undefined;

  const initDatum = existing?.datum ?? route.params?.datum ?? todayIso();

  const [kundeId, setKundeId] = useState<string | null>(existing?.kundeId ?? null);
  const [pickerOpen, setPickerOpen] = useState(!existing?.kundeId);
  const [kundeQuery, setKundeQuery] = useState('');
  const [titel, setTitel] = useState(existing?.titel ?? '');
  const [datum, setDatum] = useState(isoToDisplay(initDatum));
  const [uhrzeit, setUhrzeit] = useState(existing?.uhrzeit ?? '09:00');
  const [dauer, setDauer] = useState(existing?.dauer ?? 60);
  const [notizen, setNotizen] = useState(existing?.notizen ?? '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: isEdit ? 'Termin bearbeiten' : 'Neuer Termin' });
  }, [navigation, isEdit]);

  const selectedKunde = kunden.find((k) => k.id === kundeId);

  const filteredKunden = useMemo(() => {
    const q = kundeQuery.toLowerCase().trim();
    return q === '' ? kunden : kunden.filter(
      (k) => `${k.vorname} ${k.nachname}`.toLowerCase().includes(q)
    );
  }, [kunden, kundeQuery]);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!kundeId) e.kunde = 'Bitte Kunden wählen';
    if (!titel.trim()) e.titel = 'Pflichtfeld';
    if (!isValidDate(datum)) e.datum = 'Format: TT.MM.JJJJ';
    if (!isValidTime(uhrzeit)) e.uhrzeit = 'Format: HH:MM';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const data = {
      kundeId: kundeId!,
      titel: titel.trim(),
      datum: displayToIso(datum),
      uhrzeit,
      dauer,
      notizen: notizen.trim() || undefined,
    };
    if (isEdit && existing) {
      updateTermin(existing.id, data);
    } else {
      addTermin(data);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── Kunde ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kunde *</Text>
          <TouchableOpacity
            style={[styles.picker, errors.kunde && styles.pickerError]}
            onPress={() => { setPickerOpen((o) => !o); setErrors((e) => ({ ...e, kunde: '' })); }}
          >
            {selectedKunde ? (
              <View style={styles.pickerSelected}>
                <KundeAvatar kunde={selectedKunde} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.pickerName}>{selectedKunde.vorname} {selectedKunde.nachname}</Text>
                  <Text style={styles.pickerSub}>{selectedKunde.email}</Text>
                </View>
                <Text style={styles.chevron}>{pickerOpen ? '▲' : '▼'}</Text>
              </View>
            ) : (
              <View style={styles.pickerPlaceholder}>
                <Text style={styles.pickerPlaceholderText}>Kunden wählen...</Text>
                <Text style={styles.chevron}>▼</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.kunde ? <Text style={styles.errorText}>{errors.kunde}</Text> : null}

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
                  onPress={() => { setKundeId(k.id); setPickerOpen(false); setErrors((e) => ({ ...e, kunde: '' })); }}
                >
                  <KundeAvatar kunde={k} small active={kundeId === k.id} />
                  <Text style={[styles.dropdownName, kundeId === k.id && styles.dropdownNameActive]}>
                    {k.vorname} {k.nachname}
                  </Text>
                  {kundeId === k.id && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* ── Titel ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Titel *</Text>
          <TextInput
            style={[styles.input, errors.titel && styles.inputError]}
            value={titel}
            onChangeText={(v) => { setTitel(v); setErrors((e) => ({ ...e, titel: '' })); }}
            placeholder="z.B. Personal Training"
            placeholderTextColor={C.textMuted}
          />
          {errors.titel ? <Text style={styles.errorText}>{errors.titel}</Text> : null}
          <View style={styles.chipRow}>
            {TITEL_VORSCHLAEGE.map((v) => (
              <TouchableOpacity
                key={v}
                style={[styles.chip, titel === v && styles.chipActive]}
                onPress={() => setTitel(v)}
              >
                <Text style={[styles.chipText, titel === v && styles.chipTextActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Datum & Uhrzeit ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Datum & Uhrzeit</Text>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Datum *</Text>
              <TextInput
                style={[styles.input, errors.datum && styles.inputError]}
                value={datum}
                onChangeText={(v) => { setDatum(v); setErrors((e) => ({ ...e, datum: '' })); }}
                placeholder="TT.MM.JJJJ"
                placeholderTextColor={C.textMuted}
                keyboardType="numbers-and-punctuation"
              />
              {errors.datum ? <Text style={styles.errorText}>{errors.datum}</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Uhrzeit *</Text>
              <TextInput
                style={[styles.input, errors.uhrzeit && styles.inputError]}
                value={uhrzeit}
                onChangeText={(v) => { setUhrzeit(v); setErrors((e) => ({ ...e, uhrzeit: '' })); }}
                placeholder="HH:MM"
                placeholderTextColor={C.textMuted}
                keyboardType="numbers-and-punctuation"
              />
              {errors.uhrzeit ? <Text style={styles.errorText}>{errors.uhrzeit}</Text> : null}
            </View>
          </View>
        </View>

        {/* ── Dauer ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dauer</Text>
          <View style={styles.row}>
            {DAUERN.map((d) => (
              <TouchableOpacity
                key={d}
                style={[styles.dauernBtn, dauer === d && styles.dauernBtnActive]}
                onPress={() => setDauer(d)}
              >
                <Text style={[styles.dauernText, dauer === d && styles.dauernTextActive]}>{d} min</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Notizen ── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={notizen}
            onChangeText={setNotizen}
            placeholder="Besonderheiten, Trainingsziele..."
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>{isEdit ? 'Änderungen speichern' : 'Termin anlegen'}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function KundeAvatar({ kunde, small, active }: { kunde: Kunde; small?: boolean; active?: boolean }) {
  const size = small ? 32 : 38;
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: active ? C.primary : C.primaryLight,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: small ? 12 : 14, fontWeight: '700', color: active ? C.white : C.primary }}>
        {kunde.vorname.charAt(0)}{kunde.nachname.charAt(0)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },
  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.md, ...SHADOW_SM },
  sectionTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  row: { flexDirection: 'row', gap: SP.md },
  label: { fontSize: FONT.sm, color: C.textSub, fontWeight: '500', marginBottom: SP.xs },

  input: {
    borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm,
    paddingHorizontal: SP.md, paddingVertical: SP.md - 2,
    fontSize: FONT.base, color: C.text, backgroundColor: C.cardAlt,
  },
  inputError: { borderColor: C.danger },
  textArea: { height: 80, textAlignVertical: 'top' },
  errorText: { color: C.danger, fontSize: FONT.xs },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  chip: { paddingHorizontal: SP.md, paddingVertical: SP.xs + 2, borderRadius: R.full, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: FONT.sm, color: C.textSub, fontWeight: '500' },
  chipTextActive: { color: C.white },

  picker: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm, padding: SP.md, backgroundColor: C.cardAlt },
  pickerError: { borderColor: C.danger },
  pickerSelected: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  pickerPlaceholder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pickerPlaceholderText: { color: C.textMuted, fontSize: FONT.base },
  pickerName: { fontWeight: '700', color: C.text, fontSize: FONT.base },
  pickerSub: { color: C.textMuted, fontSize: FONT.xs },
  chevron: { color: C.textMuted, fontSize: 11 },

  dropdown: { borderWidth: 1, borderColor: C.border, borderRadius: R.sm, overflow: 'hidden' },
  dropdownSearch: { padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border, fontSize: FONT.sm, color: C.text },
  dropdownItem: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.bg },
  dropdownItemActive: { backgroundColor: C.primaryLight },
  dropdownName: { flex: 1, fontSize: FONT.base, fontWeight: '500', color: C.text },
  dropdownNameActive: { color: C.primary, fontWeight: '700' },
  check: { color: C.primary, fontSize: 16, fontWeight: '700' },

  dauernBtn: { flex: 1, paddingVertical: SP.md - 2, borderRadius: R.sm, alignItems: 'center', backgroundColor: C.bg, borderWidth: 1.5, borderColor: C.border },
  dauernBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  dauernText: { fontWeight: '600', color: C.textSub, fontSize: FONT.sm },
  dauernTextActive: { color: C.white },

  saveBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', ...SHADOW_SM },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.md },
});
