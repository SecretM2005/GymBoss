import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PlaeneStackParamList, Phase, EinheitUebung, EinheitTemplate,
  UebungTemplate, Einheit, UebungParam, UebungParamTyp,
} from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useUebungStore } from '../../store/uebungStore';
import { useEinheitStore } from '../../store/einheitStore';
import { GBIcon } from '../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'EinheitDetail'>;
  route: RouteProp<PlaeneStackParamList, 'EinheitDetail'>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

const PHASE_CFG: Record<Phase, { label: string; color: string }> = {
  warmup:       { label: 'Warm-up',     color: '#FF8A66' },
  haupteinheit: { label: 'Haupteinheit', color: '#CBFF3E' },
  cooldown:     { label: 'Cool-down',   color: '#7ABFFF' },
};
const PHASES: Phase[] = ['warmup', 'haupteinheit', 'cooldown'];

type ParamCfg = {
  label: string;
  icon: string;
  placeholder: string;
  defaultUnit: string;
  units: string[];
  hasBez: boolean; // has custom "bezeichnung" field
};

const PARAM_CFG: Record<UebungParamTyp, ParamCfg> = {
  serien:         { label: 'Serien',         icon: 'layers',    placeholder: 'z.B. 3',    defaultUnit: '',    units: [],                  hasBez: false },
  wiederholungen: { label: 'Wiederholungen', icon: 'repeat',    placeholder: 'z.B. 6-8',  defaultUnit: '',    units: [],                  hasBez: false },
  gewicht:        { label: 'Gewicht',        icon: 'dumbbell',  placeholder: 'z.B. 80',   defaultUnit: 'kg',  units: ['kg', 'lbs'],       hasBez: false },
  distanz:        { label: 'Distanz',        icon: 'flag',      placeholder: 'z.B. 400',  defaultUnit: 'm',   units: ['m', 'km', 'mi'],   hasBez: false },
  dauer:          { label: 'Dauer',          icon: 'timer',     placeholder: 'z.B. 63',   defaultUnit: 's',   units: ['s', 'min', 'h'],   hasBez: false },
  pause:          { label: 'Pause',          icon: 'clock',     placeholder: 'z.B. 30',   defaultUnit: 's',   units: ['s', 'min'],        hasBez: true  },
  serienpause:    { label: 'Serienpause',    icon: 'stopwatch', placeholder: 'z.B. 120',  defaultUnit: 's',   units: ['s', 'min'],        hasBez: false },
};

const ALL_TYPES: UebungParamTyp[] = ['serien', 'wiederholungen', 'gewicht', 'distanz', 'dauer', 'pause', 'serienpause'];

// ─── Natural-language preview ─────────────────────────────────────────────────

export function buildSuffix(params: UebungParam[]): string {
  const get = (t: UebungParamTyp) => params.find((p) => p.typ === t);
  const serien = get('serien');
  const wdh    = get('wiederholungen');
  const kg     = get('gewicht');
  const dist   = get('distanz');
  const dauer  = get('dauer');
  const pause  = get('pause');
  const sp     = get('serienpause');

  const inner: string[] = [];
  if (wdh)   inner.push(`${wdh.wert}x`);
  if (kg)    inner.push(`${kg.wert} ${kg.einheit ?? 'kg'}`);
  if (dist)  inner.push(`${dist.wert} ${dist.einheit ?? 'm'}`);
  if (dauer) inner.push(`in ${dauer.wert}${dauer.einheit ?? 's'}`);
  if (pause) inner.push(`mit ${pause.wert}${pause.einheit ?? 's'} ${pause.bezeichnung?.trim() || 'Pause'}`);
  if (sp)    inner.push(`${sp.wert}${sp.einheit ?? 's'} Serienpause`);

  const innerStr = inner.join(' ');
  if (serien && innerStr) return `${serien.wert} Serien: ${innerStr}`;
  if (serien) return `${serien.wert} Serien`;
  return innerStr;
}

