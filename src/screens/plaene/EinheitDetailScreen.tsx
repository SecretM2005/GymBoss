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
  UebungTemplate, Einheit, UebungParam, UebungParamTyp, KreisUebung,
} from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useUebungStore } from '../../store/uebungStore';
import { useEinheitStore } from '../../store/einheitStore';
import { GBIcon } from '../../components/GBIcon';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'EinheitDetail'>;
  route: RouteProp<PlaeneStackParamList, 'EinheitDetail'>;
};

// ─── Constants ────────────────────────────────────────────────────────────────

export const PHASE_CFG: Record<Phase, { label: string; color: string }> = {
  warmup:       { label: 'Warm-up',      color: '#FF8A66' },
  haupteinheit: { label: 'Haupteinheit', color: '#CBFF3E' },
  cooldown:     { label: 'Cool-down',    color: '#7ABFFF' },
};
export const PHASES: Phase[] = ['warmup', 'haupteinheit', 'cooldown'];

type ParamCfg = {
  label: string; icon: string; placeholder: string;
  defaultUnit: string; units: string[]; hasBez: boolean;
};

export const PARAM_CFG: Record<UebungParamTyp, ParamCfg> = {
  serien:         { label: 'Serien',         icon: 'layers',    placeholder: 'z.B. 3',    defaultUnit: '',    units: [],               hasBez: false },
  wiederholungen: { label: 'Wiederholungen', icon: 'repeat',    placeholder: 'z.B. 6-8',  defaultUnit: '',    units: [],               hasBez: false },
  gewicht:        { label: 'Gewicht',        icon: 'dumbbell',  placeholder: 'z.B. 80',   defaultUnit: 'kg',  units: ['kg', 'lbs'],    hasBez: false },
  distanz:        { label: 'Distanz',        icon: 'flag',      placeholder: 'z.B. 400',  defaultUnit: 'm',   units: ['m', 'km', 'mi'],hasBez: false },
  dauer:          { label: 'Dauer',          icon: 'timer',     placeholder: 'z.B. 63',   defaultUnit: 's',   units: ['s', 'min', 'h'],hasBez: false },
  pause:          { label: 'Pause',          icon: 'clock',     placeholder: 'z.B. 30',   defaultUnit: 's',   units: ['s', 'min'],     hasBez: true  },
  serienpause:    { label: 'Serienpause',    icon: 'stopwatch', placeholder: 'z.B. 120',  defaultUnit: 's',   units: ['s', 'min'],     hasBez: false },
};

export const ALL_TYPES: UebungParamTyp[] = ['serien', 'wiederholungen', 'gewicht', 'distanz', 'dauer', 'pause', 'serienpause'];

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

export function buildKreisSuffix(ueb: EinheitUebung): string {
  if (!ueb.kreisUebungen?.length) return '';
  const serien = ueb.parameter.find(p => p.typ === 'serien');
  const pause  = ueb.parameter.find(p => p.typ === 'pause');
  const sp     = ueb.parameter.find(p => p.typ === 'serienpause');

  const parts: string[] = [];
  if (serien) parts.push(`${serien.wert}×`);
  parts.push(ueb.kreisUebungen.map(ku => `${ku.wert} ${ku.einheit} ${ku.name}`).join(' → '));
  if (pause) parts.push(`${pause.wert}${pause.einheit ?? 's'} Pause`);
  if (sp)    parts.push(`${sp.wert}${sp.einheit ?? 'min'} Serienpause`);
  return parts.join(' · ');
}

export function buildIntervallSuffix(ueb: EinheitUebung): string {
  if (!ueb.kreisUebungen?.length) return '';
  const serien = ueb.parameter.find(p => p.typ === 'serien');
  const sp     = ueb.parameter.find(p => p.typ === 'serienpause');

  const steps = ueb.kreisUebungen.map(ku => {
    let s = `${ku.wert}${ku.einheit}`;
    if (ku.zielzeit) s += ` in ${ku.zielzeit}${ku.zeiteinheit ?? 's'}`;
    if (ku.pause)    s += ` → ${ku.pause}${ku.pauseeinheit ?? 's'} P.`;
    return s;
  });

  const parts: string[] = [];
  if (serien) parts.push(`${serien.wert}×`);
  parts.push(steps.join(', '));
  if (sp) parts.push(`${sp.wert}${sp.einheit ?? 'min'} Serienpause`);
  return parts.join(' · ');
}

export function buildUebSuffix(ueb: EinheitUebung): string {
  if (ueb.typ === 'kreis')     return buildKreisSuffix(ueb);
  if (ueb.typ === 'intervall') return buildIntervallSuffix(ueb);
  return buildSuffix(ueb.parameter);
}

export function buildPreview(name: string, params: UebungParam[]): string {
  if (!name.trim()) return '';
  const suffix = buildSuffix(params);
  return suffix ? `${name.trim()} (${suffix})` : name.trim();
}

