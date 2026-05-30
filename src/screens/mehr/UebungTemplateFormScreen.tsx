import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MehrStackParamList, UebungParam, UebungParamTyp } from '../../types';
import { useUebungStore } from '../../store/uebungStore';
import { PARAM_CFG, ALL_TYPES, ParamChip, buildSuffix } from '../plaene/EinheitDetailScreen';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

type Props = {
  navigation: StackNavigationProp<MehrStackParamList, 'UebungTemplateForm'>;
  route: RouteProp<MehrStackParamList, 'UebungTemplateForm'>;
};

type AddMode = null | 'picking' | UebungParamTyp;

export default function UebungTemplateFormScreen({ navigation, route }: Props) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { uebungTemplateId } = route.params;
  const { uebungen, addUebung, updateUebung } = useUebungStore();

  const existing = uebungTemplateId ? uebungen.find((u) => u.id === uebungTemplateId) : undefined;

  const [name, setName]                 = useState(existing?.name ?? '');
  const [beschreibung, setBeschreibung] = useState(existing?.beschreibung ?? '');
  const [params, setParams]             = useState<UebungParam[]>(existing?.parameter ?? []);
  const [nameError, setNameError]       = useState('');
  const [addMode, setAddMode]           = useState<AddMode>(null);
  const [newWert, setNewWert]           = useState('');
  const [newUnit, setNewUnit]           = useState('');
  const [newBez, setNewBez]             = useState('');

  const selectType = (typ: UebungParamTyp) => {
    const ex = params.find((p) => p.typ === typ);
    setNewWert(ex?.wert ?? '');
    setNewUnit(ex?.einheit ?? PARAM_CFG[typ].defaultUnit);
    setNewBez(ex?.bezeichnung ?? '');
    setAddMode(typ);
  };

  const confirmParam = () => {
    if (typeof addMode !== 'string' || addMode === 'picking' || !newWert.trim()) return;
    const p: UebungParam = {
      typ: addMode, wert: newWert.trim(),
      einheit: newUnit || undefined,
      bezeichnung: newBez.trim() || undefined,
    };
    setParams((prev) =>
      prev.some((x) => x.typ === addMode)
        ? prev.map((x) => x.typ === addMode ? p : x)
        : [...prev, p]
    );
    setAddMode(null);
    setNewWert(''); setNewUnit(''); setNewBez('');
  };

  const removeParam = (typ: UebungParamTyp) =>
    setParams((prev) => prev.filter((p) => p.typ !== typ));

  const handleSave = () => {
    if (!name.trim()) { setNameError('Name ist erforderlich'); return; }
    const data = { name: name.trim(), beschreibung: beschreibung.trim() || undefined, parameter: params };
    if (existing) {
      updateUebung(existing.id, data);
    } else {
      addUebung(data);
    }
    navigation.goBack();
  };

  const cfg = typeof addMode === 'string' && addMode !== 'picking' ? PARAM_CFG[addMode as UebungParamTyp] : null;
  const preview = name.trim() ? (buildSuffix(params) ? `${name.trim()} (${buildSuffix(params)})` : name.trim()) : '';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>

        {/* Top Bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={s.topCenter}>
            <Text style={[s.topSub, { color: C.textMuted }]}>{existing ? 'Übung bearbeiten' : 'Neue Übung'}</Text>
            <Text style={[s.topTitle, { color: C.text }]} numberOfLines={1}>{name.trim() || '—'}</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={[s.saveBtn, { backgroundColor: C.accent }]} activeOpacity={0.8}>
            <Text style={[s.saveBtnText, { color: C.accentContrast }]}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          {/* Name */}
          <TextInput
            style={[s.nameInput, { backgroundColor: C.surface, borderColor: nameError ? C.warn : C.border, color: C.text }]}
            value={name}
            onChangeText={(v) => { setName(v); setNameError(''); }}
            placeholder="Übungsname…"
            placeholderTextColor={C.textDim}
            autoCapitalize="words"
            autoFocus={!existing}
          />
          {nameError ? <Text style={[s.errText, { color: C.warn }]}>{nameError}</Text> : null}

          {/* Beschreibung */}
          <TextInput
            style={[s.descInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
            value={beschreibung}
            onChangeText={setBeschreibung}
            placeholder="Beschreibung (optional)…"
            placeholderTextColor={C.textDim}
            multiline
            numberOfLines={3}
          />

          {/* Parameters section */}
          <View style={[s.paramSection, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.paramSectionTitle, { color: C.textMuted }]}>Parameter</Text>

            {params.length > 0 && (
              <View style={s.chips}>
                {params.map((p) => (
                  <ParamChip key={p.typ} param={p} onEdit={() => selectType(p.typ)} onDelete={() => removeParam(p.typ)} />
                ))}
              </View>
            )}

            {addMode === null && params.length < 7 && (
              <TouchableOpacity
                style={[s.addParamBtn, { borderColor: `${C.accent}66` }]}
                onPress={() => setAddMode('picking')}
                activeOpacity={0.8}
              >
                <GBIcon name="plus" size={14} color={C.accent} />
                <Text style={[s.addParamText, { color: C.accent }]}>Parameter hinzufügen</Text>
              </TouchableOpacity>
            )}

            {addMode === 'picking' && (
              <View style={[s.picker, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                <Text style={[s.pickerTitle, { color: C.textMuted }]}>Parameter wählen</Text>
                <View style={s.pickerGrid}>
                  {ALL_TYPES.map((typ) => {
                    const pc = PARAM_CFG[typ];
                    const added = params.some((p) => p.typ === typ);
                    return (
                      <TouchableOpacity
                        key={typ}
                        style={[
                          s.pickerBtn,
                          { backgroundColor: C.surface, borderColor: C.border },
                          added && { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.06)' },
                        ]}
                        onPress={() => selectType(typ)}
                        activeOpacity={0.75}
                      >
                        <GBIcon name={pc.icon as any} size={18} color={added ? C.accent : C.text} />
                        <Text style={[s.pickerLabel, { color: added ? C.accent : C.textSub }]}>{pc.label}</Text>
                        {added && (
                          <View style={[s.pickerCheck, { backgroundColor: C.accent }]}>
                            <GBIcon name="check" size={9} color={C.accentContrast} />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TouchableOpacity onPress={() => setAddMode(null)} style={s.cancelPickBtn}>
                  <Text style={[s.cancelPickText, { color: C.textDim }]}>Abbrechen</Text>
                </TouchableOpacity>
              </View>
            )}

            {cfg && addMode !== null && addMode !== 'picking' && (
              <View style={[s.paramInput, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
                <Text style={[s.paramInputTitle, { color: C.textMuted }]}>{cfg.label}</Text>
                <View style={s.paramInputRow}>
                  <TextInput
                    style={[s.paramField, { flex: 1, backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                    value={newWert}
                    onChangeText={setNewWert}
                    placeholder={cfg.placeholder}
                    placeholderTextColor={C.textDim}
                    autoFocus
                    onSubmitEditing={confirmParam}
                  />
                  {cfg.units.length > 0 && (
                    <View style={s.unitRow}>
                      {cfg.units.map((u) => (
                        <TouchableOpacity
                          key={u}
                          style={[
                            s.unitBtn,
                            { borderColor: C.border, backgroundColor: C.surface },
                            newUnit === u && { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.10)' },
                          ]}
                          onPress={() => setNewUnit(u)}
                          activeOpacity={0.7}
                        >
                          <Text style={[s.unitText, { color: newUnit === u ? C.accent : C.textSub }]}>{u}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
                {cfg.hasBez && (
                  <TextInput
                    style={[s.paramField, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                    value={newBez}
                    onChangeText={setNewBez}
                    placeholder='Bezeichnung (z.B. "Trabpause")'
                    placeholderTextColor={C.textDim}
                    autoCapitalize="words"
                  />
                )}
                <View style={s.paramBtns}>
                  <TouchableOpacity style={[s.backBtn, { backgroundColor: C.surface }]} onPress={() => setAddMode('picking')}>
                    <Text style={[s.backBtnText, { color: C.textMuted }]}>← Zurück</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[s.confirmBtn, { backgroundColor: newWert.trim() ? C.accent : C.surfaceAlt }]}
                    onPress={confirmParam}
                  >
                    <Text style={[s.confirmBtnText, { color: newWert.trim() ? C.accentContrast : C.textDim }]}>Übernehmen</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Preview */}
          {preview ? (
            <View style={[s.preview, { borderColor: 'rgba(203,255,62,0.15)' }]}>
              <Text style={[s.previewLabel, { color: C.accent }]}>Vorschau</Text>
              <Text style={[s.previewText, { color: C.text }]}>{preview}</Text>
            </View>
          ) : null}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  topBar:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.md, gap: SP.sm },
  iconBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, paddingHorizontal: SP.sm },
  topSub:    { fontSize: 11, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle:  { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  saveBtn:   { paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  saveBtnText: { fontSize: FONT.sm, fontWeight: '700' },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.lg },

  nameInput: { borderWidth: 1, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md, fontSize: FONT.md, fontWeight: '700' },
  descInput: { borderWidth: 1, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.md, fontSize: FONT.base, minHeight: 72, textAlignVertical: 'top' },
  errText:   { fontSize: FONT.xs },

  paramSection:      { borderRadius: R.xl, borderWidth: 1, padding: SP.lg, gap: SP.md },
  paramSectionTitle: { fontSize: FONT.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  chips:             { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },

  addParamBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.sm + 2, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed' },
  addParamText: { fontSize: FONT.sm, fontWeight: '700' },

  picker:       { borderRadius: R.lg, borderWidth: 1, padding: SP.md, gap: SP.sm },
  pickerTitle:  { fontSize: FONT.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  pickerGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  pickerBtn:    { width: '30%', flexGrow: 1, flexDirection: 'column', alignItems: 'center', gap: 4, paddingVertical: SP.sm + 2, borderRadius: R.md, borderWidth: 1 },
  pickerLabel:  { fontSize: 10, fontWeight: '700', textAlign: 'center' },
  pickerCheck:  { position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  cancelPickBtn: { alignItems: 'center', paddingVertical: SP.sm },
  cancelPickText: { fontSize: FONT.xs, fontWeight: '700' },

  paramInput:       { borderRadius: R.lg, borderWidth: 1, padding: SP.md, gap: SP.sm },
  paramInputTitle:  { fontSize: FONT.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  paramInputRow:    { flexDirection: 'row', gap: SP.sm, alignItems: 'center' },
  paramField:       { borderWidth: 1, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.sm, fontSize: FONT.base, fontFamily: FONT_MONO },
  unitRow:          { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  unitBtn:          { paddingHorizontal: SP.sm, paddingVertical: SP.sm - 1, borderRadius: R.full, borderWidth: 1 },
  unitText:         { fontSize: FONT.xs, fontWeight: '700' },
  paramBtns:        { flexDirection: 'row', gap: SP.sm },
  backBtn:          { flex: 1, paddingVertical: SP.sm, borderRadius: R.md, alignItems: 'center' },
  backBtnText:      { fontSize: FONT.xs, fontWeight: '700' },
  confirmBtn:       { flex: 2, paddingVertical: SP.sm, borderRadius: R.md, alignItems: 'center' },
  confirmBtnText:   { fontSize: FONT.sm, fontWeight: '800' },

  preview:      { backgroundColor: 'rgba(203,255,62,0.06)', borderRadius: R.lg, borderWidth: 1, padding: SP.md, gap: 4 },
  previewLabel: { fontSize: 9, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },
  previewText:  { fontSize: FONT.sm, fontWeight: '600', lineHeight: 20 },
});
