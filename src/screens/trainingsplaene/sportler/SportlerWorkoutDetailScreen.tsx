import React, { useLayoutEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useFeedbackStore } from '../../../store/feedbackStore';
import { useRoleStore } from '../../../store/roleStore';
import { C, SP, R, FONT, SHADOW_SM, SHADOW_MD } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'SportlerWorkoutDetail'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'SportlerWorkoutDetail'>;
};

export default function SportlerWorkoutDetailScreen({ navigation, route }: Props) {
  const { planId, wocheId, workoutId } = route.params;
  const { getPlanById } = useTrainingsplanStore();
  const { getFeedbackForWorkout } = useFeedbackStore();
  const { currentUser } = useRoleStore();

  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);
  const workout = woche?.workouts.find((wo) => wo.id === workoutId);
  const feedback = getFeedbackForWorkout(workoutId, currentUser.id);

  useLayoutEffect(() => {
    navigation.setOptions({ title: workout?.name ?? 'Workout' });
  }, [navigation, workout?.name]);

  if (!workout) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Workout nicht gefunden.</Text>
      </View>
    );
  }

  const totalSaetze = workout.uebungen.reduce((acc, u) => acc + u.saetze, 0);
  const estDauer = workout.uebungen.reduce((acc, u) => acc + (u.saetze * (u.pause + 45)), 0);
  const estMin = Math.round(estDauer / 60);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTop}>
          <View>
            <Text style={styles.heroName}>{workout.name}</Text>
            <Text style={styles.heroTyp}>{workout.typ} · {workout.wochentag}</Text>
          </View>
          {feedback?.abgeschlossen && (
            <View style={styles.doneBadge}>
              <Text style={styles.doneBadgeText}>✓ Erledigt</Text>
            </View>
          )}
        </View>
        <View style={styles.heroStats}>
          <View style={styles.heroStat}>
            <Text style={styles.heroStatVal}>{workout.uebungen.length}</Text>
            <Text style={styles.heroStatLabel}>Übungen</Text>
          </View>
          <View style={[styles.heroStat, styles.heroStatDivider]}>
            <Text style={styles.heroStatVal}>{totalSaetze}</Text>
            <Text style={styles.heroStatLabel}>Sätze</Text>
          </View>
          <View style={[styles.heroStat, styles.heroStatDivider]}>
            <Text style={styles.heroStatVal}>~{estMin}'</Text>
            <Text style={styles.heroStatLabel}>Est. Dauer</Text>
          </View>
        </View>
      </View>

      {/* Exercises */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Übungen</Text>
        {workout.uebungen.map((u, i) => (
          <View key={u.id} style={styles.uebungCard}>
            <View style={styles.uebungHeader}>
              <View style={styles.uebungNum}>
                <Text style={styles.uebungNumText}>{i + 1}</Text>
              </View>
              <Text style={styles.uebungName}>{u.name}</Text>
            </View>

            <View style={styles.uebungStats}>
              <View style={styles.uebungStat}>
                <Text style={styles.uebungStatVal}>{u.saetze}</Text>
                <Text style={styles.uebungStatLabel}>Sätze</Text>
              </View>
              <View style={[styles.uebungStat, styles.uebungStatDivider]}>
                <Text style={styles.uebungStatVal}>{u.wiederholungen}</Text>
                <Text style={styles.uebungStatLabel}>Wdh.</Text>
              </View>
              {u.gewicht !== undefined && (
                <View style={[styles.uebungStat, styles.uebungStatDivider]}>
                  <Text style={styles.uebungStatVal}>{u.gewicht} kg</Text>
                  <Text style={styles.uebungStatLabel}>Gewicht</Text>
                </View>
              )}
              <View style={[styles.uebungStat, styles.uebungStatDivider]}>
                <Text style={styles.uebungStatVal}>{u.pause}s</Text>
                <Text style={styles.uebungStatLabel}>Pause</Text>
              </View>
            </View>

            {u.notizen ? (
              <View style={styles.uebungNotiz}>
                <Text style={styles.uebungNotizText}>💡 {u.notizen}</Text>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {/* Feedback section */}
      {feedback ? (
        <View style={styles.feedbackCard}>
          <Text style={styles.feedbackTitle}>Dein Feedback</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <Text key={s} style={[styles.star, s <= feedback.bewertung && styles.starActive]}>★</Text>
            ))}
          </View>
          <View style={styles.feedbackMeta}>
            <View style={styles.rpeBadge}>
              <Text style={styles.rpeLabel}>RPE</Text>
              <Text style={styles.rpeVal}>{feedback.rpe}/10</Text>
            </View>
            {feedback.notiz ? <Text style={styles.feedbackNotiz}>{feedback.notiz}</Text> : null}
          </View>
          <TouchableOpacity
            style={styles.editFeedbackBtn}
            onPress={() => navigation.navigate('SportlerFeedback', { planId, wocheId, workoutId })}
          >
            <Text style={styles.editFeedbackBtnText}>Feedback bearbeiten</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.feedbackBtn}
          onPress={() => navigation.navigate('SportlerFeedback', { planId, wocheId, workoutId })}
        >
          <Text style={styles.feedbackBtnText}>⭐  Workout abschließen & Feedback geben</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted },

  hero: { backgroundColor: C.primary, borderRadius: R.lg, padding: SP.lg, gap: SP.md, ...SHADOW_MD },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroName: { fontSize: FONT.lg, fontWeight: '800', color: C.white },
  heroTyp: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  doneBadge: { backgroundColor: C.successBg, borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.xs },
  doneBadgeText: { color: C.success, fontWeight: '700', fontSize: FONT.sm },
  heroStats: { flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: R.md },
  heroStat: { flex: 1, alignItems: 'center', paddingVertical: SP.md },
  heroStatDivider: { borderLeftWidth: 1, borderLeftColor: 'rgba(255,255,255,0.15)' },
  heroStatVal: { fontWeight: '800', fontSize: FONT.md, color: C.white },
  heroStatLabel: { fontSize: FONT.xs, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.md, ...SHADOW_SM },
  sectionTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },

  uebungCard: { backgroundColor: C.bg, borderRadius: R.md, padding: SP.md, gap: SP.sm },
  uebungHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  uebungNum: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' },
  uebungNumText: { color: C.white, fontWeight: '700', fontSize: FONT.sm },
  uebungName: { fontWeight: '700', fontSize: FONT.base, color: C.text, flex: 1 },
  uebungStats: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.sm, overflow: 'hidden' },
  uebungStat: { flex: 1, alignItems: 'center', paddingVertical: SP.sm },
  uebungStatDivider: { borderLeftWidth: 1, borderLeftColor: C.border },
  uebungStatVal: { fontWeight: '700', fontSize: FONT.sm, color: C.primary },
  uebungStatLabel: { fontSize: FONT.xs, color: C.textMuted, marginTop: 1 },
  uebungNotiz: { backgroundColor: C.warningBg, borderRadius: R.sm, padding: SP.sm },
  uebungNotizText: { fontSize: FONT.xs, color: C.warning, fontWeight: '500' },

  feedbackCard: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.md, ...SHADOW_SM },
  feedbackTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  starsRow: { flexDirection: 'row', gap: SP.xs },
  star: { fontSize: 28, color: C.border },
  starActive: { color: C.accent },
  feedbackMeta: { gap: SP.sm },
  rpeBadge: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  rpeLabel: { fontSize: FONT.sm, color: C.textMuted },
  rpeVal: { fontWeight: '700', fontSize: FONT.base, color: C.primary },
  feedbackNotiz: { fontSize: FONT.sm, color: C.textSub, fontStyle: 'italic' },
  editFeedbackBtn: { borderWidth: 1.5, borderColor: C.primary, borderRadius: R.sm, paddingVertical: SP.md - 2, alignItems: 'center' },
  editFeedbackBtnText: { color: C.primary, fontWeight: '700', fontSize: FONT.sm },

  feedbackBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg, alignItems: 'center', ...SHADOW_SM },
  feedbackBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },
});
