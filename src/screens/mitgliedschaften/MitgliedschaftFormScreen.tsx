import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, KeyboardAvoidingView, Platform, TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { MitgliedschaftenStackParamList, MitgliedschaftTyp, Kunde } from '../../types';
import { useMitgliedschaftenStore, addMonths } from '../../store/mitgliedschaftenStore';
import { useKundenStore } from '../../store/kundenStore';

type Props = {
  navigation: StackNavigationProp<MitgliedschaftenStackParamList, 'MitgliedschaftForm'>;
  route: RouteProp<MitgliedschaftenStackParamList, 'MitgliedschaftForm'>;
};

const TYP_CONFIG: Record<MitgliedschaftTyp, { preis: number; features: string[] }> = {
  Basic: {
    preis: 39,
    features: ['Gerätetraining (unbegrenzt)', 'Umkleiden & Duschen', 'App-Zugang'],
  },
  Premium: {
    preis: 89,
    features: ['Alles aus Basic', 'Personal Training 4×/Monat', 'Ernährungsberatung', 'Alle Gruppenkurse'],
  },
};

const LAUFZEITEN: { label: string; monate: number }[] = [
  { label: '1 Monat',   monate: 1 },
  { label: '3 Monate',  monate: 3 },
  { label: '6 Monate',  monate: 6 },
  { label: '12 Monate', monate: 12 },
];

function todayIso(): string {
  return new Date().toISOString().split('T')[0];
}

