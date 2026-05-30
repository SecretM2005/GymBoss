import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaeneStackParamList } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { GBIcon } from '../../components/GBIcon';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'PlanWocheDetail'>;
  route: RouteProp<PlaeneStackParamList, 'PlanWocheDetail'>;
};

const PHASE_COLORS = {
  warmup:       '#FF8A66',
  haupteinheit: '#CBFF3E',
  cooldown:     '#7ABFFF',
};

export default function PlanWocheDetailScreen({ navigation, route }: Props) {
  const C = useColors();
  const { planId, wocheId } = route.params;
  const { getPlanById, deleteEinheit } = usePlanStore();
  const insets = useSafeAreaInsets();

  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);

  if (!plan || !woche) {
    navigation.goBack();
    return null;
  }

  const handleDelete = (einheitId: string, name: string) => {
    Alert.alert('Einheit löschen', `„${name}" wirklich entfernen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteEinheit(planId, wocheId, einheitId) },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
          <GBIcon name="chevronLeft" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={styles.topCenter}>
          <Text style={[styles.topSub, { color: C.textMuted }]}>{plan.name}</Text>
          <Text style={[styles.topTitle, { color: C.text }]}>Woche {woche.wochennummer}</Text>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate('PlanWocheForm', { planId, wocheId })}
          style={styles.iconBtn}
          activeOpacity={0.7}
        >
          <GBIcon name="edit" size={18} color={C.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* Week info */}
        {woche.notizen ? (
          <View style={styles.notizBox}>
            <GBIcon name="bolt" size={13} color={C.accent} />
            <Text style={[styles.notizText, { color: C.textSub }]}>{woche.notizen}</Text>
          </View>
        ) : null}

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statAccent]}>
            <Text style={[styles.statVal, styles.statValAccent]}>{woche.einheiten.length}</Text>
            <Text style={[styles.statLabel, styles.statLabelAccent]}>Einheiten</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.statVal, { color: C.text }]}>
              {woche.einheiten.reduce((s, e) => s + e.warmup.length + e.haupteinheit.length + e.cooldown.length, 0)}
            </Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Übungen</Text>
          </View>
          <View style={[styles.statTile, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.statVal, { color: C.text }]}>{woche.wochennummer}</Text>
            <Text style={[styles.statLabel, { color: C.textMuted }]}>Woche</Text>
          </View>
        </View>

        {/* Section header */}
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionLabel, { color: C.textMuted }]}>Trainingseinheiten</Text>
        </View>

        {/* Einheit cards */}
        {woche.einheiten.length === 0 ? (
          <View style={styles.empty}>
            <GBIcon name="dumbbell" size={44} color={C.textDim} />
            <Text style={[styles.emptyTitle, { color: C.textSub }]}>Noch keine Einheiten</Text>
            <Text style={[styles.emptySub, { color: C.textDim }]}>Tippe auf + um die erste Trainingseinheit hinzuzufügen.</Text>
          </View>
        ) : (
          woche.einheiten.map((einheit) => {
            const total = einheit.warmup.length + einheit.haupteinheit.length + einheit.cooldown.length;
            return (
              <TouchableOpacity
                key={einheit.id}
                style={[styles.card, { backgroundColor: C.surface, borderColor: C.border }]}
                activeOpacity={0.75}
                onPress={() => navigation.navigate('EinheitDetail', { planId, wocheId, einheitId: einheit.id })}
              >
                <View style={styles.cardStripe} />
                <View style={styles.cardBody}>
                  <View style={styles.cardTop}>
                    <Text style={[styles.cardName, { color: C.text }]} numberOfLines={1}>{einheit.name}</Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(einheit.id, einheit.name)}
                      style={styles.deleteBtn}
                      activeOpacity={0.7}
                    >
                      <GBIcon name="trash" size={15} color={C.warn} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.phasePills}>
                    <PhasePill label="Warm-up" count={einheit.warmup.length} color={PHASE_COLORS.warmup} />
                    <PhasePill label="Haupt"   count={einheit.haupteinheit.length} color={PHASE_COLORS.haupteinheit} />
                    <PhasePill label="Cool-down" count={einheit.cooldown.length} color={PHASE_COLORS.cooldown} />
                  </View>
                  <Text style={[styles.cardTotal, { color: C.textDim }]}>
                    {total} {total === 1 ? 'Übung' : 'Übungen'} gesamt
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('EinheitDetail', { planId, wocheId })}
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

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar:    { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.md, gap: SP.sm },
  iconBtn:   { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topCenter: { flex: 1, paddingHorizontal: SP.sm },
  topSub:    { fontSize: 11, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle:  { fontSize: 22, fontWeight: '700', color: C.text, letterSpacing: -0.4 },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.md },

  notizBox: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, backgroundColor: 'rgba(203,255,62,0.06)', borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(203,255,62,0.15)', padding: SP.md },
  notizText: { flex: 1, fontSize: FONT.sm, color: C.textSub, lineHeight: 20 },

  statsRow:        { flexDirection: 'row', gap: SP.sm },
  statTile:        { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, borderWidth: 1, borderColor: C.border },
  statAccent:      { backgroundColor: C.accent },
  statVal:         { fontFamily: FONT_MONO, fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -1 },
  statValAccent:   { color: C.accentContrast },
  statLabel:       { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  statLabelAccent: { color: `${C.accentContrast}99` },

  sectionHead:  { paddingVertical: 2 },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },

  card:      { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardStripe: { width: 3, backgroundColor: C.accent },
  cardBody:  { flex: 1, padding: SP.lg, gap: SP.sm },
  cardTop:   { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  cardName:  { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  deleteBtn: { width: 32, height: 32, borderRadius: 16, backgroundColor: 'rgba(255,106,61,0.10)', alignItems: 'center', justifyContent: 'center' },
  phasePills: { flexDirection: 'row', gap: SP.sm, flexWrap: 'wrap' },
  cardTotal: { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },

  empty:      { alignItems: 'center', paddingVertical: 60, gap: SP.sm },
  emptyTitle: { fontSize: FONT.md, fontWeight: '700', color: C.textSub, marginTop: SP.sm },
  emptySub:   { fontSize: FONT.sm, color: C.textDim, textAlign: 'center', lineHeight: 20, paddingHorizontal: SP.xl },

  fab: {
    position: 'absolute', bottom: 24, right: SP.xl,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
});
