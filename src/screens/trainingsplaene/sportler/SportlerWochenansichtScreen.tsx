import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList, PlanWoche, Wochentag } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useFeedbackStore } from '../../../store/feedbackStore';
import { useRoleStore } from '../../../store/roleStore';
import TopBar from '../../../components/TopBar';
import TypeChip from '../../../components/TypeChip';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO, getTypeColor } from '../../../theme';

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
      <View style={styles.root}>
        <TopBar title="Plan" leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Plan nicht gefunden.</Text>
        </View>
      </View>
    );
  }

  const selectedWoche = plan.wochen.find((w) => w.id === selectedWocheId);

  const doneCount = selectedWoche?.workouts.filter(
    (wo) => getFeedbackForWorkout(wo.id, currentUser.id)?.abgeschlossen,
  ).length ?? 0;

  return (
    <View style={styles.root}>
      <TopBar
        large
        subtitle={plan.ziel ?? 'Trainingsplan'}
        title={plan.name}
        leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
      />

      {/* Week chips (horizontal scroll) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.weekChipBar}
        contentContainerStyle={styles.weekChipBarContent}
      >
        {plan.wochen.map((w) => {
          const isCurrent = w.wochennummer === currentWeekNr;
          const isSelected = w.id === selectedWocheId;
          const wStart = addDays(plan.startdatum, (w.wochennummer - 1) * 7);
          const dateStr = wStart.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' });
          return (
            <TouchableOpacity
              key={w.id}
              style={[styles.weekChip, isSelected && styles.weekChipActive]}
              onPress={() => setSelectedWocheId(w.id)}
              activeOpacity={0.75}
            >
              {isCurrent && <View style={styles.weekChipDot} />}
              <Text style={[styles.weekChipNum, isSelected && styles.weekChipNumActive]}>
                W{w.wochennummer}
              </Text>
              <Text style={[styles.weekChipDate, isSelected && styles.weekChipDateActive]}>
                {dateStr}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {selectedWoche ? (
          <>
            {/* Week header */}
            <View style={styles.weekHeader}>
              <View>
                <Text style={styles.weekTitle}>
                  Woche {selectedWoche.wochennummer}
                  {selectedWoche.wochennummer === currentWeekNr ? '  ·  Aktuell' : ''}
                </Text>
                <Text style={styles.weekSub}>{selectedWoche.workouts.length} Workouts</Text>
              </View>
              <View style={styles.doneBox}>
                <Text style={styles.doneNum}>{doneCount}</Text>
                <Text style={styles.doneOf}>/{selectedWoche.workouts.length}</Text>
              </View>
            </View>

            {/* Week notes */}
            {!!selectedWoche.notizen && (
              <View style={styles.notizBanner}>
                <GBIcon name="bolt" size={14} color={C.accent} />
                <Text style={styles.notizText}>{selectedWoche.notizen}</Text>
              </View>
            )}

            {/* Workouts by day */}
            {TAGE.map((tag) => {
              const dayWorkouts = selectedWoche.workouts.filter((wo) => wo.wochentag === tag);
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
                        <TypeChip typ={wo.typ} />
                        <View style={styles.workoutInfo}>
                          <Text style={[styles.workoutName, done && styles.workoutNameDone]}>{wo.name}</Text>
                          <Text style={styles.workoutMeta}>{wo.uebungen.length} Übungen</Text>
                        </View>
                        {done ? (
                          <View style={styles.doneBadge}>
                            <GBIcon name="check" size={14} color={C.success} />
                          </View>
                        ) : (
                          <GBIcon name="chevronRight" size={18} color={C.textDim} />
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })}

            {selectedWoche.workouts.length === 0 && (
              <View style={styles.emptyWeek}>
                <GBIcon name="dumbbell" size={32} color={C.textDim} />
                <Text style={styles.emptyWeekText}>Keine Workouts in dieser Woche.</Text>
              </View>
            )}
          </>
        ) : null}
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted },

  weekChipBar: { flexGrow: 0, backgroundColor: C.surface, borderBottomWidth: 1, borderBottomColor: C.border },
  weekChipBarContent: { paddingHorizontal: SP.xl, paddingVertical: SP.sm, gap: SP.sm },
  weekChip: {
    alignItems: 'center', paddingHorizontal: SP.md, paddingVertical: SP.xs + 2,
    borderRadius: R.full, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.surface, minWidth: 56,
  },
  weekChipActive: { backgroundColor: C.accentLight, borderColor: C.accent },
  weekChipDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent, marginBottom: 2 },
  weekChipNum: { fontFamily: FONT_MONO, fontSize: FONT.sm, fontWeight: '700', color: C.textMuted },
  weekChipNumActive: { color: C.accent },
  weekChipDate: { fontSize: 10, color: C.textDim, marginTop: 1 },
  weekChipDateActive: { color: C.accent },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.md, gap: SP.md },

  weekHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  weekTitle: { fontSize: FONT.md, fontWeight: '700', color: C.text },
  weekSub: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  doneBox: { flexDirection: 'row', alignItems: 'baseline' },
  doneNum: { fontFamily: FONT_MONO, fontSize: 28, fontWeight: '700', color: C.accent },
  doneOf: { fontSize: FONT.base, color: C.textMuted, fontWeight: '600' },

  notizBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm,
    backgroundColor: C.accentLight, borderRadius: R.md,
    padding: SP.md, borderWidth: 1, borderColor: 'rgba(203,255,62,0.25)',
  },
  notizText: { flex: 1, fontSize: FONT.sm, color: C.accent, fontWeight: '500' },

  dayGroup: { gap: SP.xs },
  dayLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' },

  workoutCard: {
    flexDirection: 'row', alignItems: 'center', gap: SP.md,
    backgroundColor: C.surface, borderRadius: R.md, padding: SP.md,
    borderWidth: 1, borderColor: C.border,
  },
  workoutCardDone: { opacity: 0.6 },
  workoutInfo: { flex: 1 },
  workoutName: { fontSize: FONT.base, fontWeight: '600', color: C.text },
  workoutNameDone: { textDecorationLine: 'line-through', color: C.textMuted },
  workoutMeta: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  doneBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: C.successBg, alignItems: 'center', justifyContent: 'center',
  },

  emptyWeek: { alignItems: 'center', paddingVertical: SP.xxxl * 2, gap: SP.md },
  emptyWeekText: { fontSize: FONT.sm, color: C.textMuted },
});
