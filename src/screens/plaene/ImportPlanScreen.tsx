import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Image, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { PlaeneStackParamList } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useAthletenStore } from '../../store/athletenStore';
import { GBIcon } from '../../components/GBIcon';
import { C, useColors, SP, R, FONT } from '../../theme';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'ImportPlan'>;
  route: RouteProp<PlaeneStackParamList, 'ImportPlan'>;
};

type FileInfo = {
  uri: string;
  type: 'image' | 'pdf' | 'other';
  name: string;
};

type Form = {
  name: string;
  sportart: string;
  beschreibung: string;
  startdatum: string;
  anzahlWochen: number;
};

const SPORTARTEN = ['Kraftsport', 'Kampfsport', 'Leichtathletik', 'Konditionierung', 'Mobility', 'Crossfit', 'Andere'] as const;

function guessNameFromFilename(filename: string): string {
  return filename
    .replace(/\.[^.]+$/, '')       // remove extension
    .replace(/[_-]+/g, ' ')        // underscores/dashes → spaces
    .replace(/\b\w/g, (c) => c.toUpperCase()) // title case
    .trim();
}

export default function ImportPlanScreen({ navigation, route }: Props) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { addPlan, addWoche } = usePlanStore();
  const { sportler } = useAthletenStore();

  const preselectedSportlerId = route.params?.preselectedSportlerId;

  const [file, setFile] = useState<FileInfo | null>(null);
  const [form, setForm] = useState<Form>({
    name: '',
    sportart: 'Kraftsport',
    beschreibung: '',
    startdatum: '',
    anzahlWochen: 4,
  });
  const [nameError, setNameError] = useState('');

  const set = (key: keyof Form, val: string | number) => {
    setForm((f) => ({ ...f, [key]: val }));
    if (key === 'name') setNameError('');
  };

  const applyFile = (f: FileInfo) => {
    setFile(f);
    if (!form.name) {
      setForm((prev) => ({ ...prev, name: guessNameFromFilename(f.name) }));
    }
  };

  const handleCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      applyFile({
        uri: asset.uri,
        type: 'image',
        name: asset.fileName ?? 'Foto',
      });
    }
  };

  const handleGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      applyFile({
        uri: asset.uri,
        type: 'image',
        name: asset.fileName ?? 'Bild',
      });
    }
  };

  const handleDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/*'],
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      const isPdf = asset.mimeType?.includes('pdf');
      const isImage = asset.mimeType?.startsWith('image/');
      applyFile({
        uri: asset.uri,
        type: isPdf ? 'pdf' : isImage ? 'image' : 'other',
        name: asset.name,
      });
    }
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      setNameError('Name ist erforderlich');
      return;
    }
    const sportlerIds = preselectedSportlerId ? [preselectedSportlerId] : [];
    const planId = addPlan({
      name: form.name.trim(),
      sportart: form.sportart || undefined,
      beschreibung: form.beschreibung.trim() || undefined,
      startdatum: form.startdatum.trim() || undefined,
      sportlerIds,
      trainerId: 't1',
    });
    for (let i = 0; i < form.anzahlWochen; i++) {
      addWoche(planId);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={[styles.topSub, { color: C.textMuted }]}>Trainingsplan</Text>
            <Text style={[styles.topTitle, { color: C.text }]}>Aus Datei importieren</Text>
          </View>
          {file && (
            <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: C.accent }]} activeOpacity={0.8}>
              <Text style={styles.saveBtnText}>Speichern</Text>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* File picker / preview */}
          {!file ? (
            <View style={styles.pickerSection}>
              <View style={[styles.pickerHero, { borderColor: C.border }]}>
                <GBIcon name="upload" size={40} color={C.textDim} />
                <Text style={[styles.pickerHeroTitle, { color: C.text }]}>Plan hochladen</Text>
                <Text style={[styles.pickerHeroSub, { color: C.textDim }]}>
                  Fotografiere deinen Plan oder wähle eine Datei. Die erkannten Daten kannst du anschließend prüfen und ergänzen.
                </Text>
              </View>

              <TouchableOpacity style={[styles.sourceBtn, { backgroundColor: C.surface, borderColor: C.border }]} onPress={handleCamera} activeOpacity={0.75}>
                <View style={[styles.sourceBtnIcon, { backgroundColor: 'rgba(203,255,62,0.12)' }]}>
                  <GBIcon name="camera" size={22} color={C.accent} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceBtnTitle, { color: C.text }]}>Foto aufnehmen</Text>
                  <Text style={[styles.sourceBtnSub, { color: C.textMuted }]}>Plan mit der Kamera fotografieren</Text>
                </View>
                <GBIcon name="chevronRight" size={16} color={C.textDim} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sourceBtn, { backgroundColor: C.surface, borderColor: C.border }]} onPress={handleGallery} activeOpacity={0.75}>
                <View style={[styles.sourceBtnIcon, { backgroundColor: 'rgba(122,191,255,0.12)' }]}>
                  <GBIcon name="image" size={22} color="#7ABFFF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceBtnTitle, { color: C.text }]}>Aus Galerie wählen</Text>
                  <Text style={[styles.sourceBtnSub, { color: C.textMuted }]}>Foto aus deiner Fotobibliothek</Text>
                </View>
                <GBIcon name="chevronRight" size={16} color={C.textDim} />
              </TouchableOpacity>

              <TouchableOpacity style={[styles.sourceBtn, { backgroundColor: C.surface, borderColor: C.border }]} onPress={handleDocument} activeOpacity={0.75}>
                <View style={[styles.sourceBtnIcon, { backgroundColor: 'rgba(220,180,255,0.12)' }]}>
                  <GBIcon name="document" size={22} color="#D7B5FF" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceBtnTitle, { color: C.text }]}>Dokument (PDF)</Text>
                  <Text style={[styles.sourceBtnSub, { color: C.textMuted }]}>PDF oder Bilddatei hochladen</Text>
                </View>
                <GBIcon name="chevronRight" size={16} color={C.textDim} />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {/* Preview */}
              <View style={[styles.previewCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                {file.type === 'image' ? (
                  <Image source={{ uri: file.uri }} style={styles.previewImage} resizeMode="contain" />
                ) : (
                  <View style={styles.previewDocRow}>
                    <View style={[styles.previewDocIcon, { backgroundColor: 'rgba(220,180,255,0.15)' }]}>
                      <GBIcon name="document" size={32} color="#D7B5FF" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.previewDocName, { color: C.text }]} numberOfLines={2}>{file.name}</Text>
                      <Text style={[styles.previewDocType, { color: C.textMuted }]}>
                        {file.type === 'pdf' ? 'PDF-Dokument' : 'Dokument'}
                      </Text>
                    </View>
                  </View>
                )}
                <TouchableOpacity style={[styles.changeFileBtn, { borderTopColor: C.border }]} onPress={() => setFile(null)} activeOpacity={0.7}>
                  <GBIcon name="upload" size={14} color={C.textMuted} />
                  <Text style={[styles.changeFileBtnText, { color: C.textMuted }]}>Andere Datei wählen</Text>
                </TouchableOpacity>
              </View>

              {/* Hint */}
              <View style={[styles.hintCard, { backgroundColor: 'rgba(203,255,62,0.07)', borderColor: 'rgba(203,255,62,0.2)' }]}>
                <GBIcon name="edit" size={14} color={C.accent} />
                <Text style={[styles.hintText, { color: C.textSub }]}>
                  Trage die Plandetails aus dem Bild/Dokument unten ein. Die Einheiten kannst du danach im Plan befüllen.
                </Text>
              </View>

              {/* Form */}
              <FieldGroup label="Planname" required error={nameError}>
                <TextInput
                  style={[styles.input, { backgroundColor: C.surface, borderColor: nameError ? C.warn : C.border, color: C.text }]}
                  value={form.name}
                  onChangeText={(v) => set('name', v)}
                  placeholder="z. B. Kraftaufbau Basis"
                  placeholderTextColor={C.textDim}
                  autoCapitalize="words"
                />
              </FieldGroup>

              <FieldGroup label="Sportart">
                <View style={styles.chipRow}>
                  {SPORTARTEN.map((s) => {
                    const active = form.sportart === s;
                    return (
                      <TouchableOpacity
                        key={s}
                        onPress={() => set('sportart', s)}
                        style={[styles.chip, { backgroundColor: C.surface, borderColor: C.border }, active && styles.chipActive]}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.chipText, { color: C.textSub }, active && styles.chipTextActive]}>{s}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </FieldGroup>

              <FieldGroup label="Beschreibung">
                <TextInput
                  style={[styles.input, styles.inputMulti, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  value={form.beschreibung}
                  onChangeText={(v) => set('beschreibung', v)}
                  placeholder="Kurze Beschreibung des Plans…"
                  placeholderTextColor={C.textDim}
                  multiline
                  numberOfLines={3}
                  autoCapitalize="sentences"
                />
              </FieldGroup>

              <FieldGroup label="Startdatum">
                <TextInput
                  style={[styles.input, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  value={form.startdatum}
                  onChangeText={(v) => set('startdatum', v)}
                  placeholder="TT.MM.JJJJ"
                  placeholderTextColor={C.textDim}
                  keyboardType="numbers-and-punctuation"
                />
              </FieldGroup>

              <FieldGroup label="Anzahl Wochen">
                <View style={[styles.stepperRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <TouchableOpacity
                    onPress={() => set('anzahlWochen', Math.max(1, form.anzahlWochen - 1))}
                    style={[styles.stepperBtn, { borderColor: C.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stepperBtnText, { color: C.text }]}>−</Text>
                  </TouchableOpacity>
                  <Text style={[styles.stepperValue, { color: C.text }]}>
                    {form.anzahlWochen} {form.anzahlWochen === 1 ? 'Woche' : 'Wochen'}
                  </Text>
                  <TouchableOpacity
                    onPress={() => set('anzahlWochen', Math.min(52, form.anzahlWochen + 1))}
                    style={[styles.stepperBtn, { borderColor: C.border }]}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.stepperBtnText, { color: C.accent }]}>+</Text>
                  </TouchableOpacity>
                </View>
              </FieldGroup>

              {!preselectedSportlerId && sportler.length > 0 && (
                <View style={[styles.infoCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <GBIcon name="users" size={15} color={C.textMuted} />
                  <Text style={[styles.infoText, { color: C.textMuted }]}>
                    Sportler kannst du nach dem Import im Plan zuweisen.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={[styles.saveBtnFull, { backgroundColor: C.accent }]}
                onPress={handleSave}
                activeOpacity={0.85}
              >
                <GBIcon name="check" size={18} color={C.accentContrast} />
                <Text style={[styles.saveBtnFullText, { color: C.accentContrast }]}>Plan erstellen</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

function FieldGroup({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  const C = useColors();
  return (
    <View style={styles.fieldGroup}>
      <Text style={[styles.fieldLabel, { color: C.textMuted }]}>
        {label}{required && <Text style={{ color: C.accent }}> *</Text>}
      </Text>
      {children}
      {error ? <Text style={[styles.errorText, { color: C.warn }]}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingBottom: SP.md, paddingTop: SP.sm, gap: SP.md },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topSub:      { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle:    { fontSize: 20, fontWeight: '700', letterSpacing: -0.4 },
  saveBtn:     { paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  saveBtnText: { fontSize: FONT.sm, fontWeight: '700', color: '#0a0a0a' },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.lg },

  // Picker phase
  pickerSection: { gap: SP.md },
  pickerHero:    { alignItems: 'center', gap: SP.md, borderRadius: R.xl, borderWidth: 1, borderStyle: 'dashed', paddingVertical: SP.xxxl, paddingHorizontal: SP.xl },
  pickerHeroTitle: { fontSize: FONT.lg, fontWeight: '800', letterSpacing: -0.4 },
  pickerHeroSub:   { fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },

  sourceBtn:      { flexDirection: 'row', alignItems: 'center', gap: SP.md, borderRadius: R.xl, borderWidth: 1, padding: SP.lg },
  sourceBtnIcon:  { width: 48, height: 48, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  sourceBtnTitle: { fontSize: FONT.md, fontWeight: '700' },
  sourceBtnSub:   { fontSize: FONT.sm, marginTop: 2 },

  // Preview phase
  previewCard:    { borderRadius: R.xl, borderWidth: 1, overflow: 'hidden' },
  previewImage:   { width: '100%', height: 240, backgroundColor: '#1a1a1a' },
  previewDocRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.lg },
  previewDocIcon: { width: 56, height: 56, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  previewDocName: { fontSize: FONT.base, fontWeight: '700' },
  previewDocType: { fontSize: FONT.sm, marginTop: 2 },
  changeFileBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.xs, borderTopWidth: 1, paddingVertical: SP.md },
  changeFileBtnText: { fontSize: FONT.sm, fontWeight: '600' },

  hintCard: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  hintText: { flex: 1, fontSize: FONT.sm, lineHeight: 18 },

  fieldGroup: { gap: SP.xs + 2 },
  fieldLabel: { fontSize: FONT.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.4 },
  errorText:  { fontSize: FONT.xs, marginTop: 2 },

  input:       { borderWidth: 1, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md, fontSize: FONT.base },
  inputMulti:  { minHeight: 80, textAlignVertical: 'top' },

  chipRow:       { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  chip:          { paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.full, borderWidth: 1.5 },
  chipActive:    { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.10)' },
  chipText:      { fontSize: FONT.sm, fontWeight: '600' },
  chipTextActive: { color: C.accent },

  stepperRow:   { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderRadius: R.md, overflow: 'hidden' },
  stepperBtn:   { paddingHorizontal: SP.xl, paddingVertical: SP.md, borderRightWidth: 1 },
  stepperBtnText: { fontSize: FONT.xl, fontWeight: '700' },
  stepperValue: { flex: 1, textAlign: 'center', fontSize: FONT.base, fontWeight: '700' },

  infoCard: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  infoText: { flex: 1, fontSize: FONT.sm, lineHeight: 18 },

  saveBtnFull:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, borderRadius: R.lg, paddingVertical: SP.lg },
  saveBtnFullText: { fontSize: FONT.md, fontWeight: '800', letterSpacing: -0.3 },
});