function buildPreview(name: string, params: UebungParam[]): string {
  if (!name.trim()) return '';
  const suffix = buildSuffix(params);
  return suffix ? `${name.trim()} (${suffix})` : name.trim();
}

function formatParamChip(p: UebungParam): string {
  switch (p.typ) {
    case 'serien':         return `${p.wert} Ser.`;
    case 'wiederholungen': return `${p.wert}×`;
    case 'gewicht':        return `${p.wert} ${p.einheit ?? 'kg'}`;
    case 'distanz':        return `${p.wert} ${p.einheit ?? 'm'}`;
    case 'dauer':          return `${p.wert} ${p.einheit ?? 's'}`;
    case 'pause':          return `${p.wert}${p.einheit ?? 's'} ${p.bezeichnung || 'Pause'}`;
    case 'serienpause':    return `${p.wert}${p.einheit ?? 's'} S-Pause`;
  }
}

// ─── ID helpers ───────────────────────────────────────────────────────────────

let _euId = 1000;
const newUebId = () => `eu_${++_euId}`;
let _eId = 2000;
const newEId = () => `e_${++_eId}`;

// ─── ParamChip ────────────────────────────────────────────────────────────────

function ParamChip({ param, onEdit, onDelete }: {
  param: UebungParam;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={chip.wrap}>
      <TouchableOpacity onPress={onEdit} style={chip.inner} activeOpacity={0.7}>
        <Text style={chip.type}>{PARAM_CFG[param.typ].label}</Text>
        <Text style={chip.value}>{formatParamChip(param)}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={chip.del} activeOpacity={0.7}>
        <GBIcon name="close" size={10} color={C.textDim} />
      </TouchableOpacity>
    </View>
  );
}

const chip = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', backgroundColor: C.surfaceAlt, borderRadius: R.full, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  inner: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: SP.sm, paddingVertical: 5, paddingRight: SP.xs },
  type:  { fontSize: 9, fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.6 },
  value: { fontFamily: FONT_MONO, fontSize: FONT.sm, fontWeight: '700', color: C.text },
  del:   { paddingHorizontal: 6, paddingVertical: 5, borderLeftWidth: 1, borderLeftColor: C.border },
});

// ─── Inline exercise form ─────────────────────────────────────────────────────

type AddMode = null | 'picking' | UebungParamTyp;

