import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useRoleStore } from '../../../store/roleStore';
import { useFeedbackStore } from '../../../store/feedbackStore';
import TopBar from '../../../components/TopBar';
import GBAvatar from '../../../components/GBAvatar';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'SportlerPlanList'>;
};

export default function SportlerPlanListScreen({ navigation }: Props) {
  const { currentUser, getUserById } = useRoleStore();
  const { plaene } = useTrainingsplanStore();
  const { getFeedbacksBySpotler } = useFeedbackStore();

  const myPlans = plaene.filter((p) => p.sportlerId === currentUser.id);
  const feedbacks = getFeedbacksBySpotler(currentUser.id);
  const abgeschlossen = feedbacks.filter((f) => f.abgeschlossen).length;
  const totalWorkouts = myPlans.reduce((acc, p) => acc + p.wochen.reduce((a, w) => a + w.workouts.length, 0), 0);

  return (
    <View style={styles.root}>
      <TopBar
        large
        subtitle="Sportler-Bereich"
        title={`Hi, ${currentUser.name.split(' ')[0]}.`}
        leading={<GBAvatar name={currentUser.name} initials={currentUser.initials} size={40} />}
        trailing={<IconBtn name="settings" onPress={() => {}} />}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Stats row */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statTileAccent]}>
            <Text style={[styles.statVal, styles.statValAccent]}>{myPlans.length}</Text>
            <Text style={[styles.statLabel, styles.statLabelAccent]}>Pläne</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statVal}>{totalWorkouts}</Text>
            <Text style={styles.statLabel}>Workouts</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={[styles.statVal, { color: C.success }]}>{abgeschlossen}</Text>
            <Text style={styles.statLabel}>Erledigt</Text>
          </View>
        </View>

        {/* Plans */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>Meine Pläne · {myPlans.length}</Text>
        </View>

        {myPlans.map((plan) => {
          const trainer = getUserById(plan.trainerId);
          const workoutCount = plan.wochen.reduce((a, w) => a + w.workouts.length, 0);

          const today = new Date();
          const start = new Date(plan.startdatum);
          const daysIn = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
          const currentWeek = Math.min(Math.ceil((daysIn + 1) / 7), Math.max(plan.wochen.length, 1));
          const progress = plan.wochen.length > 0 ? currentWeek / plan.wochen.length : 0;
          const progressPct = Math.round(progress * 100);

          return (
            <TouchableOpacity
              key={plan.id}
              style={styles.heroCard}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('SportlerWochenansicht', { planId: plan.id })}
            >
              {/* Goal + name */}
              {plan.ziel ? <Text style={styles.heroGoal}>{plan.ziel}</Text> : null}
              <Text style={styles.heroName}>{plan.name}</Text>

              {/* Trainer attribution */}
              {trainer && (
                <View style={styles.trainerRow}>
                  <GBAvatar name={trainer.name} initials={trainer.initials} size={24} />
                  <Text style={styles.trainerText}>{trainer.name}</Text>
                </View>
              )}

              {/* Stats */}
              <View style={styles.heroStats}>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{plan.wochen.length}</Text>
                  <Text style={styles.heroStatLabel}>Wochen</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{workoutCount}</Text>
                  <Text style={styles.heroStatLabel}>Workouts</Text>
                </View>
                <View style={styles.heroStat}>
                  <Text style={styles.heroStatVal}>{currentWeek}</Text>
                  <Text style={styles.heroStatLabel}>Akt. Woche</Text>
                </View>
              </View>

              {/* Progress bar */}
              <View>
                <View style={styles.progressBar}>
                  <View style={[styles.progressFill, { width: `${progressPct}%` as `${number}%` }]} />
                </View>
                <Text style={styles.progressLabel}>{progressPct}% abgeschlossen</Text>
              </View>

              {/* CTA */}
              <View style={styles.ctaRow}>
                <GBIcon name="bolt" size={14} color={C.accentContrast} />
                <Text style={styles.ctaText}>Diese Woche starten</Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {myPlans.length === 0 && (
          <View style={styles.empty}>
            <GBIcon name="dumbbell" size={36} color={C.textDim} />
            <Text style={styles.emptyText}>Kein Plan zugewiesen.</Text>
            <Text style={styles.emptySub}>Dein Trainer hat dir noch keinen Trainingsplan zugewiesen.</Text>
          </View>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
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

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },

  heroCard: {
    backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border,
    padding: SP.xl, gap: SP.md, overflow: 'hidden',
  },
  heroGoal: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', letterSpacing: 0.6, textTransform: 'uppercase' },
  heroName: { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5, lineHeight: 28 },

  trainerRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  trainerText: { fontSize: FONT.sm, color: C.textMuted, fontWeight: '500' },

  heroStats: { flexDirection: 'row', gap: SP.xl },
  heroStat: { gap: 2 },
  heroStatVal: { fontFamily: FONT_MONO, fontSize: 20, fontWeight: '700', color: C.text },
  heroStatLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', letterSpacing: 0.4 },

  progressBar: { height: 4, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: R.full },
  progressLabel: { fontSize: FONT.xs, color: C.textMuted, marginTop: SP.xs },

  ctaRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SP.sm, backgroundColor: C.accent, borderRadius: R.full,
    paddingVertical: SP.sm + 2, marginTop: SP.xs,
  },
  ctaText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  empty: { alignItems: 'center', paddingVertical: 60, gap: SP.md },
  emptyText: { fontSize: FONT.md, fontWeight: '700', color: C.text },
  emptySub: { fontSize: FONT.sm, color: C.textMuted, textAlign: 'center', paddingHorizontal: SP.xl },
});
