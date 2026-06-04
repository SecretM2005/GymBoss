import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SportlerStackParamList, Phase, EinheitUebung } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useUebungStore } from '../../store/uebungStore';
import { useAthletenStore } from '../../store/athletenStore';
import { GBIcon } from '../../components/GBIcon';
import {
  PHASE_CFG, PHASES, UebungForm, buildUebSuffix, newUebId,
} from '../plaene/EinheitDetailScreen';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<SportlerStackParamList, 'SportlerEinheitDetail'>;
  route: RouteProp<SportlerStackParamList, 'SportlerEinheitDetail'>;
};

type Phases = Record<Phase, EinheitUebung[]>;

export default function SportlerEinheitDetailScreen({ navigation, route }: Props) {
  const { planId, wocheId, einheitId, sportlerId } = route.params;
  const { getPlanById, saveEinheitOverride } = usePlanStore();
  const { uebungen: uebungLib } = useUebungStore();
  const { getSportlerById } = useAthletenStore();
  const insets = useSafeAreaInsets();
  const C = useColors();

  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);
  const baseEinheit = woche?.einheiten.find((e) => e.id === einheitId);
  const sportler = getSportlerById(sportlerId);

  const override = baseEinheit?.sportlerOverrides?.[sportlerId];
  const effective = override ? { ...baseEinheit!, ...override } : baseEinheit;

  const [name, setName]             = useState(effective?.name ?? '');
  const [nameError, setNameError]   = useState('');
  const [phases, setPhases]         = useState<Phases>({
    warmup:       effective?.warmup       ?? [],
    haupteinheit: effective?.haupteinheit ?? [],
    cooldown:     effective?.cooldown     ?? [],
  });
  const [activePhase, setActivePhase]   = useState<Phase | null>(null);
  const [editingUebId, setEditingUebId] = useState<string | null>(null);

  const editingUeb = editingUebId && activePhase
    ? phases[activePhase].find((u) => u.id === editingUebId)
    : undefined;

  const openAdd  = (phase: Phase) => { setActivePhase(phase); setEditingUebId(null); };
  const openEdit = (phase: Phase, uid: string) => { setActivePhase(phase); setEditingUebId(uid); };
  const closeForm = () => { setActivePhase(null); setEditingUebId(null); };

  const handleUebSubmit = (ueb: EinheitUebung, _saveToLib: boolean) => {
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

  const handleSave = () => {
    if (!name.trim()) { setNameError('Name ist erforderlich'); return; }
    saveEinheitOverride(planId, wocheId, einheitId, sportlerId, {
      id: einheitId,
      name: name.trim(),
      warmup: phases.warmup,
      haupteinheit: phases.haupteinheit,
      cooldown: phases.cooldown,
    });
    navigation.goBack();
  };

  if (!baseEinheit) {
    navigation.goBack();
    return null;
  }

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
            <Text style={[styles.topSub, { color: C.accent }]} numberOfLines={1}>
              Nur für {sportler?.name ?? sportlerId}
            </Text>
            <Text style={[styles.topTitle, { color: C.text }]} numberOfLines={1}>{name.trim() || '—'}</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={[styles.saveBtn, { backgroundColor: C.accent }]} activeOpacity={0.8}>
            <Text style={[styles.saveBtnText, { color: C.accentContrast }]}>Speichern</Text>
          </TouchableOpacity>
        </View>

        {/* Override info banner */}
        <View style={styles.banner}>
          <GBIcon name="user" size={14} color={C.accent} />
          <Text style={[styles.bannerText, { color: C.textSub }]}>
            Änderungen gelten nur für {sportler?.name ?? 'diesen Sportler'} — der Originalplan bleibt unberührt.
          </Text>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Stats row */}
          <View style={styles.statsRow}>
            <Text style={[styles.statsText, { color: C.textDim }]}>{totalEx} Übungen · 3 Phasen</Text>
            {override && (
              <View style={styles.overridePill}>
                <Text style={[styles.overridePillText, { color: C.accent }]}>Individuelle Version</Text>
              </View>
            )}
          </View>

          {/* Phase sections */}
          {PHASES.map((phase) => {
            const cfg = PHASE_CFG[phase];
            const exercises = phases[phase];
            const isActive = activePhase === phase;

            return (
              <View key={phase} style={styles.phaseSection}>
                <View style={[styles.phaseHeader, { borderLeftColor: cfg.color }]}>
                  <Text style={[styles.phaseTitle, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={[styles.phaseCount, { color: C.textDim }]}>{exercises.length} Übungen</Text>
                </View>

                {exercises.map((u) => (
                  <View key={u.id} style={[styles.uebRow, { backgroundColor: C.surface, borderColor: C.border }, editingUebId === u.id && styles.uebRowActive, editingUebId === u.id && { borderColor: C.accent }]}>
                    <View style={[styles.uebDot, { backgroundColor: cfg.color }]} />
                    <View style={styles.uebInfo}>
                      <Text style={[styles.uebName, { color: C.text }]}>{u.name}</Text>
                      {buildUebSuffix(u).length > 0 && (
                        <Text style={[styles.uebParams, { color: C.textMuted }]}>{buildUebSuffix(u)}</Text>
                      )}
                    </View>
                    <View style={styles.uebActions}>
                      <TouchableOpacity onPress={() => openEdit(phase, u.id)} style={[styles.miniBtn, { backgroundColor: C.surfaceAlt }]} activeOpacity={0.7}>
                        <GBIcon name="edit" size={13} color={C.textMuted} />
                      </TouchableOpacity>
                      <TouchableOpacity onPress={() => deleteUeb(phase, u.id)} style={styles.miniBtnDanger} activeOpacity={0.7}>
                        <GBIcon name="trash" size={13} color={C.warn} />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}

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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.md, gap: SP.sm },
  iconBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, paddingHorizontal: SP.sm },
  topSub:    { fontSize: 11, color: C.accent, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle:  { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  saveBtn:   { backgroundColor: C.accent, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  saveBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  banner:     { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, backgroundColor: 'rgba(203,255,62,0.07)', borderBottomWidth: 1, borderBottomColor: 'rgba(203,255,62,0.15)', paddingHorizontal: SP.xl, paddingVertical: SP.sm + 2 },
  bannerText: { flex: 1, fontSize: FONT.xs, color: C.textSub, lineHeight: 17 },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.md, gap: SP.lg },

  statsRow:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statsText:    { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },
  overridePill: { backgroundColor: 'rgba(203,255,62,0.12)', borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 3, borderWidth: 1, borderColor: 'rgba(203,255,62,0.25)' },
  overridePillText: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 0.4 },

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
