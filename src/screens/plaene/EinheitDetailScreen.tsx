import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaeneStackParamList, Phase, EinheitUebung, EinheitTemplate, UebungTemplate, Einheit } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useUebungStore } from '../../store/uebungStore';
import { useEinheitStore } from '../../store/einheitStore';
import { GBIcon } from '../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'EinheitDetail'>;
  route: RouteProp<PlaeneStackParamList, 'EinheitDetail'>;
};

// ─── Phase config ─────────────────────────────────────────────────────────────

const PHASE_CFG: Record<Phase, { label: string; color: string; icon: string }> = {
  warmup:       { label: 'Warm-up',     color: '#FF8A66', icon: 'fire' },
  haupteinheit: { label: 'Haupteinheit', color: '#CBFF3E', icon: 'dumbbell' },
  cooldown:     { label: 'Cool-down',   color: '#7ABFFF', icon: 'timer' },
};
const PHASES: Phase[] = ['warmup', 'haupteinheit', 'cooldown'];

// ─── Helpers ──────────────────────────────────────────────────────────────────

let _euId = 1000;
const newUebId = () => `eu_${++_euId}`;
let _eId = 2000;
const newEId = () => `e_${++_eId}`;

function formatParams(u: EinheitUebung): string {
  const parts: string[] = [];
  if (u.saetze && (u.wiederholungen || u.dauer)) {
    if (u.wiederholungen) parts.push(`${u.saetze} × ${u.wiederholungen} Wdh.`);
    else if (u.dauer)     parts.push(`${u.saetze} × ${u.dauer}s`);
  } else {
    if (u.saetze)        parts.push(`${u.saetze} Sätze`);
    if (u.wiederholungen) parts.push(`${u.wiederholungen} Wdh.`);
    if (u.dauer)          parts.push(`${u.dauer}s`);
  }
  if (u.pause)       parts.push(`${u.pause}s Pause`);
  if (u.serienpause) parts.push(`${u.serienpause}s Serienpause`);
  return parts.join(' · ') || '—';
}

// ─── Inline exercise form state ───────────────────────────────────────────────

type Typ = 'wdh' | 'zeit';

type UebForm = {
  name: string;
  typ: Typ;
  saetze: string;
  wdh: string;
  dauer: string;
  pause: string;
  serienpause: string;
  saveToLib: boolean;
  showLibPicker: boolean;
};

const EMPTY_FORM: UebForm = {
  name: '', typ: 'wdh', saetze: '', wdh: '', dauer: '',
  pause: '', serienpause: '', saveToLib: false, showLibPicker: false,
};

function formFromUebung(u: EinheitUebung): UebForm {
  return {
    name:        u.name,
    typ:         u.dauer ? 'zeit' : 'wdh',
    saetze:      u.saetze        != null ? String(u.saetze)        : '',
    wdh:         u.wiederholungen != null ? String(u.wiederholungen) : '',
    dauer:       u.dauer         != null ? String(u.dauer)         : '',
    pause:       u.pause         != null ? String(u.pause)         : '',
    serienpause: u.serienpause   != null ? String(u.serienpause)   : '',
    saveToLib: false,
    showLibPicker: false,
  };
}

function formToUebung(f: UebForm, id: string, templateId?: string): EinheitUebung {
  const n = (s: string) => (s.trim() ? Number(s) : undefined);
  return {
    id,
    name:           f.name.trim(),
    templateId,
    saetze:         n(f.saetze),
    wiederholungen: f.typ === 'wdh'  ? n(f.wdh)   : undefined,
    dauer:          f.typ === 'zeit' ? n(f.dauer)  : undefined,
    pause:          n(f.pause),
    serienpause:    n(f.serienpause),
  };
}

// ─── Main screen ──────────────────────────────────────────────────────────────

type Phases = Record<Phase, EinheitUebung[]>;

