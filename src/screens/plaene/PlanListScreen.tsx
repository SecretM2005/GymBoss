import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaeneStackParamList } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useAthletenStore } from '../../store/athletenStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = { navigation: StackNavigationProp<PlaeneStackParamList, 'PlanList'> };

const SPORTART_COLORS: Record<string, { bg: string; fg: string; dot: string; stripe: string }> = {
  'Kraftsport':      { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E', dot: '#CBFF3E', stripe: '#CBFF3E' },
  'Kampfsport':      { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66', dot: '#FF6A3D', stripe: '#FF6A3D' },
  'Leichtathletik':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF', stripe: '#7ABFFF' },
  'Konditionierung': { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF', stripe: '#7ABFFF' },
  'Mobility':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF', dot: '#C39CFF', stripe: '#C39CFF' },
  'Crossfit':        { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582', dot: '#7AE582', stripe: '#7AE582' },
};

function SportartChip({ sportart }: { sportart?: string }) {
  if (!sportart) return null;
  const c = SPORTART_COLORS[sportart] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textDim };
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: c.dot }]} />
      <Text style={[styles.chipText, { color: c.fg }]}>{sportart}</Text>
    </View>
  );
}

export default function PlanListScreen({ navigation }: Props) {
  const { plaene } = usePlanStore();
  const { sportler } = useAthletenStore();
  const [q, setQ] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = plaene.filter((p) =>
    p.name.toLowerCase().includes(q.toLowerCase()) ||
    (p.sportart ?? '').toLowerCase().includes(q.toLowerCase())
  );

  const totalWochen = plaene.reduce((sum, p) => sum + p.wochen.length, 0);
  const sportlerMitPlan = new Set(plaene.flatMap((p) => p.sportlerIds)).size;

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topSub}>Trainer · Verwaltung</Text>
          <Text style={styles.topTitle}>Trainingspläne</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statAccent]}>
            <Text style={[styles.statVal, styles.statValAccent]}>{plaene.length}</Text>
            <Text style={[styles.statLabel, styles.statLabelAccent]}>Pläne</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statVal}>{sportlerMitPlan}</Text>
            <Text style={styles.statLabel}>Sportler</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statVal}>{totalWochen}</Text>
            <Text style={styles.statLabel}>Wochen</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <GBIcon name="search" size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Pläne suchen…"
            placeholderTextColor={C.textDim}
            autoCapitalize="none"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')} activeOpacity={0.7}>
              <GBIcon name="close" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section header */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>Alle Pläne · {filtered.length}</Text>
        </View>

        {/* Cards */}
        {filtered.map((plan) => {
          const sc = SPORTART_COLORS[plan.sportart ?? ''] ?? { stripe: C.accent };
          const assignedSportler = sportler.filter((s) => plan.sportlerIds.includes(s.id));
          return (
            <TouchableOpacity
              key={plan.id}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('PlanDetail', { planId: plan.id })}
            >
              <View style={[styles.cardStripe, { backgroundColor: sc.stripe }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName} numberOfLines={1}>{plan.name}</Text>
                  <SportartChip sportart={plan.sportart} />
                </View>
                {plan.beschreibung ? (
                  <Text style={styles.cardDesc} numberOfLines={1}>{plan.beschreibung}</Text>
                ) : null}
                <View style={styles.cardBottom}>
                  <View style={styles.avatarRow}>
                    {assignedSportler.slice(0, 4).map((sp, i) => (
                      <View key={sp.id} style={[styles.avatarWrap, { marginLeft: i === 0 ? 0 : -8 }]}>
                        <GBAvatar name={sp.name} initials={sp.initials} size={26} />
                      </View>
                    ))}
                    {assignedSportler.length === 0 && (
                      <Text style={styles.noSportler}>Kein Sportler zugewiesen</Text>
                    )}
                  </View>
                  <View style={styles.wochenBadge}>
                    <GBIcon name="layers" size={12} color={C.textMuted} />
                    <Text style={styles.wochenText}>
                      {plan.wochen.length} {plan.wochen.length === 1 ? 'Woche' : 'Wochen'}
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <GBIcon name="dumbbell" size={44} color={C.textDim} />
            <Text style={styles.emptyTitle}>
              {q ? 'Kein Treffer' : 'Noch keine Pläne'}
            </Text>
            <Text style={styles.emptySub}>
              {q
                ? `Keine Übereinstimmung für „${q}"`
                : 'Tippe auf + um den ersten Trainingsplan zu erstellen.'}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PlanForm', {})}
        activeOpacity={0.85}
      >
        <GBIcon name="plus" size={26} color={C.accentContrast} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar:   { paddingHorizontal: SP.xl, paddingBottom: SP.md, paddingTop: SP.md },
  topSub:   { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 4 },
  topTitle: { fontSize: 32, fontWeight: '700', color: C.text, letterSpacing: -0.8, lineHeight: 36 },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.md },

  statsRow:        { flexDirection: 'row', gap: SP.sm },
  statTile:        { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, borderWidth: 1, borderColor: C.border },
  statAccent:      { backgroundColor: C.accent },
  statVal:         { fontFamily: FONT_MONO, fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -1 },
  statValAccent:   { color: C.accentContrast },
  statLabel:       { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  statLabelAccent: { color: `${C.accentContrast}99` },

  searchBox:   { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: 13, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, fontSize: FONT.base },

  sectionHead:  { paddingVertical: 2 },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },

  card:       { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardStripe: { width: 3 },
  cardBody:   { flex: 1, padding: SP.lg, gap: SP.sm },
  cardTop:    { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  cardName:   { flex: 1, fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  cardDesc:   { fontSize: FONT.sm, color: C.textSub },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2 },

  avatarRow:   { flexDirection: 'row', alignItems: 'center' },
  avatarWrap:  { borderRadius: 13, borderWidth: 1.5, borderColor: C.bg },
  noSportler:  { fontSize: FONT.xs, color: C.textDim, fontStyle: 'italic' },

  wochenBadge: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  wochenText:  { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textMuted, fontWeight: '600' },

  chip:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  chipDot:  { width: 5, height: 5, borderRadius: 3 },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },

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
