import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useRoleStore } from '../../../store/roleStore';
import TopBar from '../../../components/TopBar';
import GBAvatar from '../../../components/GBAvatar';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../../theme';

type Props = { navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerPlanList'> };

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <View style={[styles.statTile, accent && styles.statTileAccent]}>
      <Text style={[styles.statVal, accent && styles.statValAccent]}>{value}</Text>
      <Text style={[styles.statLabel, accent && styles.statLabelAccent]}>{label}</Text>
    </View>
  );
}

export default function TrainerPlanListScreen({ navigation }: Props) {
  const { plaene } = useTrainingsplanStore();
  const { currentUser, getUserById, getSportler } = useRoleStore();
  const [q, setQ] = useState('');

  const myPlans = plaene.filter((p) => p.trainerId === currentUser.id);
  const filtered = myPlans.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()));

  const totalWorkouts = myPlans.reduce((s, p) => s + p.wochen.reduce((a, w) => a + w.workouts.length, 0), 0);
  const sportlerIds = [...new Set(myPlans.map((p) => p.sportlerId))];

  return (
    <View style={styles.root}>
      <TopBar
        large
        subtitle="Trainer Dashboard"
        title={`Hi, ${currentUser.name.split(' ')[0]}.`}
        leading={<GBAvatar name={currentUser.name} initials={currentUser.initials} size={40} />}
        trailing={<IconBtn name="search" onPress={() => {}} />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <Stat label="Sportler" value={sportlerIds.length} accent />
          <Stat label="Pläne" value={myPlans.length} />
          <Stat label="Workouts" value={totalWorkouts} />
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <GBIcon name="search" size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Pläne durchsuchen…"
            placeholderTextColor={C.textMuted}
            autoCapitalize="none"
          />
        </View>

        {/* Section header */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>Aktive Pläne · {filtered.length}</Text>
          <Text style={styles.sectionAction}>Alle</Text>
        </View>

        {/* Plan cards */}
        {filtered.map((p) => {
          const sp = getUserById(p.sportlerId);
          const woCount = p.wochen.reduce((a, w) => a + w.workouts.length, 0);
          return (
            <TouchableOpacity
              key={p.id}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('TrainerPlanForm', { planId: p.id })}
            >
              <View style={styles.cardStripe} />
              <View style={styles.cardInner}>
                <View style={styles.cardTop}>
                  <View style={styles.cardTopLeft}>
                    {p.ziel ? <Text style={styles.cardGoal}>{p.ziel}</Text> : null}
                    <Text style={styles.cardName}>{p.name}</Text>
                  </View>
                  <IconBtn name="edit" size={32} onPress={() => navigation.navigate('TrainerPlanForm', { planId: p.id })} />
                </View>

                <View style={styles.cardBottom}>
                  {sp && (
                    <View style={styles.sportlerRow}>
                      <GBAvatar name={sp.name} initials={sp.initials} size={32} />
                      <View>
                        <Text style={styles.sportlerName}>{sp.name}</Text>
                        <Text style={styles.sportlerSub}>{sp.alter ? `${sp.alter} J · ` : ''}{sp.ziel}</Text>
                      </View>
                    </View>
                  )}
                  <View style={styles.cardMeta}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaVal}>{p.wochen.length}</Text>
                      <Text style={styles.metaLabel}>Wochen</Text>
                    </View>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaVal}>{woCount}</Text>
                      <Text style={styles.metaLabel}>Workouts</Text>
                    </View>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <GBIcon name="dumbbell" size={36} color={C.textDim} />
            <Text style={styles.emptyText}>Noch keine Pläne erstellt.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TrainerPlanForm', {})}
        activeOpacity={0.85}
      >
        <GBIcon name="plus" size={24} color={C.accentContrast} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.md },

  statsRow: { flexDirection: 'row', gap: SP.sm },
  statTile: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, borderWidth: 1, borderColor: C.border },
  statTileAccent: { backgroundColor: C.accent },
  statVal: { fontFamily: FONT_MONO, fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -1 },
  statValAccent: { color: C.accentContrast },
  statLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  statLabelAccent: { color: `${C.accentContrast}99` },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.surface, borderRadius: R.md, padding: SP.md, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, fontSize: FONT.base },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },
  sectionAction: { fontSize: FONT.sm, color: C.accent, fontWeight: '600' },

  card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardStripe: { width: 3, backgroundColor: C.accent },
  cardInner: { flex: 1, padding: SP.lg, gap: SP.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardTopLeft: { flex: 1, gap: 4, marginRight: SP.sm },
  cardGoal: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  cardName: { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4, lineHeight: 24 },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sportlerRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  sportlerName: { fontSize: FONT.sm, fontWeight: '600', color: C.text },
  sportlerSub: { fontSize: FONT.xs, color: C.textMuted },
  cardMeta: { flexDirection: 'row', gap: SP.lg },
  metaItem: { alignItems: 'flex-end' },
  metaVal: { fontFamily: FONT_MONO, fontSize: 18, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  metaLabel: { fontSize: 10, color: C.textMuted, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },

  empty: { alignItems: 'center', paddingVertical: 48, gap: SP.md },
  emptyText: { fontSize: FONT.base, color: C.textMuted },

  fab: {
    position: 'absolute', bottom: 100, right: SP.xl,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 8,
  },
});