export function formatParamChip(p: UebungParam): string {
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
export const newUebId = () => `eu_${++_euId}`;
let _kuId = 3000;
const newKuId = () => `ku_${++_kuId}`;
let _eId = 2000;
const newEId = () => `e_${++_eId}`;

// ─── ParamChip ────────────────────────────────────────────────────────────────

export function ParamChip({ param, onEdit, onDelete }: {
  param: UebungParam;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const C = useColors();
  return (
    <View style={[chip.wrap, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
      <TouchableOpacity onPress={onEdit} style={chip.inner} activeOpacity={0.7}>
        <Text style={[chip.type, { color: C.textDim }]}>{PARAM_CFG[param.typ].label}</Text>
        <Text style={[chip.value, { color: C.text }]}>{formatParamChip(param)}</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={[chip.del, { borderLeftColor: C.border }]} activeOpacity={0.7}>
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

// ─── Inline single-exercise form ──────────────────────────────────────────────

type AddMode = null | 'picking' | UebungParamTyp;

export function UebungForm({ phase, phaseColor, initialUebung, uebungLib, onSubmit, onCancel }: {
  phase: Phase;
  phaseColor: string;
  initialUebung?: EinheitUebung;
  uebungLib: UebungTemplate[];
  onSubmit: (u: EinheitUebung, saveToLib: boolean) => void;
  onCancel: () => void;
}) {
  const C = useColors();
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
    <View style={[form.wrap, { borderColor: `${phaseColor}55`, backgroundColor: C.surface }]}>
      <Text style={[form.title, { color: phaseColor }]}>
        {PHASE_CFG[phase].label} · {initialUebung ? 'Übung bearbeiten' : 'Neue Übung'}
      </Text>

      <View style={form.nameRow}>
        <TextInput
          style={[form.nameInput, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }, nameErr ? form.inputErr : null]}
          value={name}
          onChangeText={(v) => { setName(v); setNameErr(''); }}
          placeholder="Übungsname…"
          placeholderTextColor={C.textDim}
          autoCapitalize="words"
          autoFocus={!initialUebung}
        />
        <TouchableOpacity
          style={[form.libBtn, { backgroundColor: C.surfaceAlt, borderColor: C.border }, showLib && form.libBtnOn]}
          onPress={() => setShowLib((v) => !v)}
          activeOpacity={0.7}
        >
          <GBIcon name="search" size={15} color={showLib ? C.accentContrast : C.textMuted} />
        </TouchableOpacity>
      </View>
      {nameErr ? <Text style={form.errText}>{nameErr}</Text> : null}

      {showLib && (
        <View style={[form.libList, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
          {uebungLib.length === 0
            ? <Text style={[form.libEmpty, { color: C.textDim }]}>Keine gespeicherten Übungen</Text>
            : uebungLib.map((tpl) => (
              <TouchableOpacity key={tpl.id} style={[form.libItem, { borderBottomColor: C.border }]} onPress={() => pickLib(tpl)} activeOpacity={0.7}>
                <Text style={[form.libItemName, { color: C.text }]}>{tpl.name}</Text>
                {tpl.parameter.length > 0 && (
                  <Text style={[form.libItemParams, { color: C.textMuted }]}>{buildSuffix(tpl.parameter)}</Text>
                )}
              </TouchableOpacity>
            ))
          }
        </View>
      )}

      {params.length > 0 && (
        <View style={form.chips}>
          {params.map((p) => (
            <ParamChip key={p.typ} param={p} onEdit={() => selectType(p.typ)} onDelete={() => removeParam(p.typ)} />
          ))}
        </View>
      )}

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
        <View style={[form.picker, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
          <Text style={[form.pickerTitle, { color: C.textMuted }]}>Element wählen</Text>
          <View style={form.pickerGrid}>
            {ALL_TYPES.map((typ) => {
              const c = PARAM_CFG[typ];
              const added = params.some((p) => p.typ === typ);
              return (
                <TouchableOpacity
                  key={typ}
                  style={[form.pickerBtn, { backgroundColor: C.surface, borderColor: C.border }, added && form.pickerBtnAdded]}
                  onPress={() => selectType(typ)}
                  activeOpacity={0.75}
                >
                  <GBIcon name={c.icon as any} size={18} color={added ? C.accent : C.text} />
                  <Text style={[form.pickerLabel, { color: C.textSub }, added && form.pickerLabelAdded]}>{c.label}</Text>
                  {added && <View style={form.pickerCheck}><GBIcon name="check" size={9} color={C.accentContrast} /></View>}
                </TouchableOpacity>
              );
            })}
          </View>
          <TouchableOpacity onPress={() => setAddMode(null)} style={form.cancelPickBtn}>
            <Text style={[form.cancelPickText, { color: C.textDim }]}>Abbrechen</Text>
          </TouchableOpacity>
        </View>
      )}

      {cfg && addMode !== 'picking' && (
        <View style={[form.paramInput, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
          <Text style={[form.paramInputTitle, { color: C.textMuted }]}>{cfg.label}</Text>
          <View style={form.paramInputRow}>
            <TextInput
              style={[form.paramInputField, { flex: 1, backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
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
                    style={[form.unitBtn, { borderColor: C.border, backgroundColor: C.surface }, newUnit === u && form.unitBtnOn]}
                    onPress={() => setNewUnit(u)}
                    activeOpacity={0.7}
                  >
                    <Text style={[form.unitText, { color: C.textSub }, newUnit === u && form.unitTextOn]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          {cfg.hasBez && (
            <TextInput
              style={[form.paramInputField, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              value={newBez}
              onChangeText={setNewBez}
              placeholder='Bezeichnung (z.B. "Trabpause")'
              placeholderTextColor={C.textDim}
              autoCapitalize="words"
            />
          )}
          <View style={form.paramBtns}>
            <TouchableOpacity style={[form.backBtn, { backgroundColor: C.surface }]} onPress={() => setAddMode('picking')}>
              <Text style={[form.backBtnText, { color: C.textMuted }]}>← Zurück</Text>
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

      {preview.length > 0 && (
        <View style={form.preview}>
          <Text style={form.previewLabel}>Vorschau</Text>
          <Text style={form.previewText}>{preview}</Text>
        </View>
      )}

      <TouchableOpacity style={form.libToggle} onPress={() => setSaveToLib((v) => !v)} activeOpacity={0.7}>
        <View style={[form.check, { borderColor: C.border, backgroundColor: C.surfaceAlt }, saveToLib && form.checkOn]}>
          {saveToLib && <GBIcon name="check" size={11} color={C.accentContrast} />}
        </View>
        <Text style={[form.libToggleLabel, { color: C.textMuted }]}>In Übungsbibliothek speichern</Text>
      </TouchableOpacity>

      <View style={form.btns}>
        <TouchableOpacity style={[form.cancelBtn, { backgroundColor: C.surfaceAlt }]} onPress={onCancel} activeOpacity={0.7}>
          <Text style={[form.cancelBtnText, { color: C.textMuted }]}>Abbrechen</Text>
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

// ─── Kreis Form ───────────────────────────────────────────────────────────────

const KREIS_EINHEITEN = ['Wdh', 's', 'min', 'm', 'km'] as const;

function KreisForm({ phase, phaseColor, initialKreis, onSubmit, onCancel }: {
  phase: Phase;
  phaseColor: string;
  initialKreis?: EinheitUebung;
  onSubmit: (u: EinheitUebung) => void;
  onCancel: () => void;
}) {
  const C = useColors();
  const ip = (t: UebungParamTyp) => initialKreis?.parameter.find(p => p.typ === t);

  const [name, setName]             = useState(initialKreis?.name ?? 'Kraftkreis');
  const [exercises, setExercises]   = useState<KreisUebung[]>(initialKreis?.kreisUebungen ?? []);
  const [serien, setSerien]         = useState(ip('serien')?.wert ?? '');
  const [pause, setPause]           = useState(ip('pause')?.wert ?? '');
  const [pauseUnit, setPauseUnit]   = useState(ip('pause')?.einheit ?? 's');
  const [sp, setSp]                 = useState(ip('serienpause')?.wert ?? '');
  const [spUnit, setSpUnit]         = useState(ip('serienpause')?.einheit ?? 'min');

  // Inline exercise editor state
  const [editId, setEditId]   = useState<string | null>(null); // 'new' or an exercise id
  const [exName, setExName]   = useState('');
  const [exWert, setExWert]   = useState('');
  const [exEin, setExEin]     = useState<string>('Wdh');

  const startAdd = () => { setEditId('new'); setExName(''); setExWert(''); setExEin('Wdh'); };
  const startEdit = (ku: KreisUebung) => { setEditId(ku.id); setExName(ku.name); setExWert(ku.wert); setExEin(ku.einheit); };
  const cancelEdit = () => setEditId(null);

  const confirmEx = () => {
    if (!exName.trim() || !exWert.trim()) return;
    const ku: KreisUebung = { id: editId === 'new' ? newKuId() : editId!, name: exName.trim(), wert: exWert.trim(), einheit: exEin };
    setExercises(prev => editId === 'new' ? [...prev, ku] : prev.map(x => x.id === ku.id ? ku : x));
    setEditId(null);
  };

  const deleteEx = (id: string) => {
    setExercises(prev => prev.filter(x => x.id !== id));
    if (editId === id) setEditId(null);
  };

  const handleSubmit = () => {
    if (exercises.length === 0) return;
    const params: UebungParam[] = [];
    if (serien.trim()) params.push({ typ: 'serien', wert: serien.trim() });
    if (pause.trim())  params.push({ typ: 'pause', wert: pause.trim(), einheit: pauseUnit });
    if (sp.trim())     params.push({ typ: 'serienpause', wert: sp.trim(), einheit: spUnit });
    onSubmit({
      id: initialKreis?.id ?? newUebId(),
      name: name.trim() || 'Kraftkreis',
      typ: 'kreis',
      parameter: params,
      kreisUebungen: exercises,
    });
  };

  const exStr = exercises.map(ku => `${ku.wert} ${ku.einheit} ${ku.name}`).join(' → ');
  const prevParts = [serien ? `${serien}×` : '', exStr, pause ? `${pause}${pauseUnit} Pause` : '', sp ? `${sp}${spUnit} Serienpause` : ''].filter(Boolean);

  return (
    <View style={[form.wrap, { borderColor: `${phaseColor}55`, backgroundColor: C.surface }]}>
      <Text style={[form.title, { color: phaseColor }]}>
        {PHASE_CFG[phase].label} · {initialKreis ? 'Kreis bearbeiten' : 'Neuer Kraftkreis'}
      </Text>

      {/* Circuit name */}
      <TextInput
        style={[form.nameInputFull, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
        value={name}
        onChangeText={setName}
        placeholder="Kreisname…"
        placeholderTextColor={C.textDim}
        autoCapitalize="words"
      />

      {/* Exercise list */}
      <View style={[kf.section, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
        <Text style={[kf.sectionLabel, { color: C.textMuted }]}>Übungen im Kreis</Text>

        {exercises.map((ku, i) => (
          <View key={ku.id} style={[kf.exRow, editId === ku.id && kf.exRowDim]}>
            <View style={[kf.exNum, { backgroundColor: C.surface }]}><Text style={[kf.exNumText, { color: C.textMuted }]}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={[kf.exName, { color: C.text }]}>{ku.name}</Text>
              <Text style={kf.exVal}>{ku.wert} {ku.einheit}</Text>
            </View>
            {editId !== ku.id && (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity onPress={() => startEdit(ku)} style={[styles.miniBtn, { backgroundColor: C.surfaceAlt }]} activeOpacity={0.7}>
                  <GBIcon name="edit" size={13} color={C.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteEx(ku.id)} style={styles.miniBtnDanger} activeOpacity={0.7}>
                  <GBIcon name="trash" size={13} color={C.warn} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {editId !== null ? (
          <View style={[kf.editor, { backgroundColor: C.surface, borderColor: C.border }]}>
            <TextInput
              style={[form.nameInputFull, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              value={exName}
              onChangeText={setExName}
              placeholder="Übungsname…"
              placeholderTextColor={C.textDim}
              autoCapitalize="words"
              autoFocus
            />
            <View style={{ flexDirection: 'row', gap: SP.sm, alignItems: 'center', flexWrap: 'wrap' }}>
              <TextInput
                style={[form.paramInputField, { flex: 1, minWidth: 80, backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                value={exWert}
                onChangeText={setExWert}
                placeholder="Anzahl / Dauer"
                placeholderTextColor={C.textDim}
                keyboardType="decimal-pad"
              />
              <View style={form.unitRow}>
                {KREIS_EINHEITEN.map(u => (
                  <TouchableOpacity key={u} style={[form.unitBtn, { borderColor: C.border, backgroundColor: C.surface }, exEin === u && form.unitBtnOn]} onPress={() => setExEin(u)} activeOpacity={0.7}>
                    <Text style={[form.unitText, { color: C.textSub }, exEin === u && form.unitTextOn]}>{u}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View style={form.paramBtns}>
              <TouchableOpacity style={[form.backBtn, { backgroundColor: C.surface }]} onPress={cancelEdit} activeOpacity={0.7}>
                <Text style={[form.backBtnText, { color: C.textMuted }]}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[form.confirmBtn, { backgroundColor: exName.trim() && exWert.trim() ? phaseColor : C.surfaceAlt }]}
                onPress={confirmEx}
                activeOpacity={0.8}
              >
                <Text style={[form.confirmBtnText, { color: exName.trim() && exWert.trim() ? C.accentContrast : C.textDim }]}>
                  {editId === 'new' ? 'Hinzufügen' : 'Übernehmen'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[form.addParamBtn, { borderColor: `${phaseColor}66` }]} onPress={startAdd} activeOpacity={0.8}>
            <GBIcon name="plus" size={14} color={phaseColor} />
            <Text style={[form.addParamText, { color: phaseColor }]}>Übung zum Kreis</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Circuit-level parameters */}
      <View style={[kf.section, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
        <Text style={[kf.sectionLabel, { color: C.textMuted }]}>Kreis-Parameter</Text>

        <View style={kf.paramRow}>
          <Text style={[kf.paramLabel, { color: C.textSub }]}>Serien</Text>
          <TextInput
            style={[form.paramInputField, kf.paramInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
            value={serien}
            onChangeText={setSerien}
            placeholder="z.B. 4"
            placeholderTextColor={C.textDim}
            keyboardType="number-pad"
          />
        </View>

        <View style={kf.paramRow}>
          <Text style={[kf.paramLabel, { color: C.textSub }]}>Pause (zw. Übungen)</Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <TextInput
              style={[form.paramInputField, kf.paramInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              value={pause}
              onChangeText={setPause}
              placeholder="z.B. 45"
              placeholderTextColor={C.textDim}
              keyboardType="decimal-pad"
            />
            {(['s', 'min'] as const).map(u => (
              <TouchableOpacity key={u} style={[form.unitBtn, { borderColor: C.border, backgroundColor: C.surface }, pauseUnit === u && form.unitBtnOn]} onPress={() => setPauseUnit(u)} activeOpacity={0.7}>
                <Text style={[form.unitText, { color: C.textSub }, pauseUnit === u && form.unitTextOn]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={kf.paramRow}>
          <Text style={[kf.paramLabel, { color: C.textSub }]}>Serienpause</Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <TextInput
              style={[form.paramInputField, kf.paramInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              value={sp}
              onChangeText={setSp}
              placeholder="z.B. 3"
              placeholderTextColor={C.textDim}
              keyboardType="decimal-pad"
            />
            {(['s', 'min'] as const).map(u => (
              <TouchableOpacity key={u} style={[form.unitBtn, { borderColor: C.border, backgroundColor: C.surface }, spUnit === u && form.unitBtnOn]} onPress={() => setSpUnit(u)} activeOpacity={0.7}>
                <Text style={[form.unitText, { color: C.textSub }, spUnit === u && form.unitTextOn]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {/* Preview */}
      {exercises.length > 0 && prevParts.length > 0 && (
        <View style={form.preview}>
          <Text style={form.previewLabel}>Vorschau</Text>
          <Text style={[form.previewText, { color: C.text }]}>{name.trim() || 'Kraftkreis'} ({prevParts.join(' · ')})</Text>
        </View>
      )}

      {exercises.length === 0 && (
        <View style={kf.emptyHint}>
          <Text style={[kf.emptyHintText, { color: C.textDim }]}>Mindestens eine Übung hinzufügen</Text>
        </View>
      )}

      <View style={form.btns}>
        <TouchableOpacity style={[form.cancelBtn, { backgroundColor: C.surfaceAlt }]} onPress={onCancel} activeOpacity={0.7}>
          <Text style={[form.cancelBtnText, { color: C.textMuted }]}>Abbrechen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[form.submitBtn, { backgroundColor: exercises.length > 0 ? phaseColor : C.surfaceAlt }]}
          onPress={handleSubmit}
          disabled={exercises.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[form.submitBtnText, { color: exercises.length > 0 ? C.accentContrast : C.textDim }]}>
            {initialKreis ? 'Aktualisieren' : 'Kreis anlegen'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Kreis Card (display) ─────────────────────────────────────────────────────

function KreisCard({ ueb, phaseColor, isEditing, onEdit, onDelete }: {
  ueb: EinheitUebung;
  phaseColor: string;
  isEditing?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const C = useColors();
  const serien = ueb.parameter.find(p => p.typ === 'serien');
  const pause  = ueb.parameter.find(p => p.typ === 'pause');
  const sp     = ueb.parameter.find(p => p.typ === 'serienpause');

  return (
    <View style={[kc.wrap, { backgroundColor: C.surface, borderColor: C.border }, isEditing && kc.wrapEditing, isEditing && { borderColor: C.accent }]}>
      <View style={kc.header}>
        <View style={[kc.icon, { backgroundColor: `${phaseColor}22` }]}>
          <GBIcon name="repeat" size={14} color={phaseColor} />
        </View>
        <Text style={[kc.name, { color: C.text }]}>{ueb.name}</Text>
        {serien && (
          <View style={[kc.badge, { backgroundColor: `${phaseColor}22` }]}>
            <Text style={[kc.badgeText, { color: phaseColor }]}>{serien.wert}×</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onEdit} style={[styles.miniBtn, { backgroundColor: C.surfaceAlt }]} activeOpacity={0.7}>
          <GBIcon name="edit" size={13} color={C.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.miniBtnDanger} activeOpacity={0.7}>
          <GBIcon name="trash" size={13} color={C.warn} />
        </TouchableOpacity>
      </View>

      {ueb.kreisUebungen?.map((ku, i) => (
        <View key={ku.id} style={[kc.exRow, { borderTopColor: C.border }]}>
          <Text style={[kc.exIdx, { color: C.textDim }]}>{i + 1}.</Text>
          <Text style={[kc.exName, { color: C.text }]}>{ku.name}</Text>
          <Text style={kc.exVal}>{ku.wert} {ku.einheit}</Text>
        </View>
      ))}

      {(pause || sp) && (
        <View style={[kc.footer, { borderTopColor: C.border, backgroundColor: C.surfaceAlt }]}>
          {pause && (
            <View style={kc.footerChip}>
              <GBIcon name="clock" size={10} color={C.textDim} />
              <Text style={[kc.footerText, { color: C.textDim }]}>{pause.wert}{pause.einheit ?? 's'} Pause</Text>
            </View>
          )}
          {sp && (
            <View style={kc.footerChip}>
              <GBIcon name="stopwatch" size={10} color={C.textDim} />
              <Text style={[kc.footerText, { color: C.textDim }]}>{sp.wert}{sp.einheit ?? 'min'} Serienpause</Text>
            </View>
          )}
        </View>
      )}
    </View>
  );
}

// ─── Intervall Form ───────────────────────────────────────────────────────────

const INTERVAL_EINHEITEN = ['m', 'km', 's', 'min'] as const;
const TIME_EINHEITEN     = ['s', 'min'] as const;

function IntervallForm({ phase, phaseColor, initialIntervall, onSubmit, onCancel }: {
  phase: Phase;
  phaseColor: string;
  initialIntervall?: EinheitUebung;
  onSubmit: (u: EinheitUebung) => void;
  onCancel: () => void;
}) {
  const C = useColors();
  const ip = (t: UebungParamTyp) => initialIntervall?.parameter.find(p => p.typ === t);

  const [name, setName]       = useState(initialIntervall?.name ?? 'Intervall');
  const [steps, setSteps]     = useState<KreisUebung[]>(initialIntervall?.kreisUebungen ?? []);
  const [serien, setSerien]   = useState(ip('serien')?.wert ?? '');
  const [sp, setSp]           = useState(ip('serienpause')?.wert ?? '');
  const [spUnit, setSpUnit]   = useState(ip('serienpause')?.einheit ?? 'min');

  const [editId, setEditId]       = useState<string | null>(null);
  const [stName, setStName]       = useState('');
  const [stWert, setStWert]       = useState('');
  const [stEin, setStEin]         = useState<string>('m');
  const [stZiel, setStZiel]       = useState('');
  const [stZielEin, setStZielEin] = useState<string>('s');
  const [stPause, setStPause]     = useState('');
  const [stPauseEin, setStPauseEin] = useState<string>('s');

  const startAdd = () => {
    setEditId('new');
    setStName(''); setStWert(''); setStEin('m');
    setStZiel(''); setStZielEin('s');
    setStPause(''); setStPauseEin('s');
  };

  const startEdit = (ku: KreisUebung) => {
    setEditId(ku.id);
    setStName(ku.name);
    setStWert(ku.wert);
    setStEin(ku.einheit);
    setStZiel(ku.zielzeit ?? '');
    setStZielEin(ku.zeiteinheit ?? 's');
    setStPause(ku.pause ?? '');
    setStPauseEin(ku.pauseeinheit ?? 's');
  };

  const cancelEdit = () => setEditId(null);

  const confirmStep = () => {
    if (!stWert.trim()) return;
    const ku: KreisUebung = {
      id: editId === 'new' ? newKuId() : editId!,
      name: stName.trim(),
      wert: stWert.trim(),
      einheit: stEin,
      zielzeit: stZiel.trim() || undefined,
      zeiteinheit: stZiel.trim() ? stZielEin : undefined,
      pause: stPause.trim() || undefined,
      pauseeinheit: stPause.trim() ? stPauseEin : undefined,
    };
    setSteps(prev => editId === 'new' ? [...prev, ku] : prev.map(x => x.id === ku.id ? ku : x));
    setEditId(null);
  };

  const deleteStep = (id: string) => {
    setSteps(prev => prev.filter(x => x.id !== id));
    if (editId === id) setEditId(null);
  };

  const handleSubmit = () => {
    if (steps.length === 0) return;
    const params: UebungParam[] = [];
    if (serien.trim()) params.push({ typ: 'serien', wert: serien.trim() });
    if (sp.trim())     params.push({ typ: 'serienpause', wert: sp.trim(), einheit: spUnit });
    onSubmit({
      id: initialIntervall?.id ?? newUebId(),
      name: name.trim() || 'Intervall',
      typ: 'intervall',
      parameter: params,
      kreisUebungen: steps,
    });
  };

  const stepStr = steps.map(ku => {
    let s = `${ku.wert}${ku.einheit}`;
    if (ku.zielzeit) s += ` in ${ku.zielzeit}${ku.zeiteinheit ?? 's'}`;
    if (ku.pause)    s += ` → ${ku.pause}${ku.pauseeinheit ?? 's'}`;
    return s;
  }).join(', ');
  const prevParts = [serien ? `${serien}×` : '', stepStr, sp ? `${sp}${spUnit} Serienpause` : ''].filter(Boolean);

  return (
    <View style={[form.wrap, { borderColor: `${phaseColor}55`, backgroundColor: C.surface }]}>
      <Text style={[form.title, { color: phaseColor }]}>
        {PHASE_CFG[phase].label} · {initialIntervall ? 'Intervall bearbeiten' : 'Neues Intervalltraining'}
      </Text>

      <TextInput
        style={[form.nameInputFull, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
        value={name}
        onChangeText={setName}
        placeholder="Name (z.B. Intervall-Lauf)…"
        placeholderTextColor={C.textDim}
        autoCapitalize="words"
      />

      {/* Steps list */}
      <View style={[kf.section, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
        <Text style={[kf.sectionLabel, { color: C.textMuted }]}>Intervall-Schritte</Text>

        {steps.map((ku, i) => (
          <View key={ku.id} style={[ki.stepRow, editId === ku.id && kf.exRowDim]}>
            <View style={[kf.exNum, { backgroundColor: C.surface }]}><Text style={[kf.exNumText, { color: C.textMuted }]}>{i + 1}</Text></View>
            <View style={{ flex: 1 }}>
              <View style={ki.stepInline}>
                <Text style={[ki.stepWert, { color: C.text }]}>{ku.wert} {ku.einheit}</Text>
                {ku.zielzeit ? <Text style={[ki.stepZiel, { color: C.accent }]}>in {ku.zielzeit}{ku.zeiteinheit ?? 's'}</Text> : null}
                {ku.pause    ? <Text style={[ki.stepPause, { color: C.textDim }]}>→ {ku.pause}{ku.pauseeinheit ?? 's'} P.</Text> : null}
              </View>
              {ku.name ? <Text style={[ki.stepLabel, { color: C.textMuted }]}>{ku.name}</Text> : null}
            </View>
            {editId !== ku.id && (
              <View style={{ flexDirection: 'row', gap: 4 }}>
                <TouchableOpacity onPress={() => startEdit(ku)} style={[styles.miniBtn, { backgroundColor: C.surfaceAlt }]} activeOpacity={0.7}>
                  <GBIcon name="edit" size={13} color={C.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => deleteStep(ku.id)} style={styles.miniBtnDanger} activeOpacity={0.7}>
                  <GBIcon name="trash" size={13} color={C.warn} />
                </TouchableOpacity>
              </View>
            )}
          </View>
        ))}

        {editId !== null ? (
          <View style={[kf.editor, { backgroundColor: C.surface, borderColor: C.border }]}>
            <TextInput
              style={[form.nameInputFull, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
              value={stName}
              onChangeText={setStName}
              placeholder="Bezeichnung optional (z.B. Sprint)"
              placeholderTextColor={C.textDim}
              autoCapitalize="words"
              autoFocus
            />

            <View style={ki.inputGroup}>
              <Text style={[ki.inputLabel, { color: C.textMuted }]}>Distanz / Dauer *</Text>
              <View style={{ flexDirection: 'row', gap: SP.sm, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextInput
                  style={[form.paramInputField, { flex: 1, minWidth: 80, backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  value={stWert}
                  onChangeText={setStWert}
                  placeholder="z.B. 400"
                  placeholderTextColor={C.textDim}
                  keyboardType="decimal-pad"
                />
                <View style={form.unitRow}>
                  {INTERVAL_EINHEITEN.map(u => (
                    <TouchableOpacity key={u} style={[form.unitBtn, { borderColor: C.border, backgroundColor: C.surface }, stEin === u && form.unitBtnOn]} onPress={() => setStEin(u)} activeOpacity={0.7}>
                      <Text style={[form.unitText, { color: C.textSub }, stEin === u && form.unitTextOn]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={ki.inputGroup}>
              <Text style={[ki.inputLabel, { color: C.textMuted }]}>Zielzeit (optional)</Text>
              <View style={{ flexDirection: 'row', gap: SP.sm, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextInput
                  style={[form.paramInputField, { flex: 1, minWidth: 80, backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  value={stZiel}
                  onChangeText={setStZiel}
                  placeholder="z.B. 70"
                  placeholderTextColor={C.textDim}
                  keyboardType="decimal-pad"
                />
                <View style={form.unitRow}>
                  {TIME_EINHEITEN.map(u => (
                    <TouchableOpacity key={u} style={[form.unitBtn, { borderColor: C.border, backgroundColor: C.surface }, stZielEin === u && form.unitBtnOn]} onPress={() => setStZielEin(u)} activeOpacity={0.7}>
                      <Text style={[form.unitText, { color: C.textSub }, stZielEin === u && form.unitTextOn]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={ki.inputGroup}>
              <Text style={[ki.inputLabel, { color: C.textMuted }]}>Pause danach (optional)</Text>
              <View style={{ flexDirection: 'row', gap: SP.sm, alignItems: 'center', flexWrap: 'wrap' }}>
                <TextInput
                  style={[form.paramInputField, { flex: 1, minWidth: 80, backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
                  value={stPause}
                  onChangeText={setStPause}
                  placeholder="z.B. 90"
                  placeholderTextColor={C.textDim}
                  keyboardType="decimal-pad"
                />
                <View style={form.unitRow}>
                  {TIME_EINHEITEN.map(u => (
                    <TouchableOpacity key={u} style={[form.unitBtn, { borderColor: C.border, backgroundColor: C.surface }, stPauseEin === u && form.unitBtnOn]} onPress={() => setStPauseEin(u)} activeOpacity={0.7}>
                      <Text style={[form.unitText, { color: C.textSub }, stPauseEin === u && form.unitTextOn]}>{u}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={form.paramBtns}>
              <TouchableOpacity style={[form.backBtn, { backgroundColor: C.surface }]} onPress={cancelEdit} activeOpacity={0.7}>
                <Text style={[form.backBtnText, { color: C.textMuted }]}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[form.confirmBtn, { backgroundColor: stWert.trim() ? phaseColor : C.surfaceAlt }]}
                onPress={confirmStep}
                activeOpacity={0.8}
              >
                <Text style={[form.confirmBtnText, { color: stWert.trim() ? C.accentContrast : C.textDim }]}>
                  {editId === 'new' ? 'Hinzufügen' : 'Übernehmen'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <TouchableOpacity style={[form.addParamBtn, { borderColor: `${phaseColor}66` }]} onPress={startAdd} activeOpacity={0.8}>
            <GBIcon name="plus" size={14} color={phaseColor} />
            <Text style={[form.addParamText, { color: phaseColor }]}>Schritt hinzufügen</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Serien + Serienpause */}
      <View style={[kf.section, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}>
        <Text style={[kf.sectionLabel, { color: C.textMuted }]}>Gesamt-Parameter</Text>
        <View style={kf.paramRow}>
          <Text style={[kf.paramLabel, { color: C.textSub }]}>Serien (Wiederholungen)</Text>
          <TextInput
            style={[form.paramInputField, kf.paramInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
            value={serien}
            onChangeText={setSerien}
            placeholder="z.B. 3"
            placeholderTextColor={C.textDim}
            keyboardType="number-pad"
          />
        </View>
        <View style={kf.paramRow}>
          <Text style={[kf.paramLabel, { color: C.textSub }]}>Serienpause</Text>
          <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
            <TextInput
              style={[form.paramInputField, kf.paramInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }]}
              value={sp}
              onChangeText={setSp}
              placeholder="z.B. 3"
              placeholderTextColor={C.textDim}
              keyboardType="decimal-pad"
            />
            {TIME_EINHEITEN.map(u => (
              <TouchableOpacity key={u} style={[form.unitBtn, { borderColor: C.border, backgroundColor: C.surface }, spUnit === u && form.unitBtnOn]} onPress={() => setSpUnit(u)} activeOpacity={0.7}>
                <Text style={[form.unitText, { color: C.textSub }, spUnit === u && form.unitTextOn]}>{u}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      {steps.length > 0 && prevParts.length > 0 && (
        <View style={form.preview}>
          <Text style={form.previewLabel}>Vorschau</Text>
          <Text style={[form.previewText, { color: C.text }]}>{name.trim() || 'Intervall'} ({prevParts.join(' · ')})</Text>
        </View>
      )}

      {steps.length === 0 && (
        <View style={kf.emptyHint}>
          <Text style={[kf.emptyHintText, { color: C.textDim }]}>Mindestens einen Schritt hinzufügen</Text>
        </View>
      )}

      <View style={form.btns}>
        <TouchableOpacity style={[form.cancelBtn, { backgroundColor: C.surfaceAlt }]} onPress={onCancel} activeOpacity={0.7}>
          <Text style={[form.cancelBtnText, { color: C.textMuted }]}>Abbrechen</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[form.submitBtn, { backgroundColor: steps.length > 0 ? phaseColor : C.surfaceAlt }]}
          onPress={handleSubmit}
          disabled={steps.length === 0}
          activeOpacity={0.8}
        >
          <Text style={[form.submitBtnText, { color: steps.length > 0 ? C.accentContrast : C.textDim }]}>
            {initialIntervall ? 'Aktualisieren' : 'Intervall anlegen'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Intervall Card (display) ─────────────────────────────────────────────────

function IntervallCard({ ueb, phaseColor, isEditing, onEdit, onDelete }: {
  ueb: EinheitUebung;
  phaseColor: string;
  isEditing?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const C = useColors();
  const serien = ueb.parameter.find(p => p.typ === 'serien');
  const sp     = ueb.parameter.find(p => p.typ === 'serienpause');

  return (
    <View style={[ki.wrap, { backgroundColor: C.surface, borderColor: C.border }, isEditing && ki.wrapEditing, isEditing && { borderColor: C.accent }]}>
      <View style={ki.header}>
        <View style={[ki.icon, { backgroundColor: `${phaseColor}22` }]}>
          <GBIcon name="flag" size={14} color={phaseColor} />
        </View>
        <Text style={[ki.name, { color: C.text }]}>{ueb.name}</Text>
        {serien && (
          <View style={[ki.badge, { backgroundColor: `${phaseColor}22` }]}>
            <Text style={[ki.badgeText, { color: phaseColor }]}>{serien.wert}×</Text>
          </View>
        )}
        <View style={{ flex: 1 }} />
        <TouchableOpacity onPress={onEdit} style={[styles.miniBtn, { backgroundColor: C.surfaceAlt }]} activeOpacity={0.7}>
          <GBIcon name="edit" size={13} color={C.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} style={styles.miniBtnDanger} activeOpacity={0.7}>
          <GBIcon name="trash" size={13} color={C.warn} />
        </TouchableOpacity>
      </View>

      {ueb.kreisUebungen?.map((ku, i) => (
        <View key={ku.id} style={[ki.stepCard, { borderTopColor: C.border }]}>
          <Text style={[ki.stepIdx, { color: C.textDim }]}>{i + 1}.</Text>
          <View style={{ flex: 1 }}>
            {ku.name ? <Text style={[ki.stepCardName, { color: C.textMuted }]}>{ku.name}</Text> : null}
            <View style={ki.stepMain}>
              <Text style={[ki.stepWertCard, { color: C.text }]}>{ku.wert} {ku.einheit}</Text>
              {ku.zielzeit ? (
                <View style={ki.zielChip}>
                  <Text style={[ki.zielText, { color: C.accent }]}>in {ku.zielzeit}{ku.zeiteinheit ?? 's'}</Text>
                </View>
              ) : null}
            </View>
          </View>
          {ku.pause ? (
            <View style={ki.pauseChip}>
              <GBIcon name="clock" size={9} color={C.textDim} />
              <Text style={[ki.pauseText, { color: C.textDim }]}>{ku.pause}{ku.pauseeinheit ?? 's'}</Text>
            </View>
          ) : null}
        </View>
      ))}

      {sp && (
        <View style={[ki.footer, { borderTopColor: C.border, backgroundColor: C.surfaceAlt }]}>
          <GBIcon name="stopwatch" size={10} color={C.textDim} />
          <Text style={[ki.footerText, { color: C.textDim }]}>{sp.wert}{sp.einheit ?? 'min'} Serienpause</Text>
        </View>
      )}
    </View>
  );
}

// ─── Form styles (shared) ─────────────────────────────────────────────────────

const form = StyleSheet.create({
  wrap:        { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1.5, padding: SP.lg, gap: SP.md },
  title:       { fontSize: FONT.xs, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.4 },

  nameRow:     { flexDirection: 'row', gap: SP.sm, alignItems: 'center' },
  nameInput:   { flex: 1, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.sm + 1, fontSize: FONT.base, fontWeight: '700', color: C.text },
  nameInputFull: { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.sm + 1, fontSize: FONT.base, fontWeight: '700', color: C.text },
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
  unitRow:          { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
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

// ─── KreisForm styles ─────────────────────────────────────────────────────────

const kf = StyleSheet.create({
  section:     { backgroundColor: C.surfaceAlt, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.md, gap: SP.sm },
  sectionLabel:{ fontSize: FONT.xs, fontWeight: '800', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 2 },
  exRow:       { flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingVertical: SP.xs },
  exRowDim:    { opacity: 0.4 },
  exNum:       { width: 22, height: 22, borderRadius: 11, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  exNumText:   { fontFamily: FONT_MONO, fontSize: 11, fontWeight: '700', color: C.textMuted },
  exName:      { fontSize: FONT.sm, fontWeight: '600', color: C.text },
  exVal:       { fontFamily: FONT_MONO, fontSize: 11, color: C.accent, fontWeight: '700', marginTop: 1 },
  editor:      { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, padding: SP.md, gap: SP.sm },
  paramRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SP.sm },
  paramLabel:  { fontSize: FONT.sm, fontWeight: '600', color: C.textSub, flex: 1 },
  paramInput:  { width: 72 },
  emptyHint:   { alignItems: 'center', paddingVertical: SP.xs },
  emptyHintText: { fontSize: FONT.xs, color: C.textDim, fontStyle: 'italic' },
});

// ─── KreisCard styles ─────────────────────────────────────────────────────────

const kc = StyleSheet.create({
  wrap:        { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  wrapEditing: { borderColor: C.accent },
  header:      { flexDirection: 'row', alignItems: 'center', gap: SP.sm, padding: SP.md, paddingBottom: SP.sm },
  icon:        { width: 26, height: 26, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:        { fontSize: FONT.base, fontWeight: '700', color: C.text },
  badge:       { paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: R.full },
  badgeText:   { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '800' },
  exRow:       { flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingHorizontal: SP.md, paddingVertical: 5, borderTopWidth: 1, borderTopColor: C.border },
  exIdx:       { fontFamily: FONT_MONO, fontSize: 11, color: C.textDim, width: 16, textAlign: 'right', flexShrink: 0 },
  exName:      { flex: 1, fontSize: FONT.sm, fontWeight: '600', color: C.text },
  exVal:       { fontFamily: FONT_MONO, fontSize: 11, fontWeight: '700', color: C.accent },
  footer:      { flexDirection: 'row', flexWrap: 'wrap', gap: SP.md, padding: SP.sm, paddingHorizontal: SP.md, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surfaceAlt },
  footerChip:  { flexDirection: 'row', alignItems: 'center', gap: 4 },
  footerText:  { fontSize: 10, fontWeight: '600', color: C.textDim },
});

// ─── IntervallCard + IntervallForm styles ─────────────────────────────────────

const ki = StyleSheet.create({
  // Card
  wrap:         { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  wrapEditing:  { borderColor: C.accent },
  header:       { flexDirection: 'row', alignItems: 'center', gap: SP.sm, padding: SP.md, paddingBottom: SP.sm },
  icon:         { width: 26, height: 26, borderRadius: R.sm, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  name:         { fontSize: FONT.base, fontWeight: '700', color: C.text },
  badge:        { paddingHorizontal: SP.sm, paddingVertical: 2, borderRadius: R.full },
  badgeText:    { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '800' },
  stepCard:     { flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingHorizontal: SP.md, paddingVertical: SP.sm, borderTopWidth: 1, borderTopColor: C.border },
  stepIdx:      { fontFamily: FONT_MONO, fontSize: 11, color: C.textDim, width: 16, textAlign: 'right', flexShrink: 0 },
  stepCardName: { fontSize: 10, fontWeight: '600', color: C.textMuted, marginBottom: 1 },
  stepMain:     { flexDirection: 'row', alignItems: 'center', gap: SP.sm, flexWrap: 'wrap' },
  stepWertCard: { fontFamily: FONT_MONO, fontSize: FONT.sm, fontWeight: '700', color: C.text },
  zielChip:     { backgroundColor: 'rgba(203,255,62,0.10)', borderRadius: R.full, paddingHorizontal: 6, paddingVertical: 1 },
  zielText:     { fontFamily: FONT_MONO, fontSize: 10, fontWeight: '700', color: C.accent },
  pauseChip:    { flexDirection: 'row', alignItems: 'center', gap: 3, flexShrink: 0 },
  pauseText:    { fontFamily: FONT_MONO, fontSize: 10, fontWeight: '600', color: C.textDim },
  footer:       { flexDirection: 'row', alignItems: 'center', gap: 4, padding: SP.sm, paddingHorizontal: SP.md, borderTopWidth: 1, borderTopColor: C.border, backgroundColor: C.surfaceAlt },
  footerText:   { fontSize: 10, fontWeight: '600', color: C.textDim },

  // Form step list
  stepRow:    { flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingVertical: SP.xs },
  stepInline: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: SP.xs },
  stepWert:   { fontFamily: FONT_MONO, fontSize: FONT.sm, fontWeight: '700', color: C.text },
  stepZiel:   { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '600', color: C.accent },
  stepPause:  { fontSize: FONT.xs, fontWeight: '600', color: C.textDim },
  stepLabel:  { fontSize: 10, color: C.textMuted, marginTop: 1 },
  inputGroup: { gap: 4 },
  inputLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1 },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

type Phases = Record<Phase, EinheitUebung[]>;
type ActiveForm = null | { phase: Phase; kind: 'ueb' | 'kreis' | 'intervall'; editId?: string };

export default function EinheitDetailScreen({ navigation, route }: Props) {
  const C = useColors();
  const { planId, wocheId, einheitId, datum } = route.params;
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
  const [activeForm, setActiveForm]     = useState<ActiveForm>(null);

  const closeForm = () => setActiveForm(null);

  const handleUebSubmit = (ueb: EinheitUebung, saveToLib = false) => {
    if (saveToLib && ueb.typ !== 'kreis') {
      saveUebToLib({ name: ueb.name, parameter: ueb.parameter });
    }
    const af = activeForm!;
    setPhases((prev) => ({
      ...prev,
      [af.phase]: af.editId
        ? prev[af.phase].map((u) => (u.id === af.editId ? ueb : u))
        : [...prev[af.phase], ueb],
    }));
    closeForm();
  };

  const deleteUeb = (phase: Phase, uid: string) => {
    if (activeForm?.editId === uid) closeForm();
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
      datum: existing?.datum ?? datum,
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
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>

        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={[styles.topSub, { color: C.textMuted }]}>{existing ? 'Einheit bearbeiten' : 'Neue Einheit'}</Text>
            <Text style={[styles.topTitle, { color: C.text }]} numberOfLines={1}>{name.trim() || '—'}</Text>
          </View>
          <TouchableOpacity onPress={handleSaveEinheit} style={[styles.saveBtn, { backgroundColor: C.accent }]} activeOpacity={0.8}>
            <Text style={[styles.saveBtnText, { color: C.accentContrast }]}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Einheit name + library */}
          <View style={styles.nameSection}>
            <View style={styles.nameRow}>
              <TextInput
                style={[styles.nameInput, { backgroundColor: C.surface, borderColor: C.border, color: C.text }, nameError ? styles.inputError : null]}
                value={name}
                onChangeText={(v) => { setName(v); setNameError(''); }}
                placeholder="Einheit benennen…"
                placeholderTextColor={C.textDim}
                autoCapitalize="words"
              />
              <TouchableOpacity
                style={[styles.libBtn, { backgroundColor: C.surface, borderColor: C.border }, showEinheitLib && styles.libBtnOn]}
                onPress={() => setShowEinheitLib((v) => !v)}
                activeOpacity={0.7}
              >
                <GBIcon name="layers" size={16} color={showEinheitLib ? C.accentContrast : C.textMuted} />
                <Text style={[styles.libBtnText, { color: C.textMuted }, showEinheitLib && styles.libBtnTextOn]}>Einheit</Text>
              </TouchableOpacity>
            </View>
            {nameError ? <Text style={styles.errText}>{nameError}</Text> : null}

            {showEinheitLib && (
              <View style={[styles.einheitLibList, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.einheitLibTitle, { color: C.textMuted, borderBottomColor: C.border }]}>Aus Einheitenbibliothek</Text>
                {einheitLib.map((tpl) => (
                  <TouchableOpacity key={tpl.id} style={[styles.einheitLibItem, { borderBottomColor: C.border }]} onPress={() => pickEinheitLib(tpl)} activeOpacity={0.7}>
                    <View style={styles.einheitLibIcon}>
                      <GBIcon name="dumbbell" size={14} color={C.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.einheitLibName, { color: C.text }]}>{tpl.name}</Text>
                      <Text style={[styles.einheitLibSub, { color: C.textMuted }]}>
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
            <Text style={[styles.statsText, { color: C.textDim }]}>{totalEx} Einträge · 3 Phasen</Text>
            <TouchableOpacity style={styles.libToggle} onPress={() => setSaveEinheitLib((v) => !v)} activeOpacity={0.7}>
              <View style={[styles.check, { borderColor: C.border, backgroundColor: C.surfaceAlt }, saveEinheitLib && styles.checkOn]}>
                {saveEinheitLib && <GBIcon name="check" size={11} color={C.accentContrast} />}
              </View>
              <Text style={[styles.libToggleLabel, { color: C.textMuted }]}>In Bibliothek</Text>
            </TouchableOpacity>
          </View>

          {/* Phase sections */}
          {PHASES.map((phase) => {
            const cfg = PHASE_CFG[phase];
            const exercises = phases[phase];
            const formActive = activeForm?.phase === phase;

            return (
              <View key={phase} style={styles.phaseSection}>
                {/* Phase header */}
                <View style={[styles.phaseHeader, { borderLeftColor: cfg.color }]}>
                  <Text style={[styles.phaseTitle, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={[styles.phaseCount, { color: C.textDim }]}>{exercises.length} Einträge</Text>
                </View>

                {/* Exercise / Circuit rows */}
                {exercises.map((u) => {
                  const isEditing = activeForm?.editId === u.id && formActive;
                  if (u.typ === 'kreis') {
                    return (
                      <KreisCard
                        key={u.id}
                        ueb={u}
                        phaseColor={cfg.color}
                        isEditing={isEditing}
                        onEdit={() => setActiveForm({ phase, kind: 'kreis', editId: u.id })}
                        onDelete={() => deleteUeb(phase, u.id)}
                      />
                    );
                  }
                  if (u.typ === 'intervall') {
                    return (
                      <IntervallCard
                        key={u.id}
                        ueb={u}
                        phaseColor={cfg.color}
                        isEditing={isEditing}
                        onEdit={() => setActiveForm({ phase, kind: 'intervall', editId: u.id })}
                        onDelete={() => deleteUeb(phase, u.id)}
                      />
                    );
                  }
                  return (
                    <View key={u.id} style={[styles.uebRow, { backgroundColor: C.surface, borderColor: C.border }, isEditing && styles.uebRowActive, isEditing && { borderColor: C.accent }]}>
                      <View style={[styles.uebDot, { backgroundColor: cfg.color }]} />
                      <View style={styles.uebInfo}>
                        <Text style={[styles.uebName, { color: C.text }]}>{u.name}</Text>
                        {u.parameter.length > 0 && (
                          <Text style={[styles.uebParams, { color: C.textMuted }]}>{buildSuffix(u.parameter)}</Text>
                        )}
                      </View>
                      <View style={styles.uebActions}>
                        <TouchableOpacity onPress={() => setActiveForm({ phase, kind: 'ueb', editId: u.id })} style={[styles.miniBtn, { backgroundColor: C.surfaceAlt }]} activeOpacity={0.7}>
                          <GBIcon name="edit" size={13} color={C.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteUeb(phase, u.id)} style={styles.miniBtnDanger} activeOpacity={0.7}>
                          <GBIcon name="trash" size={13} color={C.warn} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* Add buttons (when no form open for this phase) */}
                {!formActive && (
                  <View style={styles.addBtnsRow}>
                    <TouchableOpacity
                      style={[styles.addUebBtn, { borderColor: `${cfg.color}55`, flex: 1 }]}
                      onPress={() => setActiveForm({ phase, kind: 'ueb' })}
                      activeOpacity={0.8}
                    >
                      <GBIcon name="plus" size={14} color={cfg.color} />
                      <Text style={[styles.addUebText, { color: cfg.color }]}>Übung</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addUebBtn, { borderColor: `${cfg.color}33`, flex: 1 }]}
                      onPress={() => setActiveForm({ phase, kind: 'kreis' })}
                      activeOpacity={0.8}
                    >
                      <GBIcon name="repeat" size={14} color={cfg.color} />
                      <Text style={[styles.addUebText, { color: cfg.color }]}>Kreis</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.addUebBtn, { borderColor: `${cfg.color}33`, flex: 1 }]}
                      onPress={() => setActiveForm({ phase, kind: 'intervall' })}
                      activeOpacity={0.8}
                    >
                      <GBIcon name="flag" size={14} color={cfg.color} />
                      <Text style={[styles.addUebText, { color: cfg.color }]}>Intervall</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Inline forms */}
                {formActive && activeForm.kind === 'ueb' && (
                  <UebungForm
                    key={`${phase}-ueb-${activeForm.editId ?? 'new'}`}
                    phase={phase}
                    phaseColor={cfg.color}
                    initialUebung={activeForm.editId ? exercises.find(u => u.id === activeForm.editId) : undefined}
                    uebungLib={uebungLib}
                    onSubmit={handleUebSubmit}
                    onCancel={closeForm}
                  />
                )}

                {formActive && activeForm.kind === 'kreis' && (
                  <KreisForm
                    key={`${phase}-kreis-${activeForm.editId ?? 'new'}`}
                    phase={phase}
                    phaseColor={cfg.color}
                    initialKreis={activeForm.editId ? exercises.find(u => u.id === activeForm.editId) as EinheitUebung : undefined}
                    onSubmit={handleUebSubmit}
                    onCancel={closeForm}
                  />
                )}

                {formActive && activeForm.kind === 'intervall' && (
                  <IntervallForm
                    key={`${phase}-intervall-${activeForm.editId ?? 'new'}`}
                    phase={phase}
                    phaseColor={cfg.color}
                    initialIntervall={activeForm.editId ? exercises.find(u => u.id === activeForm.editId) as EinheitUebung : undefined}
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

// ─── Screen Styles ────────────────────────────────────────────────────────────

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

  addBtnsRow:  { flexDirection: 'row', gap: SP.sm },
  addUebBtn:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.md, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed' },
  addUebText:  { fontSize: FONT.sm, fontWeight: '700' },
});