function UebungForm({ phase, phaseColor, initialUebung, uebungLib, onSubmit, onCancel }: {
  phase: Phase;
  phaseColor: string;
  initialUebung?: EinheitUebung;
  uebungLib: UebungTemplate[];
  onSubmit: (u: EinheitUebung, saveToLib: boolean) => void;
  onCancel: () => void;
}) {
  const [name, setName]           = useState(initialUebung?.name ?? '');
  const [params, setParams]       = useState<UebungParam[]>(initialUebung?.parameter ?? []);
  const [addMode, setAddMode]     = useState<AddMode>(null);
  const [newWert, setNewWert]     = useState('');
  const [newUnit, setNewUnit]     = useState('');
  const [newBez, setNewBez]       = useState('');
  const [saveToLib, setSaveToLib] = useState(false);
  const [showLib, setShowLib]     = useState(false);
  const [nameErr, setNameErr]     = useState('');

  const selectType = (typ: UebungParamTyp) => {
    const existing = params.find((p) => p.typ === typ);
    setNewWert(existing?.wert ?? '');
    setNewUnit(existing?.einheit ?? PARAM_CFG[typ].defaultUnit);
    setNewBez(existing?.bezeichnung ?? '');
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

  const pickLib = (tpl: UebungTemplate) => {
    setName(tpl.name);
    setParams(tpl.parameter);
    setShowLib(false);
  };

  const handleSubmit = () => {
    if (!name.trim()) { setNameErr('Name erforderlich'); return; }
    onSubmit({
      id: initialUebung?.id ?? newUebId(),
      name: name.trim(),
      templateId: initialUebung?.templateId,
      parameter: params,
    }, saveToLib);
  };

  const cfg = typeof addMode === 'string' && addMode !== 'picking' ? PARAM_CFG[addMode] : null;
  const preview = buildPreview(name, params);

  return (
    <View style={[form.wrap, { borderColor: `${phaseColor}55` }]}>
      <Text style={[form.title, { color: phaseColor }]}>
        {PHASE_CFG[phase].label} · {initialUebung ? 'Übung bearbeiten' : 'Neue Übung'}
      </Text>

      {/* Name + library */}
      <View style={form.nameRow}>
        <TextInput
          style={[form.nameInput, nameErr ? form.inputErr : null]}
          value={name}
          onChangeText={(v) => { setName(v); setNameErr(''); }}
          placeholder="Übungsname…"
          placeholderTextColor={C.textDim}
          autoCapitalize="words"
          autoFocus={!initialUebung}
        />
        <TouchableOpacity
          style={[form.libBtn, showLib && form.libBtnOn]}
          onPress={() => setShowLib((v) => !v)}
          activeOpacity={0.7}
        >
          <GBIcon name="search" size={15} color={showLib ? C.accentContrast : C.textMuted} />
        </TouchableOpacity>
      </View>
      {nameErr ? <Text style={form.errText}>{nameErr}</Text> : null}

      {/* Library picker */}
      {showLib && (
        <View style={form.libList}>
          {uebungLib.length === 0
            ? <Text style={form.libEmpty}>Keine gespeicherten Übungen</Text>
            : uebungLib.map((tpl) => (
              <TouchableOpacity key={tpl.id} style={form.libItem} onPress={() => pickLib(tpl)} activeOpacity={0.7}>
                <Text style={form.libItemName}>{tpl.name}</Text>
                {tpl.parameter.length > 0 && (
                  <Text style={form.libItemParams}>{buildSuffix(tpl.parameter)}</Text>
                )}
              </TouchableOpacity>
            ))
          }
        </View>
      )}

      {/* Param chips */}
      {params.length > 0 && (
        <View style={form.chips}>
          {params.map((p) => (
            <ParamChip
              key={p.typ}
              param={p}
              onEdit={() => selectType(p.typ)}
              onDelete={() => removeParam(p.typ)}
            />
          ))}
        </View>
      )}

      {/* Add param button / type picker / value input */}
      {addMode === null && params.length < 7 && (
        <TouchableOpacity
          style={[form.addParamBtn, { borderColor: `${phaseColor}66` }]}
          onPress={() => setAddMode('picking')}
          activeOpacity={0.8}
        >
          <GBIcon name="plus" size={14} color={phaseColor} />
          <Text style={[form.addParamText, { color: phaseColor }]}>Element hinzufügen</Text>
        </TouchableOpacity>
      )}

      {addMode === 'picking' && (
        <View style={form.picker}>
          <Text style={form.pickerTitle}>Element wählen</Text>
          <View style={form.pickerGrid}>
            {ALL_TYPES.map((typ) => {
              const c = PARAM_CFG[typ];
              const added = params.some((p) => p.typ === typ);
              return (
                <TouchableOpacity
                  key={typ}
                  style={[form.pickerBtn, added && form.pickerBtnAdded]}
                  onPress={() => selectType(typ)}
                  activeOpacity={0.75}
                >
                  <GBIcon name={c.icon as any} size={18} color={added ? C.accent : C.text} />
                  <Text style={[form.pickerLabel, added && form.pickerLabelAdded]}>{c.label}</Text>
                  {added && <View style={form.pickerCheck}><GBIcon name="check" size={9} color={C.accentContrast} /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setAddMode(null)} style={form.cancelPickBtn}>
            <Text style={form.cancelPickText}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      )}

      {cfg && addMode !== 'picking' && (
        <View style={form.paramInput}>
          <Text style={form.paramInputTitle}>{cfg.label}</Text>
          <View style={form.paramInputRow}>
            <TextInput
              style={[form.paramInputField, { flex: 1 }]}
              value={newWert}
              onChangeText={setNewWert}
              placeholder={cfg.placeholder}
              placeholderTextColor={C.textDim}
              autoFocus
              onSubmitEditing={confirmParam}
            />
            {cfg.units.length > 0 && (
              <View style={form.unitRow}>
                {cfg.units.map((u) => (
                  <TouchableOpacity
                    key={u}
                    style={[form.unitBtn, newUnit === u && form.unitBtnOn]}
                    onPress={() => setNewUnit(u)}
                    activeOpacity={0.7}
                  >
                    <Text style={[form.unitText, newUnit === u && form.unitTextOn]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {cfg.hasBez && (
            <TextInput
              style={form.paramInputField}
              value={newBez}
              onChangeText={setNewBez}
              placeholder='Bezeichnung (z.B. "Trabpause")'
              placeholderTextColor={C.textDim}
              autoCapitalize="words"
            />
          )}
          <View style={form.paramBtns}>
            <TouchableOpacity style={form.backBtn} onPress={() => setAddMode('picking')}>
              <Text style={form.backBtnText}>← Zurück</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[form.confirmBtn, { backgroundColor: newWert.trim() ? phaseColor : C.surfaceAlt }]}
              onPress={confirmParam}
            >
              <Text style={[form.confirmBtnText, { color: newWert.trim() ? C.accentContrast : C.textDim }]}>
                Übernehmen
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Preview */}
      {preview.length > 0 && (
        <View style={form.preview}>
          <Text style={form.previewLabel}>Vorschau</Text>
          <Text style={form.previewText}>{preview}</Text>
        </View>
      )}

      {/* Save to library */}
      <TouchableOpacity style={form.libToggle} onPress={() => setSaveToLib((v) => !v)} activeOpacity={0.7}>
        <View style={[form.check, saveToLib && form.checkOn]}>
          {saveToLib && <GBIcon name="check" size={11} color={C.accentContrast} />}
        </View>
        <Text style={form.libToggleLabel}>In Übungsbibliothek speichern</Text>
      </TouchableOpacity>

      {/* Form action buttons */}
      <View style={form.btns}>
        <TouchableOpacity style={form.cancelBtn} onPress={onCancel} activeOpacity={0.7}>
          <Text style={form.cancelBtnText}>Abbrechen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[form.submitBtn, { backgroundColor: phaseColor }]}
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text style={form.submitBtnText}>{initialUebung ? 'Aktualisieren' : 'Hinzufügen'}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const form = StyleSheet.create({
  wrap:        { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1.5, padding: SP.lg, gap: SP.md },
  title:       { fontSize: FONT.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },

  nameRow:     { flexDirection: 'row', gap: SP.sm, alignItems: 'center' },
  nameInput:   { flex: 1, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.sm + 1, fontSize: FONT.base, fontWeight: '700', color: C.text },
  inputErr:    { borderColor: C.warn },
  errText:     { fontSize: FONT.xs, color: C.warn },
  libBtn:      { width: 38, height: 38, borderRadius: R.md, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  libBtnOn:    { backgroundColor: C.accent, borderColor: C.accent },

  libList:     { backgroundColor: C.surfaceAlt, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, maxHeight: 200, overflow: 'hidden' },
  libEmpty:    { padding: SP.md, fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },
  libItem:     { padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  libItemName: { fontSize: FONT.sm, fontWeight: '700', color: C.text },
  libItemParams: { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2 },

  chips:       { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },

  addParamBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.sm + 2, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed' },
  addParamText: { fontSize: FONT.sm, fontWeight: '700' },

  picker:       { backgroundColor: C.surfaceAlt, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.md, gap: SP.sm },
  pickerTitle:  { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  pickerGrid:   { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  pickerBtn:    { width: '30%', flexGrow: 1, flexDirection: 'column', alignItems: 'center', gap: 4, paddingVertical: SP.sm + 2, borderRadius: R.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border },
  pickerBtnAdded: { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.06)' },
  pickerLabel:  { fontSize: 10, fontWeight: '700', color: C.textSub, textAlign: 'center' },
  pickerLabelAdded: { color: C.accent },
  pickerCheck:  { position: 'absolute', top: 4, right: 4, width: 14, height: 14, borderRadius: 7, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  cancelPickBtn: { alignItems: 'center', paddingVertical: SP.sm },
  cancelPickText: { fontSize: FONT.xs, fontWeight: '700', color: C.textDim },

  paramInput:       { backgroundColor: C.surfaceAlt, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.md, gap: SP.sm },
  paramInputTitle:  { fontSize: FONT.xs, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2 },
  paramInputRow:    { flexDirection: 'row', gap: SP.sm, alignItems: 'center' },
  paramInputField:  { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.sm, fontSize: FONT.base, color: C.text, fontFamily: FONT_MONO },
  unitRow:          { flexDirection: 'row', gap: 4 },
  unitBtn:          { paddingHorizontal: SP.sm, paddingVertical: SP.sm - 1, borderRadius: R.full, borderWidth: 1, borderColor: C.border, backgroundColor: C.surface },
  unitBtnOn:        { borderColor: C.accent, backgroundColor: 'rgba(203,255,62,0.10)' },
  unitText:         { fontSize: FONT.xs, fontWeight: '700', color: C.textSub },
  unitTextOn:       { color: C.accent },
  paramBtns:        { flexDirection: 'row', gap: SP.sm },
  backBtn:          { flex: 1, paddingVertical: SP.sm, borderRadius: R.md, alignItems: 'center', backgroundColor: C.surface },
  backBtnText:      { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted },
  confirmBtn:       { flex: 2, paddingVertical: SP.sm, borderRadius: R.md, alignItems: 'center' },
  confirmBtnText:   { fontSize: FONT.sm, fontWeight: '800' },

  preview:      { backgroundColor: 'rgba(203,255,62,0.06)', borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(203,255,62,0.15)', padding: SP.md, gap: 4 },
  previewLabel: { fontSize: 9, fontWeight: '800', color: C.accent, textTransform: 'uppercase', letterSpacing: 1.4 },
  previewText:  { fontSize: FONT.sm, color: C.text, fontWeight: '600', lineHeight: 20 },

  libToggle:      { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  libToggleLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600' },
  check:          { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  checkOn:        { borderColor: C.accent, backgroundColor: C.accent },

  btns:          { flexDirection: 'row', gap: SP.sm },
  cancelBtn:     { flex: 1, paddingVertical: SP.md, borderRadius: R.md, backgroundColor: C.surfaceAlt, alignItems: 'center' },
  cancelBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.textMuted },
  submitBtn:     { flex: 2, paddingVertical: SP.md, borderRadius: R.md, alignItems: 'center' },
  submitBtnText: { fontSize: FONT.sm, fontWeight: '800', color: C.accentContrast },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Phases = Record<Phase, EinheitUebung[]>;

export default function EinheitDetailScreen({ navigation, route }: Props) {
  const { planId, wocheId, einheitId } = route.params;
  const { getPlanById, saveEinheit } = usePlanStore();
  const { addUebung: saveUebToLib } = useUebungStore();
  const { uebungen: uebungLib } = useUebungStore();
  const { einheiten: einheitLib, addEinheit: saveEinheitToLib } = useEinheitStore();
  const insets = useSafeAreaInsets();

  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);
  const existing = einheitId ? woche?.einheiten.find((e) => e.id === einheitId) : undefined;

  const [name, setName]                 = useState(existing?.name ?? '');
  const [nameError, setNameError]       = useState('');
  const [phases, setPhases]             = useState<Phases>({
    warmup:       existing?.warmup       ?? [],
    haupteinheit: existing?.haupteinheit ?? [],
    cooldown:     existing?.cooldown     ?? [],
  });
  const [saveEinheitLib, setSaveEinheitLib] = useState(false);
  const [showEinheitLib, setShowEinheitLib] = useState(false);
  const [activePhase, setActivePhase]   = useState<Phase | null>(null);
  const [editingUebId, setEditingUebId] = useState<string | null>(null);

  const editingUeb = editingUebId && activePhase
    ? phases[activePhase].find((u) => u.id === editingUebId)
    : undefined;

  const openAdd = (phase: Phase) => {
    setActivePhase(phase);
    setEditingUebId(null);
  };

  const openEdit = (phase: Phase, uid: string) => {
    setActivePhase(phase);
    setEditingUebId(uid);
  };

  const closeForm = () => {
    setActivePhase(null);
    setEditingUebId(null);
  };

  const handleUebSubmit = (ueb: EinheitUebung, saveToLib: boolean) => {
    if (saveToLib) {
      saveUebToLib({ name: ueb.name, parameter: ueb.parameter });
    }
    setPhases((prev) => ({
      ...prev,
      [activePhase!]: editingUebId
        ? prev[activePhase!].map((u) => (u.id === editingUebId ? ueb : u))
        : [...prev[activePhase!], ueb],
    }));
    closeForm();
  };

  const deleteUeb = (phase: Phase, uid: string) => {
    if (editingUebId === uid) closeForm();
    setPhases((prev) => ({ ...prev, [phase]: prev[phase].filter((u) => u.id !== uid) }));
  };

  const pickEinheitLib = (tpl: EinheitTemplate) => {
    setName(tpl.name);
    const remap = (arr: EinheitUebung[]) =>
      arr.map((u) => ({ ...u, id: newUebId(), templateId: u.id }));
    setPhases({ warmup: remap(tpl.warmup), haupteinheit: remap(tpl.haupteinheit), cooldown: remap(tpl.cooldown) });
    setShowEinheitLib(false);
  };

  const handleSaveEinheit = () => {
    if (!name.trim()) { setNameError('Name ist erforderlich'); return; }
    const einheit: Einheit = {
      id: existing?.id ?? newEId(),
      name: name.trim(),
      warmup: phases.warmup,
      haupteinheit: phases.haupteinheit,
      cooldown: phases.cooldown,
    };
    if (saveEinheitLib) {
      const { id: _id, ...tpl } = einheit;
      saveEinheitToLib(tpl);
    }
    saveEinheit(planId, wocheId, einheit);
    navigation.goBack();
  };

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

          {/* Einheit name + library */}
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
                style={[styles.libBtn, showEinheitLib && styles.libBtnOn]}
                onPress={() => setShowEinheitLib((v) => !v)}
                activeOpacity={0.7}
              >
                <GBIcon name="layers" size={16} color={showEinheitLib ? C.accentContrast : C.textMuted} />
                <Text style={[styles.libBtnText, showEinheitLib && styles.libBtnTextOn]}>Einheit</Text>
              </TouchableOpacity>
            </View>
            {nameError ? <Text style={styles.errText}>{nameError}</Text> : null}

            {showEinheitLib && (
              <View style={styles.einheitLibList}>
                <Text style={styles.einheitLibTitle}>Aus Einheitenbibliothek</Text>
                {einheitLib.map((tpl) => (
                  <TouchableOpacity key={tpl.id} style={styles.einheitLibItem} onPress={() => pickEinheitLib(tpl)} activeOpacity={0.7}>
                    <View style={styles.einheitLibIcon}>
                      <GBIcon name="dumbbell" size={14} color={C.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.einheitLibName}>{tpl.name}</Text>
                      <Text style={styles.einheitLibSub}>
                        {tpl.warmup.length + tpl.haupteinheit.length + tpl.cooldown.length} Übungen
                      </Text>
                    </View>
                    <GBIcon name="chevronRight" size={14} color={C.textDim} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Stats + save-to-lib toggle */}
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>{totalEx} Übungen · 3 Phasen</Text>
            <TouchableOpacity style={styles.libToggle} onPress={() => setSaveEinheitLib((v) => !v)} activeOpacity={0.7}>
              <View style={[styles.check, saveEinheitLib && styles.checkOn]}>
                {saveEinheitLib && <GBIcon name="check" size={11} color={C.accentContrast} />}
              </View>
              <Text style={styles.libToggleLabel}>In Bibliothek</Text>
            </TouchableOpacity>
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

                {/* Exercise rows */}
                {exercises.map((u) => (
                  <View key={u.id} style={[styles.uebRow, editingUebId === u.id && styles.uebRowActive]}>
                    <View style={[styles.uebDot, { backgroundColor: cfg.color }]} />
                    <View style={styles.uebInfo}>
                      <Text style={styles.uebName}>{u.name}</Text>
                      {u.parameter.length > 0 && (
                        <Text style={styles.uebParams}>{buildSuffix(u.parameter)}</Text>
                      )}
                    </View>
                    <View style={styles.uebActions}>
                      <TouchableOpacity onPress={() => openEdit(phase, u.id)} style={styles.miniBtn} activeOpacity={0.7}>
                        <GBIcon name="edit" size={13} color={C.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteUeb(phase, u.id)} style={styles.miniBtnDanger} activeOpacity={0.7}>
                        <GBIcon name="trash" size={13} color={C.warn} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

                {/* Add button (shown when this phase is not active) */}
                {!isActive && (
                  <TouchableOpacity
                    style={[styles.addUebBtn, { borderColor: `${cfg.color}55` }]}
                    onPress={() => openAdd(phase)}
                    activeOpacity={0.8}
                  >
                    <GBIcon name="plus" size={14} color={cfg.color} />
                    <Text style={[styles.addUebText, { color: cfg.color }]}>Übung hinzufügen</Text>
                  </TouchableOpacity>
                )}

                {/* Inline form */}
                {isActive && (
                  <UebungForm
                    key={`${phase}-${editingUebId ?? 'new'}`}
                    phase={phase}
                    phaseColor={cfg.color}
                    initialUebung={editingUeb}
                    uebungLib={uebungLib}
                    onSubmit={handleUebSubmit}
                    onCancel={closeForm}
                  />
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
  inputError:  { borderColor: C.warn },
  errText:     { fontSize: FONT.xs, color: C.warn },
  libBtn:      { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.sm + 2, paddingVertical: SP.md },
  libBtnOn:    { backgroundColor: C.accent, borderColor: C.accent },
  libBtnText:  { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted },
  libBtnTextOn: { color: C.accentContrast },

  einheitLibList:  { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  einheitLibTitle: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  einheitLibItem:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, borderBottomWidth: 1, borderBottomColor: C.border },
  einheitLibIcon:  { width: 32, height: 32, borderRadius: R.md, backgroundColor: C.accentLight, alignItems: 'center', justifyContent: 'center' },
  einheitLibName:  { fontSize: FONT.base, fontWeight: '600', color: C.text },
  einheitLibSub:   { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },

  statsRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsText:      { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },
  libToggle:      { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  libToggleLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600' },
  check:          { width: 20, height: 20, borderRadius: 6, borderWidth: 1.5, borderColor: C.border, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  checkOn:        { borderColor: C.accent, backgroundColor: C.accent },

  phaseSection: { gap: SP.sm },
  phaseHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 3, paddingLeft: SP.sm },
  phaseTitle:   { fontSize: FONT.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  phaseCount:   { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },

  uebRow:       { flexDirection: 'row', alignItems: 'center', gap: SP.md, backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.md },
  uebRowActive: { borderColor: C.accent },
  uebDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  uebInfo:      { flex: 1 },
  uebName:      { fontSize: FONT.base, fontWeight: '600', color: C.text },
  uebParams:    { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 16 },
  uebActions:   { flexDirection: 'row', gap: 4 },
  miniBtn:      { width: 28, height: 28, borderRadius: 14, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  miniBtnDanger: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,106,61,0.10)', alignItems: 'center', justifyContent: 'center' },

  addUebBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.md, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed' },
  addUebText: { fontSize: FONT.sm, fontWeight: '700' },
});
