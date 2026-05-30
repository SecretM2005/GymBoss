import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MehrStackParamList, Phase, EinheitUebung, EinheitTemplate } from '../../types';
import { useEinheitStore } from '../../store/einheitStore';
import { useUebungStore } from '../../store/uebungStore';
import {
  PHASE_CFG, PHASES, UebungForm, KreisForm, IntervallForm,
  KreisCard, IntervallCard, buildSuffix, newUebId,
} from '../plaene/EinheitDetailScreen';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

type Props = {
  navigation: StackNavigationProp<MehrStackParamList, 'EinheitTemplateDetail'>;
  route: RouteProp<MehrStackParamList, 'EinheitTemplateDetail'>;
};

type Phases = Record<Phase, EinheitUebung[]>;
type ActiveForm = null | { phase: Phase; kind: 'ueb' | 'kreis' | 'intervall'; editId?: string };

let _etId = 500;
const newEtId = () => `et_${++_etId}`;

export default function EinheitTemplateDetailScreen({ navigation, route }: Props) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const { einheitTemplateId } = route.params;
  const { einheiten, addEinheit, updateEinheit } = useEinheitStore();
  const { uebungen: uebungLib, addUebung: saveUebToLib } = useUebungStore();

  const existing = einheitTemplateId ? einheiten.find((e) => e.id === einheitTemplateId) : undefined;

  const [name, setName]             = useState(existing?.name ?? '');
  const [nameError, setNameError]   = useState('');
  const [phases, setPhases]         = useState<Phases>({
    warmup:       existing?.warmup       ?? [],
    haupteinheit: existing?.haupteinheit ?? [],
    cooldown:     existing?.cooldown     ?? [],
  });
  const [activeForm, setActiveForm] = useState<ActiveForm>(null);

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

  const handleSave = () => {
    if (!name.trim()) { setNameError('Name ist erforderlich'); return; }
    const template: EinheitTemplate = {
      id: existing?.id ?? newEtId(),
      name: name.trim(),
      warmup: phases.warmup,
      haupteinheit: phases.haupteinheit,
      cooldown: phases.cooldown,
    };
    if (existing) {
      updateEinheit(existing.id, template);
    } else {
      addEinheit(template);
    }
    navigation.goBack();
  };

  const totalEx = phases.warmup.length + phases.haupteinheit.length + phases.cooldown.length;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[s.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>

        {/* Top Bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={s.iconBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={s.topCenter}>
            <Text style={[s.topSub, { color: C.textMuted }]}>{existing ? 'Einheit bearbeiten' : 'Neue Einheit'}</Text>
            <Text style={[s.topTitle, { color: C.text }]} numberOfLines={1}>{name.trim() || '—'}</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={[s.saveBtn, { backgroundColor: C.accent }]} activeOpacity={0.8}>
            <Text style={[s.saveBtnText, { color: C.accentContrast }]}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">

          {/* Name input */}
          <View style={s.nameSection}>
            <TextInput
              style={[s.nameInput, { backgroundColor: C.surface, borderColor: nameError ? C.warn : C.border, color: C.text }]}
              value={name}
              onChangeText={(v) => { setName(v); setNameError(''); }}
              placeholder="Einheit benennen…"
              placeholderTextColor={C.textDim}
              autoCapitalize="words"
            />
            {nameError ? <Text style={[s.errText, { color: C.warn }]}>{nameError}</Text> : null}
          </View>

          {/* Stats */}
          <Text style={[s.statsText, { color: C.textDim }]}>{totalEx} Einträge · 3 Phasen</Text>

          {/* Phase sections */}
          {PHASES.map((phase) => {
            const cfg = PHASE_CFG[phase];
            const exercises = phases[phase];
            const formActive = activeForm?.phase === phase;

            return (
              <View key={phase} style={s.phaseSection}>
                <View style={[s.phaseHeader, { borderLeftColor: cfg.color }]}>
                  <Text style={[s.phaseTitle, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={[s.phaseCount, { color: C.textDim }]}>{exercises.length} Einträge</Text>
                </View>

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
                    <View
                      key={u.id}
                      style={[s.uebRow, { backgroundColor: C.surface, borderColor: isEditing ? C.accent : C.border }]}
                    >
                      <View style={[s.uebDot, { backgroundColor: cfg.color }]} />
                      <View style={s.uebInfo}>
                        <Text style={[s.uebName, { color: C.text }]}>{u.name}</Text>
                        {u.parameter.length > 0 && (
                          <Text style={[s.uebParams, { color: C.textMuted }]}>{buildSuffix(u.parameter)}</Text>
                        )}
                      </View>
                      <View style={s.uebActions}>
                        <TouchableOpacity
                          onPress={() => setActiveForm({ phase, kind: 'ueb', editId: u.id })}
                          style={[s.miniBtn, { backgroundColor: C.surfaceAlt }]}
                          activeOpacity={0.7}
                        >
                          <GBIcon name="edit" size={13} color={C.textMuted} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => deleteUeb(phase, u.id)} style={s.miniBtnDanger} activeOpacity={0.7}>
                          <GBIcon name="trash" size={13} color={C.warn} />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {!formActive && (
                  <View style={s.addBtnsRow}>
                    <TouchableOpacity
                      style={[s.addUebBtn, { borderColor: `${cfg.color}55`, flex: 1 }]}
                      onPress={() => setActiveForm({ phase, kind: 'ueb' })}
                      activeOpacity={0.8}
                    >
                      <GBIcon name="plus" size={14} color={cfg.color} />
                      <Text style={[s.addUebText, { color: cfg.color }]}>Übung</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.addUebBtn, { borderColor: `${cfg.color}33`, flex: 1 }]}
                      onPress={() => setActiveForm({ phase, kind: 'kreis' })}
                      activeOpacity={0.8}
                    >
                      <GBIcon name="repeat" size={14} color={cfg.color} />
                      <Text style={[s.addUebText, { color: cfg.color }]}>Kreis</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[s.addUebBtn, { borderColor: `${cfg.color}33`, flex: 1 }]}
                      onPress={() => setActiveForm({ phase, kind: 'intervall' })}
                      activeOpacity={0.8}
                    >
                      <GBIcon name="flag" size={14} color={cfg.color} />
                      <Text style={[s.addUebText, { color: cfg.color }]}>Intervall</Text>
                    </TouchableOpacity>
                  </View>
                )}

                {formActive && activeForm.kind === 'ueb' && (
                  <UebungForm
                    key={`${phase}-ueb-${activeForm.editId ?? 'new'}`}
                    phase={phase}
                    phaseColor={cfg.color}
                    initialUebung={activeForm.editId ? exercises.find((u) => u.id === activeForm.editId) : undefined}
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
                    initialKreis={activeForm.editId ? exercises.find((u) => u.id === activeForm.editId) as EinheitUebung : undefined}
                    onSubmit={handleUebSubmit}
                    onCancel={closeForm}
                  />
                )}
                {formActive && activeForm.kind === 'intervall' && (
                  <IntervallForm
                    key={`${phase}-intervall-${activeForm.editId ?? 'new'}`}
                    phase={phase}
                    phaseColor={cfg.color}
                    initialIntervall={activeForm.editId ? exercises.find((u) => u.id === activeForm.editId) as EinheitUebung : undefined}
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

  nameSection: { gap: SP.sm },
  nameInput:   { borderWidth: 1, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md, fontSize: FONT.md, fontWeight: '700' },
  errText:     { fontSize: FONT.xs },

  statsText:  { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },

  phaseSection: { gap: SP.sm },
  phaseHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 3, paddingLeft: SP.sm },
  phaseTitle:   { fontSize: FONT.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  phaseCount:   { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },

  uebRow:       { flexDirection: 'row', alignItems: 'center', gap: SP.md, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  uebDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  uebInfo:      { flex: 1 },
  uebName:      { fontSize: FONT.base, fontWeight: '600', color: C.text },
  uebParams:    { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 16 },
  uebActions:   { flexDirection: 'row', gap: 4 },
  miniBtn:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  miniBtnDanger: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,106,61,0.10)', alignItems: 'center', justifyContent: 'center' },

  addBtnsRow: { flexDirection: 'row', gap: SP.sm },
  addUebBtn:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.md, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed' },
  addUebText: { fontSize: FONT.sm, fontWeight: '700' },
});
