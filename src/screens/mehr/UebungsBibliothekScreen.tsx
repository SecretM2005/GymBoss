import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MehrStackParamList, Muskelgruppe } from '../../types';
import { useEinheitStore } from '../../store/einheitStore';
import { useUebungStore } from '../../store/uebungStore';
import { buildSuffix } from '../plaene/EinheitDetailScreen';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

type Props = {
  navigation: StackNavigationProp<MehrStackParamList, 'Uebungsbibliothek'>;
};

const PHASE_COLORS = {
  warmup:       '#FF8A66',
  haupteinheit: '#CBFF3E',
  cooldown:     '#7ABFFF',
};

const ALL_MUSKELGRUPPEN: Muskelgruppe[] = [
  'Brust', 'Rücken', 'Schultern', 'Bizeps', 'Trizeps',
  'Bauch', 'Gesäß', 'Oberschenkel', 'Hamstrings', 'Wade', 'Ganzkörper',
];

export default function UebungsBibliothekScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { einheiten, deleteEinheit } = useEinheitStore();
  const { uebungen, deleteUebung } = useUebungStore();
  const [tab, setTab]                       = useState<'einheiten' | 'uebungen'>('einheiten');
  const [selectedMuskeln, setSelectedMuskeln] = useState<Set<Muskelgruppe>>(new Set());

  const filteredUebungen = useMemo(() => {
    if (selectedMuskeln.size === 0) return uebungen;
    return uebungen.filter((u) => u.muskelgruppe && (selectedMuskeln.has(u.muskelgruppe) || selectedMuskeln.has('Ganzkörper') || u.muskelgruppe === 'Ganzkörper'));
  }, [uebungen, selectedMuskeln]);

  const toggleMuskel = (mg: Muskelgruppe) => {
    setSelectedMuskeln((prev) => {
      const next = new Set(prev);
      if (next.has(mg)) next.delete(mg); else next.add(mg);
      return next;
    });
  };

  const handleDeleteEinheit = (id: string, name: string) => {
    Alert.alert('Einheit löschen', `„${name}" wirklich entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteEinheit(id) },
    ]);
  };

  const handleDeleteUebung = (id: string, name: string) => {
    Alert.alert('Übung löschen', `„${name}" wirklich entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteUebung(id) },
    ]);
  };

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>

      {/* Top Bar */}
      <View style={[s.topBar, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.iconBtn, { backgroundColor: C.surface, borderColor: C.border }]}
          activeOpacity={0.7}
        >
          <GBIcon name="chevronLeft" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={[s.tileIcon, { backgroundColor: 'rgba(203,255,62,0.10)' }]}>
          <GBIcon name="book" size={18} color={C.accent} />
        </View>
        <Text style={[s.headerTitle, { color: C.text }]}>Übungsbibliothek</Text>
      </View>

      {/* Segment control */}
      <View style={[s.segment, { backgroundColor: C.surface, borderColor: C.border }]}>
        <TouchableOpacity
          style={[s.segBtn, tab === 'einheiten' && { backgroundColor: C.accent }]}
          onPress={() => setTab('einheiten')}
          activeOpacity={0.8}
        >
          <GBIcon name="dumbbell" size={14} color={tab === 'einheiten' ? C.accentContrast : C.textMuted} />
          <Text style={[s.segLabel, { color: tab === 'einheiten' ? C.accentContrast : C.textMuted }]}>
            Einheiten ({einheiten.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.segBtn, tab === 'uebungen' && { backgroundColor: C.accent }]}
          onPress={() => setTab('uebungen')}
          activeOpacity={0.8}
        >
          <GBIcon name="layers" size={14} color={tab === 'uebungen' ? C.accentContrast : C.textMuted} />
          <Text style={[s.segLabel, { color: tab === 'uebungen' ? C.accentContrast : C.textMuted }]}>
            Übungen ({uebungen.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Muskelgruppen-Filter (uebungen tab) */}
        {tab === 'uebungen' && (
          <View style={[s.filterCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={s.filterHeader}>
              <GBIcon name="filter" size={14} color={C.textDim} />
              <Text style={[s.filterLabel, { color: C.textDim }]}>
                {selectedMuskeln.size > 0 ? `${filteredUebungen.length} Übungen` : 'Nach Muskelgruppe filtern'}
              </Text>
              {selectedMuskeln.size > 0 && (
                <TouchableOpacity onPress={() => setSelectedMuskeln(new Set())} activeOpacity={0.8}>
                  <Text style={[s.clearFilter, { color: C.warn }]}>Zurücksetzen ×</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={s.chipRow}>
              {ALL_MUSKELGRUPPEN.map((mg) => {
                const active = selectedMuskeln.has(mg);
                return (
                  <TouchableOpacity
                    key={mg}
                    style={[s.muskelChip, { borderColor: active ? C.accent : C.border, backgroundColor: active ? C.accentLight : C.surfaceAlt }]}
                    onPress={() => toggleMuskel(mg)}
                    activeOpacity={0.75}
                  >
                    <Text style={[s.muskelChipText, { color: active ? C.accent : C.textMuted }]}>{mg}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {tab === 'einheiten' && (
          einheiten.length === 0 ? (
            <View style={s.empty}>
              <GBIcon name="dumbbell" size={44} color={C.textDim} />
              <Text style={[s.emptyTitle, { color: C.textSub }]}>Keine Einheiten</Text>
              <Text style={[s.emptySub, { color: C.textDim }]}>Tippe auf + um eine neue Trainingseinheit anzulegen.</Text>
            </View>
          ) : (
            einheiten.map((et) => {
              const total = et.warmup.length + et.haupteinheit.length + et.cooldown.length;
              return (
                <TouchableOpacity
                  key={et.id}
                  style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}
                  activeOpacity={0.75}
                  onPress={() => navigation.navigate('EinheitTemplateDetail', { einheitTemplateId: et.id })}
                >
                  <View style={s.cardStripe} />
                  <View style={s.cardBody}>
                    <View style={s.cardTop}>
                      <Text style={[s.cardName, { color: C.text }]} numberOfLines={1}>{et.name}</Text>
                      <TouchableOpacity
                        onPress={() => handleDeleteEinheit(et.id, et.name)}
                        style={s.deleteBtn}
                        activeOpacity={0.7}
                      >
                        <GBIcon name="trash" size={14} color={C.warn} />
                      </TouchableOpacity>
                    </View>
                    <View style={s.phasePills}>
                      <PhasePill label="Warm-up"   count={et.warmup.length}       color={PHASE_COLORS.warmup} />
                      <PhasePill label="Haupt"     count={et.haupteinheit.length}  color={PHASE_COLORS.haupteinheit} />
                      <PhasePill label="Cool-down" count={et.cooldown.length}      color={PHASE_COLORS.cooldown} />
                    </View>
                    <Text style={[s.cardTotal, { color: C.textDim }]}>
                      {total} {total === 1 ? 'Übung' : 'Übungen'} gesamt
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )
        )}

        {tab === 'uebungen' && (
          filteredUebungen.length === 0 ? (
            <View style={s.empty}>
              <GBIcon name="layers" size={44} color={C.textDim} />
              <Text style={[s.emptyTitle, { color: C.textSub }]}>Keine Übungen gefunden</Text>
              <Text style={[s.emptySub, { color: C.textDim }]}>
                {selectedMuskeln.size > 0
                  ? 'Kein Treffer für diese Muskelgruppe. Filter löschen?'
                  : 'Tippe auf + um eine neue Übung anzulegen.'}
              </Text>
            </View>
          ) : (
            filteredUebungen.map((ut) => (
              <TouchableOpacity
                key={ut.id}
                style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('UebungTemplateForm', { uebungTemplateId: ut.id })}
              >
                <View style={[s.cardStripe, { backgroundColor: '#7ABFFF' }]} />
                <View style={s.cardBody}>
                  <View style={s.cardTop}>
                    <View style={{ flex: 1, gap: 4 }}>
                      <Text style={[s.cardName, { color: C.text }]} numberOfLines={1}>{ut.name}</Text>
                      {ut.muskelgruppe && (
                        <View style={[s.muscleTag, { backgroundColor: 'rgba(122,191,255,0.12)' }]}>
                          <GBIcon name="body" size={10} color="#7ABFFF" />
                          <Text style={[s.muscleTagText, { color: '#7ABFFF' }]}>{ut.muskelgruppe}</Text>
                        </View>
                      )}
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteUebung(ut.id, ut.name)}
                      style={s.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <GBIcon name="trash" size={14} color={C.warn} />
                    </TouchableOpacity>
                  </View>
                  {ut.parameter.length > 0 && (
                    <Text style={[s.cardParams, { color: C.textMuted }]} numberOfLines={1}>
                      {buildSuffix(ut.parameter)}
                    </Text>
                  )}
                  {ut.beschreibung ? (
                    <Text style={[s.cardDesc, { color: C.textDim }]} numberOfLines={2}>{ut.beschreibung}</Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            ))
          )
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={[s.fab, { backgroundColor: C.accent, shadowColor: C.accent }]}
        onPress={() => {
          if (tab === 'einheiten') {
            navigation.navigate('EinheitTemplateDetail', {});
          } else {
            navigation.navigate('UebungTemplateForm', {});
          }
        }}
        activeOpacity={0.85}
      >
        <GBIcon name="plus" size={26} color={C.accentContrast} />
      </TouchableOpacity>
    </View>
  );
}

function PhasePill({ label, count, color }: { label: string; count: number; color: string }) {
  return (
    <View style={[pill.wrap, { backgroundColor: `${color}18` }]}>
      <View style={[pill.dot, { backgroundColor: color }]} />
      <Text style={[pill.label, { color }]}>{label}</Text>
      <Text style={[pill.count, { color }]}>{count}</Text>
    </View>
  );
}

const pill = StyleSheet.create({
  wrap:  { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.full },
  dot:   { width: 5, height: 5, borderRadius: 3 },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },
  count: { fontFamily: FONT_MONO, fontSize: 11, fontWeight: '800' },
});

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  topBar:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderBottomWidth: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: -0.4, color: C.text },

  segment: { flexDirection: 'row', marginHorizontal: SP.xl, marginTop: SP.lg, borderRadius: R.lg, borderWidth: 1, padding: 4, gap: 4 },
  segBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: SP.sm, borderRadius: R.md },
  segLabel: { fontSize: FONT.sm, fontWeight: '700', color: C.textMuted },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.md },

  filterCard:   { borderRadius: R.xl, borderWidth: 1, padding: SP.md, gap: SP.sm },
  filterHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  filterLabel:  { flex: 1, fontSize: FONT.xs, fontWeight: '600', letterSpacing: 0.5, textTransform: 'uppercase' },
  clearFilter:  { fontSize: FONT.xs, fontWeight: '700' },
  chipRow:      { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  muskelChip:   { borderWidth: 1, borderRadius: R.full, paddingHorizontal: 10, paddingVertical: 4 },
  muskelChipText: { fontSize: 12, fontWeight: '600' },

  card:       { flexDirection: 'row', borderRadius: R.xl, borderWidth: 1, overflow: 'hidden' },
  cardStripe: { width: 3, backgroundColor: C.accent },
  cardBody:   { flex: 1, padding: SP.lg, gap: SP.sm },
  cardTop:    { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm },
  cardName:   { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  deleteBtn:  { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,106,61,0.10)', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  phasePills: { flexDirection: 'row', gap: SP.sm, flexWrap: 'wrap' },
  cardTotal:  { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },
  cardParams: { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textMuted, fontWeight: '600' },
  cardDesc:   { fontSize: FONT.xs, color: C.textDim, lineHeight: 17 },
  muscleTag:  { flexDirection: 'row', alignItems: 'center', gap: 3, alignSelf: 'flex-start', borderRadius: R.full, paddingHorizontal: 6, paddingVertical: 2 },
  muscleTagText: { fontSize: 10, fontWeight: '700' },

  empty:      { alignItems: 'center', paddingVertical: 60, gap: SP.sm },
  emptyTitle: { fontSize: FONT.md, fontWeight: '700', color: C.textSub, marginTop: SP.sm },
  emptySub:   { fontSize: FONT.sm, color: C.textDim, textAlign: 'center', lineHeight: 20, paddingHorizontal: SP.xl },

  fab: {
    position: 'absolute', bottom: 24, right: SP.xl,
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
});