function formatIso(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export default function MitgliedschaftFormScreen({ navigation, route }: Props) {
  const { addMitgliedschaft } = useMitgliedschaftenStore();
  const { kunden } = useKundenStore();

  const vorausgewaehlterKunde = route.params?.kundeId ?? null;

  const [selectedKundeId, setSelectedKundeId] = useState<string | null>(vorausgewaehlterKunde);
  const [kundePickerOpen, setKundePickerOpen] = useState(!vorausgewaehlterKunde);
  const [kundeSearch, setKundeSearch] = useState('');
  const [typ, setTyp] = useState<MitgliedschaftTyp>('Basic');
  const [laufzeit, setLaufzeit] = useState(12);
  const [startdatum] = useState(todayIso());
  const [errors, setErrors] = useState<{ kunde?: string }>({});

  const selectedKunde: Kunde | undefined = kunden.find((k) => k.id === selectedKundeId);
  const enddatum = addMonths(startdatum, laufzeit);
  const { preis, features } = TYP_CONFIG[typ];
  const gesamtpreis = preis * laufzeit;

  const filteredKunden = useMemo(() => {
    const q = kundeSearch.toLowerCase().trim();
    return q === ''
      ? kunden
      : kunden.filter((k) =>
          `${k.vorname} ${k.nachname}`.toLowerCase().includes(q) ||
          k.email.toLowerCase().includes(q)
        );
  }, [kunden, kundeSearch]);

  const handleSave = () => {
    if (!selectedKundeId) {
      setErrors({ kunde: 'Bitte einen Kunden auswählen.' });
      return;
    }
    addMitgliedschaft({
      kundeId: selectedKundeId,
      typ,
      preis,
      startdatum,
      enddatum,
      status: 'aktiv',
    });
    Alert.alert(
      'Mitgliedschaft angelegt',
      `${typ}-Mitgliedschaft für ${selectedKunde?.vorname} ${selectedKunde?.nachname} wurde erstellt.`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* ── 1. Kunde auswählen ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Kunde auswählen *</Text>

          {/* Ausgewählter Kunde oder Hinweis */}
          <TouchableOpacity
            style={[styles.kundePicker, errors.kunde && styles.kundePickerError]}
            onPress={() => { setKundePickerOpen((o) => !o); setErrors({}); }}
          >
            {selectedKunde ? (
              <View style={styles.kundeSelected}>
                <View style={styles.kundeAvatar}>
                  <Text style={styles.kundeAvatarText}>
                    {selectedKunde.vorname.charAt(0)}{selectedKunde.nachname.charAt(0)}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.kundeSelectedName}>
                    {selectedKunde.vorname} {selectedKunde.nachname}
                  </Text>
                  <Text style={styles.kundeSelectedEmail}>{selectedKunde.email}</Text>
                </View>
                <Text style={styles.chevron}>{kundePickerOpen ? '▲' : '▼'}</Text>
              </View>
            ) : (
              <View style={styles.kundePlaceholder}>
                <Text style={styles.kundePlaceholderText}>Kunden auswählen...</Text>
                <Text style={styles.chevron}>▼</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.kunde && <Text style={styles.errorText}>{errors.kunde}</Text>}

          {/* Aufklapp-Liste */}
          {kundePickerOpen && (
            <View style={styles.kundeDropdown}>
              <TextInput
                style={styles.kundeSearch}
                placeholder="Name oder E-Mail suchen..."
                placeholderTextColor="#9ca3af"
                value={kundeSearch}
                onChangeText={setKundeSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {filteredKunden.map((k) => (
                <TouchableOpacity
                  key={k.id}
                  style={[styles.kundeOption, selectedKundeId === k.id && styles.kundeOptionSelected]}
                  onPress={() => { setSelectedKundeId(k.id); setKundePickerOpen(false); setErrors({}); }}
                >
                  <View style={[styles.kundeAvatar, selectedKundeId === k.id && styles.kundeAvatarSelected]}>
                    <Text style={[styles.kundeAvatarText, selectedKundeId === k.id && styles.kundeAvatarTextSelected]}>
                      {k.vorname.charAt(0)}{k.nachname.charAt(0)}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.kundeOptionName, selectedKundeId === k.id && styles.kundeOptionNameSelected]}>
                      {k.vorname} {k.nachname}
                    </Text>
                    <Text style={styles.kundeOptionEmail}>{k.email}</Text>
                  </View>
                  {selectedKundeId === k.id && (
                    <Text style={styles.checkMark}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
              {filteredKunden.length === 0 && (
                <Text style={styles.kundeNoResult}>Kein Kunde gefunden</Text>
              )}
            </View>
          )}
        </View>

        {/* ── 2. Paket ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Paket</Text>
          {(['Basic', 'Premium'] as MitgliedschaftTyp[]).map((t) => {
            const active = typ === t;
            const conf = TYP_CONFIG[t];
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setTyp(t)}
                style={[styles.paketCard, active && styles.paketCardActive]}
              >
                <View style={styles.paketHeader}>
                  <View style={styles.paketTitleRow}>
                    <View style={[styles.radio, active && styles.radioActive]}>
                      {active && <View style={styles.radioDot} />}
                    </View>
                    <Text style={[styles.paketName, active && styles.paketNameActive]}>{t}</Text>
                  </View>
                  <Text style={[styles.paketPreis, active && styles.paketPreisActive]}>
                    {conf.preis} €/Mo
                  </Text>
                </View>
                {conf.features.map((f) => (
                  <Text key={f} style={[styles.paketFeature, active && styles.paketFeatureActive]}>
                    ✓  {f}
                  </Text>
                ))}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ── 3. Laufzeit ────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Laufzeit</Text>
          <View style={styles.laufzeitRow}>
            {LAUFZEITEN.map(({ label, monate }) => (
              <TouchableOpacity
                key={monate}
                onPress={() => setLaufzeit(monate)}
                style={[styles.laufzeitBtn, laufzeit === monate && styles.laufzeitBtnActive]}
              >
                <Text style={[styles.laufzeitText, laufzeit === monate && styles.laufzeitTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── 4. Zusammenfassung ─────────────────────────────── */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Zusammenfassung</Text>
          {[
            { label: 'Paket',       value: typ },
            { label: 'Start',       value: formatIso(startdatum) },
            { label: 'Ende',        value: formatIso(enddatum) },
            { label: 'Monatlich',   value: `${preis} €` },
            { label: 'Gesamtpreis', value: `${gesamtpreis} €` },
          ].map((row) => (
            <View key={row.label} style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>{row.label}</Text>
              <Text style={[styles.summaryValue, row.label === 'Gesamtpreis' && styles.summaryValueTotal]}>
                {row.value}
              </Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Mitgliedschaft anlegen</Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  content: { padding: 16, gap: 16, paddingBottom: 32 },
  section: { backgroundColor: '#fff', borderRadius: 12, padding: 16, gap: 12 },
  sectionTitle: { fontWeight: '700', color: '#111827', fontSize: 15 },
  errorText: { color: '#ef4444', fontSize: 12 },

  // Kunden-Picker
  kundePicker: {
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 10, padding: 12, backgroundColor: '#fafafa',
  },
  kundePickerError: { borderColor: '#ef4444' },
  kundeSelected: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  kundePlaceholder: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kundePlaceholderText: { color: '#9ca3af', fontSize: 15 },
  chevron: { color: '#9ca3af', fontSize: 12 },
  kundeSelectedName: { fontWeight: '700', color: '#111827', fontSize: 15 },
  kundeSelectedEmail: { color: '#9ca3af', fontSize: 12 },
  kundeAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#ede9fe', alignItems: 'center', justifyContent: 'center',
  },
  kundeAvatarSelected: { backgroundColor: '#6366f1' },
  kundeAvatarText: { fontSize: 13, fontWeight: '700', color: '#6366f1' },
  kundeAvatarTextSelected: { color: '#fff' },
  kundeDropdown: {
    borderWidth: 1, borderColor: '#e5e7eb', borderRadius: 10,
    overflow: 'hidden', backgroundColor: '#fff',
  },
  kundeSearch: {
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
    padding: 12, fontSize: 14, color: '#111827',
  },
  kundeOption: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    padding: 12, borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
  },
  kundeOptionSelected: { backgroundColor: '#ede9fe' },
  kundeOptionName: { fontWeight: '600', color: '#111827', fontSize: 14 },
  kundeOptionNameSelected: { color: '#6366f1' },
  kundeOptionEmail: { color: '#9ca3af', fontSize: 12 },
  checkMark: { color: '#6366f1', fontSize: 16, fontWeight: '700' },
  kundeNoResult: { padding: 16, color: '#9ca3af', textAlign: 'center' },

  // Pakete
  paketCard: {
    borderWidth: 1.5, borderColor: '#e5e7eb',
    borderRadius: 10, padding: 14, gap: 4,
  },
  paketCardActive: { borderColor: '#6366f1', backgroundColor: '#fafafe' },
  paketHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  paketTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  radio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#d1d5db',
    alignItems: 'center', justifyContent: 'center',
  },
  radioActive: { borderColor: '#6366f1' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#6366f1' },
  paketName: { fontWeight: '700', fontSize: 16, color: '#374151' },
  paketNameActive: { color: '#6366f1' },
  paketPreis: { fontWeight: '700', color: '#6b7280', fontSize: 15 },
  paketPreisActive: { color: '#6366f1' },
  paketFeature: { color: '#9ca3af', fontSize: 13, marginLeft: 30 },
  paketFeatureActive: { color: '#4f46e5' },

  // Laufzeit
  laufzeitRow: { flexDirection: 'row', gap: 8 },
  laufzeitBtn: {
    flex: 1, paddingVertical: 10, borderRadius: 8,
    alignItems: 'center', backgroundColor: '#f3f4f6',
    borderWidth: 1.5, borderColor: 'transparent',
  },
  laufzeitBtnActive: { backgroundColor: '#ede9fe', borderColor: '#6366f1' },
  laufzeitText: { fontWeight: '600', color: '#6b7280', fontSize: 13 },
  laufzeitTextActive: { color: '#6366f1' },

  // Zusammenfassung
  summaryCard: {
    backgroundColor: '#1e1b4b', borderRadius: 12, padding: 16, gap: 2,
  },
  summaryTitle: { color: '#a5b4fc', fontSize: 12, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  summaryLabel: { color: '#818cf8', fontSize: 14 },
  summaryValue: { color: '#e0e7ff', fontSize: 14, fontWeight: '600' },
  summaryValueTotal: { color: '#fff', fontSize: 16, fontWeight: '800' },

  // Speichern
  saveButton: {
    backgroundColor: '#6366f1', borderRadius: 10,
    paddingVertical: 15, alignItems: 'center',
  },
  saveButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
