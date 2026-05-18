import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList, PlanWoche, Wochentag } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useFeedbackStore } from '../../../store/feedbackStore';
import { useRoleStore } from '../../../store/roleStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'SportlerWochenansicht'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'SportlerWochenansicht'>;
};

const TAGE: Wochentag[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function addDays(isoDate: string, days: number): Date {
  const d = new Date(isoDate);
  d.setDate(d.getDate() + days);
  return d;
}

function formatShort(d: Date) {
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
}

export default function SportlerWochenansichtScreen({ navigation, route }: Props) {
  const { planId } = route.params;
  const { getPlanById } = useTrainingsplanStore();
  const { getFeedbackForWorkout } = useFeedbackStore();
  const { currentUser } = useRoleStore();

  const plan = getPlanById(planId);

  const today = new Date();
  const start = plan ? new Date(plan.startdatum) : today;
  const daysIn = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
  const currentWeekNr = plan ? Math.min(Math.ceil((daysIn + 1) / 7), plan.wochen.length) : 1;

  const [selectedWocheId, setSelectedWocheId] = useState<string>(
    plan?.wochen.find((w) => w.wochennummer === currentWeekNr)?.id ?? plan?.wochen[0]?.id ?? '',
  );

  if (!plan) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Plan nicht gefunden.</Text>
      </View>
    );
  }

  const selectedWoche = plan.wochen.find((w) => w.id === selectedWocheId);

  const wocheStartDate = (woche: PlanWoche) =>
    addDays(plan.startdatum, (woche.wochennummer - 1) * 7);

  const doneCount = selectedWoche?.workouts.filter(
    (wo) => getFeedbackForWorkout(wo.id, currentUser.id)?.abgeschlossen,
  ).length ?? 0;

  return (
    <View style={styles.container}>
      {/* Plan header */}
      <View style={styles.planHeader}>
        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.planSub}>{plan.wochen.length} Wochen · Start {new Date(plan.startdatum).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}</Text>
      </View>

      {/* Week tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekTabs}
        contentContainerStyle={styles.weekTabsContent}
      >
        {plan.wochen.map((w) => {
          const wStart = wocheStartDate(w);
          const wEnd = addDays(plan.startdatum, w.wochennummer * 7 - 1);
          const isCurrent = w.wochennummer === currentWeekNr;
          const isSelected = w.id === selectedWocheId;
          return (
            <TouchableOpacity
              key={w.id}
              style={[styles.weekTab, isSelected && styles.weekTabActive, isCurrent && !isSelected && styles.weekTabCurrent]}
              onPress={() => setSelectedWocheId(w.id)}
            >
              <Text style={[styles.weekTabNum, isSelected && styles.weekTabNumActive]}>
                {isCurrent ? '● ' : ''}{w.wochennummer}
              </Text>
              <Text style={[styles.weekTabDate, isSelected && styles.weekTabDateActive]}>
                {formatShort(wStart)}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected week detail */}
      <ScrollView contentContainerStyle={styles.weekContent}>
        {selectedWoche && (
          <>
            {/* Week summary */}
            <View style={styles.weekSummary}>
              <View>
                <Text style={styles.weekSummaryTitle}>
                  Woche {selectedWoche.wochennummer}
                  {selectedWoche.wochennummer === currentWeekNr ? ' (Aktuell)' : ''}
                </Text>
                <Text style={styles.weekSummarySub}>
                  {formatShort(wocheStartDate(selectedWoche))} – {formatShort(addDays(plan.startdatum, selectedWoche.wochennummer * 7 - 1))}
                </Text>
              </View>
              <View style={styles.doneCircle}>
                <Text style={styles.doneNum}>{doneCount}</Text>
                <Text style={styles.doneOf}>/{selectedWoche.workouts.length}</Text>
              </View>
            </View>

            {selectedWoche.notizen ? (
              <View style={styles.notizCard}>
                <Text style={styles.notizIcon}>📝</Text>
                <Text style={styles.notizText}>{selectedWoche.notizen}</Text>
              </View>
            ) : null}

            {/* Workouts by day */}
            {TAGE.map((tag) => {
              const dayWorkouts = (selectedWoche.workouts ?? []).filter((wo) => wo.wochentag === tag);
              if (dayWorkouts.length === 0) return null;
              return (
                <View key={tag} style={styles.dayGroup}>
                  <Text style={styles.dayLabel}>{tag}</Text>
                  {dayWorkouts.map((wo) => {
                    const fb = getFeedbackForWorkout(wo.id, currentUser.id);
                    const done = fb?.abgeschlossen ?? false;
                    return (
                      <TouchableOpacity
                        key={wo.id}
                        style={[styles.workoutCard, done && styles.workoutCardDone]}
                        activeOpacity={0.75}
                        onPress={() => navigation.navigate('SportlerWorkoutDetail', { planId, wocheId: selectedWoche.id, workoutId: wo.id })}
                      >
                        {done && <View style={styles.doneStripe} />}
                        <View style={styles.workoutInfo}>
                          <Text style={[styles.workoutName, done && styles.workoutNameDone]}>{wo.name}</Text>
                          <Text style={styles.workoutMeta}>{wo.typ} · {wo.uebungen.length} Übungen</Text>
                        </View>
                        {done ? (
                          <View style={styles.doneBadge}>
                            <Text style={styles.doneBadgeText}>✓</Text>
                          </View>
                        ) : (
                          <Text style={styles.workoutChevron}>›</Text>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            {selectedWoche.workouts.length === 0 && (
              <View style={styles.emptyWeek}>
                <Text style={styles.emptyWeekIcon}>🗓️</Text>
                <Text style={styles.emptyWeekText}>Keine Workouts in dieser Woche.</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted },

  planHeader: { backgroundColor: C.primary, paddingHorizontal: SP.lg, paddingTop: SP.md, paddingBottom: SP.sm },
  planName: { fontSize: FONT.md, fontWeight: '800', color: C.white },
  planSub: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  weekTabs: { backgroundColor: C.primary, flexGrow: 0 },
  weekTabsContent: { paddingHorizontal: SP.md, paddingBottom: SP.md, gap: SP.sm },
  weekTab: { paddingHorizontal: SP.md, paddingVertical: SP.sm, borderRadius: R.md, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', minWidth: 60 },
  weekTabActive: { backgroundColor: C.accent },
  weekTabCurrent: { backgroundColor: 'rgba(255,255,255,0.25)' },
  weekTabNum: { fontWeight: '800', fontSize: FONT.md, color: 'rgba(255,255,255,0.7)' },
  weekTabNumActive: { color: C.white },
  weekTabDate: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  weekTabDateActive: { color: C.white },

  weekContent: { padding: SP.md, gap: SP.md, paddingBottom: SP.xxxl },

  weekSummary: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOW_SM },
  weekSummaryTitle: { fontWeight: '800', fontSize: FONT.base, color: C.text },
  weekSummarySub: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  doneCircle: { flexDirection: 'row', alignItems: 'baseline' },
  doneNum: { fontSize: FONT.xl, fontWeight: '800', color: C.accent },
  doneOf: { fontSize: FONT.base, color: C.textMuted, fontWeight: '600' },

  notizCard: { backgroundColor: C.warningBg, borderRadius: R.md, padding: SP.md, flexDirection: 'row', gap: SP.sm, alignItems: 'flex-start' },
  notizIcon: { fontSize: 16 },
  notizText: { flex: 1, fontSize: FONT.sm, color: C.warning, fontWeight: '500' },

  dayGroup: { gap: SP.sm },
  dayLabel: { fontWeight: '700', fontSize: FONT.sm, color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },

  workoutCard: { backgroundColor: C.card, borderRadius: R.md, flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, ...SHADOW_SM },
  workoutCardDone: { opacity: 0.7 },
  doneStripe: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, backgroundColor: C.success, borderTopLeftRadius: R.md, borderBottomLeftRadius: R.md },
  workoutInfo: { flex: 1, paddingLeft: SP.xs },
  workoutName: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  workoutNameDone: { textDecorationLine: 'line-through', color: C.textMuted },
  workoutMeta: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  doneBadge: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.successBg, alignItems: 'center', justifyContent: 'center' },
  doneBadgeText: { color: C.success, fontWeight: '800', fontSize: FONT.sm },
  workoutChevron: { fontSize: 22, color: C.textMuted },

  emptyWeek: { alignItems: 'center', paddingVertical: SP.xxxl, gap: SP.sm },
  emptyWeekIcon: { fontSize: 36 },
  emptyWeekText: { fontSize: FONT.sm, color: C.textMuted },
});