export default function EinheitDetailScreen({ navigation, route }: Props) {
  const { planId, wocheId, einheitId } = route.params;
  const { getPlanById, saveEinheit } = usePlanStore();
  const { addUebung: saveUebToLib } = useUebungStore();
  const { einheiten: einheitLib, addEinheit: saveEinheitToLib } = useEinheitStore();
  const { uebungen: uebungLib } = useUebungStore();
  const insets = useSafeAreaInsets();

  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);
  const existing = einheitId ? woche?.einheiten.find((e) => e.id === einheitId) : undefined;

  const [name, setName] = useState(existing?.name ?? '');
  const [nameError, setNameError] = useState('');
  const [phases, setPhases] = useState<Phases>({
    warmup:       existing?.warmup       ?? [],
    haupteinheit: existing?.haupteinheit ?? [],
    cooldown:     existing?.cooldown     ?? [],
  });
  const [saveEinheitLib, setSaveEinheitLib] = useState(false);
  const [showEinheitLib, setShowEinheitLib] = useState(false);

  // Inline exercise form
  const [activePhase, setActivePhase]       = useState<Phase | null>(null);
  const [editingId, setEditingId]           = useState<string | null>(null);
  const [uebForm, setUebForm]               = useState<UebForm>(EMPTY_FORM);
  const [uebNameError, setUebNameError]     = useState('');

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleSaveEinheit = () => {
    if (!name.trim()) { setNameError('Name ist erforderlich'); return; }
    const einheit: Einheit = {
      id:           existing?.id ?? newEId(),
      name:         name.trim(),
      warmup:       phases.warmup,
      haupteinheit: phases.haupteinheit,
      cooldown:     phases.cooldown,
    };
    if (saveEinheitLib) {
      const { id: _id, ...tpl } = einheit;
      saveEinheitToLib(tpl);
    }
    saveEinheit(planId, wocheId, einheit);
    navigation.goBack();
  };

  const openAdd = (phase: Phase) => {
    setActivePhase(phase);
    setEditingId(null);
    setUebForm(EMPTY_FORM);
    setUebNameError('');
  };

  const openEdit = (phase: Phase, u: EinheitUebung) => {
    setActivePhase(phase);
    setEditingId(u.id);
    setUebForm(formFromUebung(u));
    setUebNameError('');
  };

  const cancelUebForm = () => {
    setActivePhase(null);
    setEditingId(null);
    setUebForm(EMPTY_FORM);
    setUebNameError('');
  };

  const submitUebForm = () => {
    if (!uebForm.name.trim()) { setUebNameError('Name erforderlich'); return; }
    if (!activePhase) return;

    const id = editingId ?? newUebId();
    const uebung = formToUebung(uebForm, id);

    if (uebForm.saveToLib) {
      const { id: _id, templateId: _t, ...libData } = uebung;
      saveUebToLib(libData);
    }

    setPhases((prev) => ({
      ...prev,
      [activePhase]: editingId
        ? prev[activePhase].map((u) => (u.id === editingId ? uebung : u))
        : [...prev[activePhase], uebung],
    }));
    cancelUebForm();
  };

  const deleteUebung = (phase: Phase, uid: string) => {
    if (editingId === uid) cancelUebForm();
    setPhases((prev) => ({ ...prev, [phase]: prev[phase].filter((u) => u.id !== uid) }));
  };

  const pickFromEinheitLib = (tpl: EinheitTemplate) => {
    setName(tpl.name);
    const remap = (arr: EinheitUebung[]) =>
      arr.map((u) => ({ ...u, id: newUebId(), templateId: u.id }));
    setPhases({ warmup: remap(tpl.warmup), haupteinheit: remap(tpl.haupteinheit), cooldown: remap(tpl.cooldown) });
    setShowEinheitLib(false);
  };

  const pickFromUebungLib = (tpl: UebungTemplate) => {
    setUebForm((f) => ({
      ...f,
      name:        tpl.name,
      typ:         tpl.dauer ? 'zeit' : 'wdh',
      saetze:      tpl.saetze        != null ? String(tpl.saetze)        : '',
      wdh:         tpl.wiederholungen != null ? String(tpl.wiederholungen) : '',
      dauer:       tpl.dauer         != null ? String(tpl.dauer)         : '',
      pause:       tpl.pause         != null ? String(tpl.pause)         : '',
      serienpause: tpl.serienpause   != null ? String(tpl.serienpause)   : '',
      showLibPicker: false,
    }));
  };

  const setU = (key: keyof UebForm, val: string | boolean) =>
    setUebForm((f) => ({ ...f, [key]: val }));

  // ─── Render ─────────────────────────────────────────────────────────────────

  const totalEx = phases.warmup.length + phases.haupteinheit.length + phases.cooldown.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topSub}>{existing ? 'Einheit bearbeiten' : 'Neue Einheit'}</Text>
            <Text style={styles.topTitle} numberOfLines={1}>{name.trim() || '—'}</Text>
          </View>
          <TouchableOpacity onPress={handleSaveEinheit} style={styles.saveBtn} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Name + Library */}
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.nameInput, nameError ? styles.inputError : null]}
                value={name}
                onChangeText={(v) => { setName(v); setNameError(''); }}
                placeholder="Einheit benennen…"
                placeholderTextColor={C.textDim}
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={styles.libBtn}
                onPress={() => setShowEinheitLib((v) => !v)}
                activeOpacity={0.7}
              >
                <GBIcon name="layers" size={16} color={showEinheitLib ? C.accentContrast : C.textMuted} />
                <Text style={[styles.libBtnText, showEinheitLib && styles.libBtnTextActive]}>Bibliothek</Text>
              </TouchableOpacity>
            </View>
            {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}

            {/* Einheit library picker */}
            {showEinheitLib && (
              <View style={styles.libPicker}>
                <Text style={styles.libPickerTitle}>Aus Bibliothek laden</Text>
                {einheitLib.map((tpl) => (
                  <TouchableOpacity
                    key={tpl.id}
                    style={styles.libItem}
                    onPress={() => pickFromEinheitLib(tpl)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.libItemIcon}>
                      <GBIcon name="dumbbell" size={14} color={C.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.libItemName}>{tpl.name}</Text>
                      <Text style={styles.libItemSub}>
                        {tpl.warmup.length + tpl.haupteinheit.length + tpl.cooldown.length} Übungen
                      </Text>
                    </View>
                    <GBIcon name="chevronRight" size={14} color={C.textDim} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Stats bar */}
          <View style={styles.statsBar}>
            <Text style={styles.statsBarText}>
              {totalEx} {totalEx === 1 ? 'Übung' : 'Übungen'} · 3 Phasen
            </Text>
            <View style={styles.saveLibRow}>
              <TouchableOpacity
                style={styles.saveLibToggle}
                onPress={() => setSaveEinheitLib((v) => !v)}
                activeOpacity={0.7}
              >
                <View style={[styles.checkBox, saveEinheitLib && styles.checkBoxOn]}>
                  {saveEinheitLib && <GBIcon name="check" size={12} color={C.accentContrast} />}
                </View>
                <Text style={styles.saveLibLabel}>In Bibliothek speichern</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Phase sections */}
          {PHASES.map((phase) => {
            const cfg = PHASE_CFG[phase];
            const exercises = phases[phase];
            const isActive = activePhase === phase;

            return (
              <View key={phase} style={styles.phaseSection}>
                {/* Phase header */}
                <View style={[styles.phaseHeader, { borderLeftColor: cfg.color }]}>
                  <Text style={[styles.phaseTitle, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={styles.phaseCount}>{exercises.length} Übungen</Text>
                </View>

                {/* Exercises */}
                {exercises.map((u) => (
                  <View key={u.id} style={[styles.uebungRow, editingId === u.id && styles.uebungRowEditing]}>
                    <View style={[styles.uebungDot, { backgroundColor: cfg.color }]} />
                    <View style={styles.uebungInfo}>
                      <Text style={styles.uebungName}>{u.name}</Text>
                      <Text style={styles.uebungParams}>{formatParams(u)}</Text>
                    </View>
                    <View style={styles.uebungActions}>
                      <TouchableOpacity onPress={() => openEdit(phase, u)} style={styles.miniBtn} activeOpacity={0.7}>
                        <GBIcon name="edit" size={13} color={C.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteUebung(phase, u.id)} style={styles.miniBtnDanger} activeOpacity={0.7}>
                        <GBIcon name="trash" size={13} color={C.warn} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add button */}
                {!isActive && (
                  <TouchableOpacity style={[styles.addUebBtn, { borderColor: cfg.color }]} onPress={() => openAdd(phase)} activeOpacity={0.8}>
                    <GBIcon name="plus" size={15} color={cfg.color} />
                    <Text style={[styles.addUebText, { color: cfg.color }]}>Übung hinzufügen</Text>
                  </TouchableOpacity>
                )}

                {/* Inline exercise form */}
                {isActive && (
                  <View style={[styles.uebForm, { borderColor: cfg.color }]}>
                    <Text style={[styles.uebFormTitle, { color: cfg.color }]}>
                      {editingId ? 'Übung bearbeiten' : `Neue Übung — ${cfg.label}`}
                    </Text>

                    {/* Name row */}
                    <View style={styles.uebNameRow}>
                      <TextInput
                        style={[styles.input, { flex: 1 }, uebNameError ? styles.inputError : null]}
                        value={uebForm.name}
                        onChangeText={(v) => { setU('name', v); setUebNameError(''); }}
                        placeholder="Übungsname"
                        placeholderTextColor={C.textDim}
                        autoCapitalize="words"
                        autoFocus
                      />
                      <TouchableOpacity
                        style={[styles.libBtnSm, uebForm.showLibPicker && styles.libBtnSmActive]}
                        onPress={() => setU('showLibPicker', !uebForm.showLibPicker)}
                        activeOpacity={0.7}
                      >
                        <GBIcon name="search" size={14} color={uebForm.showLibPicker ? C.accentContrast : C.textMuted} />
                      </TouchableOpacity>
                    </View>
                    {uebNameError ? <Text style={styles.errorText}>{uebNameError}</Text> : null}

                    {/* Library picker */}
                    {uebForm.showLibPicker && (
                      <View style={styles.uebLibPicker}>
                        {uebungLib.map((tpl) => (
                          <TouchableOpacity
                            key={tpl.id}
                            style={styles.uebLibItem}
                            onPress={() => pickFromUebungLib(tpl)}
                            activeOpacity={0.7}
                          >
                            <Text style={styles.uebLibItemName}>{tpl.name}</Text>
                            <Text style={styles.uebLibItemParams}>{formatParams({ id: '', ...tpl })}</Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}

                    {/* Type toggle */}
                    <View style={styles.typToggle}>
                      <TouchableOpacity
                        style={[styles.typBtn, uebForm.typ === 'wdh' && styles.typBtnActive]}
                        onPress={() => setU('typ', 'wdh')}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.typBtnText, uebForm.typ === 'wdh' && styles.typBtnTextActive]}>Wdh.-basiert</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.typBtn, uebForm.typ === 'zeit' && styles.typBtnActive]}
                        onPress={() => setU('typ', 'zeit')}
                        activeOpacity={0.7}
                      >
                        <Text style={[styles.typBtnText, uebForm.typ === 'zeit' && styles.typBtnTextActive]}>Zeitbasiert</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Param grid */}
                    <View style={styles.paramGrid}>
                      <ParamInput label="Sätze" value={uebForm.saetze} onChangeText={(v) => setU('saetze', v)} />
                      {uebForm.typ === 'wdh'
                        ? <ParamInput label="Wdh." value={uebForm.wdh} onChangeText={(v) => setU('wdh', v)} />
                        : <ParamInput label="Dauer (s)" value={uebForm.dauer} onChangeText={(v) => setU('dauer', v)} />
                      }
                      <ParamInput label="Pause (s)" value={uebForm.pause} onChangeText={(v) => setU('pause', v)} />
                      <ParamInput label="Serienpause (s)" value={uebForm.serienpause} onChangeText={(v) => setU('serienpause', v)} />
                    </View>

                    {/* Save to library toggle */}
                    <TouchableOpacity style={styles.saveLibToggle} onPress={() => setU('saveToLib', !uebForm.saveToLib)} activeOpacity={0.7}>
                      <View style={[styles.checkBox, uebForm.saveToLib && styles.checkBoxOn]}>
                        {uebForm.saveToLib && <GBIcon name="check" size={12} color={C.accentContrast} />}
                      </View>
                      <Text style={styles.saveLibLabel}>In Übungsbibliothek speichern</Text>
                    </TouchableOpacity>

                    {/* Form buttons */}
                    <View style={styles.uebFormBtns}>
                      <TouchableOpacity style={styles.cancelBtn} onPress={cancelUebForm} activeOpacity={0.7}>
                        <Text style={styles.cancelBtnText}>Abbrechen</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.addBtn, { backgroundColor: cfg.color }]}
                        onPress={submitUebForm}
                        activeOpacity={0.8}
                      >
                        <Text style={styles.addBtnText}>{editingId ? 'Aktualisieren' : 'Hinzufügen'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            );
          })}

          <View style={{ height: 80 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Param number input ───────────────────────────────────────────────────────

function ParamInput({ label, value, onChangeText }: { label: string; value: string; onChangeText: (v: string) => void }) {
  return (
    <View style={param.wrap}>
      <Text style={param.label}>{label}</Text>
      <TextInput
        style={param.input}
        value={value}
        onChangeText={(v) => onChangeText(v.replace(/\D/g, ''))}
        placeholder="—"
        placeholderTextColor={C.textDim}
        keyboardType="number-pad"
        maxLength={5}
      />
    </View>
  );
}

const param = StyleSheet.create({
  wrap:  { flex: 1, minWidth: '45%', gap: 4 },
  label: { fontSize: 10, fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.sm, fontSize: FONT.base, color: C.text, fontFamily: FONT_MONO, textAlign: 'center' },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.md, gap: SP.sm },
  iconBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, paddingHorizontal: SP.sm },
  topSub:    { fontSize: 11, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle:  { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  saveBtn:   { backgroundColor: C.accent, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  saveBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.lg },

  nameSection: { gap: SP.sm },
  nameRow:     { flexDirection: 'row', gap: SP.sm, alignItems: 'center' },
  nameInput:   { flex: 1, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md, fontSize: FONT.md, fontWeight: '700', color: C.text },
  libBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.md },
  libBtnText:  { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.8 },
  libBtnTextActive: { color: C.accent },

  libPicker:      { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  libPickerTitle: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.4, padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  libItem:        { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  libItemIcon:    { width: 32, height: 32, borderRadius: R.md, backgroundColor: C.accentLight, alignItems: 'center', justifyContent: 'center' },
  libItemName:    { fontSize: FONT.base, fontWeight: '600', color: C.text },
  libItemSub:     { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },

  statsBar:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsBarText: { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },

  saveLibRow:    { flexDirection: 'row', alignItems: 'center' },
  saveLibToggle: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  saveLibLabel:  { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600' },
  checkBox:      { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  checkBoxOn:    { borderColor: C.accent, backgroundColor: C.accent },

  phaseSection: { gap: SP.sm },
  phaseHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 3, paddingLeft: SP.sm, marginLeft: -SP.sm },
  phaseTitle:   { fontSize: FONT.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  phaseCount:   { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },

  uebungRow:       { flexDirection: 'row', alignItems: 'center', gap: SP.md, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.md },
  uebungRowEditing: { borderColor: C.accent },
  uebungDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  uebungInfo:      { flex: 1 },
  uebungName:      { fontSize: FONT.base, fontWeight: '600', color: C.text },
  uebungParams:    { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2 },
  uebungActions:   { flexDirection: 'row', gap: 4 },
  miniBtn:         { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  miniBtnDanger:   { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,106,61,0.10)', alignItems: 'center', justifyContent: 'center' },

  addUebBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.md, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed', backgroundColor: 'transparent' },
  addUebText: { fontSize: FONT.sm, fontWeight: '700' },

  uebForm:      { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1.5, padding: SP.lg, gap: SP.md },
  uebFormTitle: { fontSize: FONT.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },

  uebNameRow: { flexDirection: 'row', gap: SP.sm, alignItems: 'center' },
  input:      { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.sm, fontSize: FONT.base, color: C.text },
  inputError: { borderColor: C.warn },
  errorText:  { fontSize: FONT.xs, color: C.warn },

  libBtnSm:       { width: 36, height: 36, borderRadius: R.md, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  libBtnSmActive: { backgroundColor: C.accent, borderColor: C.accent },

  uebLibPicker:      { backgroundColor: C.surfaceAlt, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, maxHeight: 180, overflow: 'hidden' },
  uebLibItem:        { padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  uebLibItemName:    { fontSize: FONT.sm, fontWeight: '600', color: C.text },
  uebLibItemParams:  { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2 },

  typToggle:       { flexDirection: 'row', backgroundColor: C.surfaceAlt, borderRadius: R.md, padding: 3, gap: 3 },
  typBtn:          { flex: 1, paddingVertical: SP.sm - 2, borderRadius: R.sm, alignItems: 'center' },
  typBtnActive:    { backgroundColor: C.accent },
  typBtnText:      { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted },
  typBtnTextActive: { color: C.accentContrast },

  paramGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },

  uebFormBtns: { flexDirection: 'row', gap: SP.sm, marginTop: SP.xs },
  cancelBtn:   { flex: 1, paddingVertical: SP.md, borderRadius: R.md, backgroundColor: C.surfaceAlt, alignItems: 'center' },
  cancelBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.textMuted },
  addBtn:      { flex: 2, paddingVertical: SP.md, borderRadius: R.md, alignItems: 'center' },
  addBtnText:  { fontSize: FONT.sm, fontWeight: '800', color: C.accentContrast },
});
