import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Svg, { Circle } from 'react-native-svg';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useFeedbackStore } from '../../../store/feedbackStore';
import { useRoleStore } from '../../../store/roleStore';
import TopBar from '../../../components/TopBar';
import TypeChip from '../../../components/TypeChip';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'SportlerWorkoutDetail'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'SportlerWorkoutDetail'>;
};

const RING_SIZE = 120;
const STROKE = 8;
const RADIUS = (RING_SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;

function ProgressRing({ pct, label }: { pct: number; label: string }) {
  const stroke = CIRC * (1 - pct);
  return (
    <View style={ring.wrap}>
      <Svg width={RING_SIZE} height={RING_SIZE}>
        <Circle cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS} stroke={C.border} strokeWidth={STROKE} fill="none" />
        <Circle
          cx={RING_SIZE / 2} cy={RING_SIZE / 2} r={RADIUS}
          stroke={C.accent} strokeWidth={STROKE} fill="none"
          strokeDasharray={`${CIRC}`}
          strokeDashoffset={stroke}
          strokeLinecap="round"
          rotation="-90"
          origin={`${RING_SIZE / 2}, ${RING_SIZE / 2}`}
        />
      </Svg>
      <View style={ring.center}>
        <Text style={ring.pct}>{Math.round(pct * 100)}%</Text>
        <Text style={ring.label}>{label}</Text>
      </View>
    </View>
  );
}

export default function SportlerWorkoutDetailScreen({ navigation, route }: Props) {
  const { planId, wocheId, workoutId } = route.params;
  const { getPlanById } = useTrainingsplanStore();
  const { getFeedbackForWorkout } = useFeedbackStore();
  const { currentUser } = useRoleStore();

  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);
  const workout = woche?.workouts.find((wo) => wo.id === workoutId);
  const feedback = getFeedbackForWorkout(workoutId, currentUser.id);

  const [checked, setChecked] = useState<Set<string>>(new Set());
  const toggleCheck = (setKey: string) =>
    setChecked((prev) => { const next = new Set(prev); next.has(setKey) ? next.delete(setKey) : next.add(setKey); return next; });

  if (!workout) {
    return (
      <View style={styles.root}>
        <TopBar title="Workout" leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />} />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Workout nicht gefunden.</Text>
        </View>
      </View>
    );
  }

  const totalSaetze = workout.uebungen.reduce((acc, u) => acc + u.saetze, 0);
  const checkedSaetze = checked.size;
  const progressPct = totalSaetze > 0 ? checkedSaetze / totalSaetze : 0;
  const estMin = Math.round(workout.uebungen.reduce((acc, u) => acc + u.saetze * (u.pause + 45), 0) / 60);

  return (
    <View style={styles.root}>
      <TopBar
        large
        subtitle={`${workout.typ} · ${workout.wochentag}`}
        title={workout.name}
        leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Hero stats + progress ring */}
        <View style={styles.hero}>
          <View style={styles.heroLeft}>
            <TypeChip typ={workout.typ} />
            <View style={styles.heroStats}>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{workout.uebungen.length}</Text>
                <Text style={styles.heroStatLabel}>Übungen</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>{totalSaetze}</Text>
                <Text style={styles.heroStatLabel}>Sätze</Text>
              </View>
              <View style={styles.heroStat}>
                <Text style={styles.heroStatVal}>~{estMin}'</Text>
                <Text style={styles.heroStatLabel}>Dauer</Text>
              </View>
            </View>
            {feedback?.abgeschlossen && (
              <View style={styles.doneBadge}>
                <GBIcon name="check" size={12} color={C.success} />
                <Text style={styles.doneBadgeText}>Erledigt</Text>
              </View>
            )}
          </View>
          <ProgressRing pct={progressPct} label="Sets" />
        </View>

        {/* Exercise cards */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>Übungen · {workout.uebungen.length}</Text>
        </View>

        {workout.uebungen.map((u, i) => (
          <View key={u.id} style={styles.exCard}>
            <View style={styles.exHeader}>
              <View style={styles.exNum}>
                <Text style={styles.exNumText}>{String(i + 1).padStart(2, '0')}</Text>
              </View>
              <Text style={styles.exName}>{u.name}</Text>
            </View>

            {/* Set rows */}
            <View style={styles.setList}>
              {Array.from({ length: u.saetze }, (_, si) => {
                const key = `${u.id}-s${si}`;
                const done = checked.has(key);
                return (
                  <TouchableOpacity
                    key={key}
                    style={[styles.setRow, done && styles.setRowDone]}
                    onPress={() => toggleCheck(key)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.setCheck, done && styles.setCheckDone]}>
                      {done && <GBIcon name="check" size={12} color={C.accentContrast} />}
                    </View>
                    <Text style={[styles.setLabel, done && styles.setLabelDone]}>
                      Satz {si + 1}
                    </Text>
                    <Text style={[styles.setVal, done && styles.setValDone]}>
                      {u.wiederholungen} Wdh.{u.gewicht ? `  ·  ${u.gewicht} kg` : ''}
                    </Text>
                    <Text style={styles.setPause}>{u.pause}s</Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {u.notizen ? (
              <View style={styles.notizRow}>
                <GBIcon name="bolt" size={12} color={C.accent} />
                <Text style={styles.notizText}>{u.notizen}</Text>
              </View>
            ) : null}
          </View>
        ))}

        {/* Feedback / Complete button */}
        {feedback ? (
          <View style={styles.feedbackCard}>
            <Text style={styles.feedbackTitle}>Dein Feedback</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <Text key={s} style={[styles.star, s <= feedback.bewertung && styles.starActive]}>★</Text>
              ))}
            </View>
            <Text style={styles.rpeText}>RPE {feedback.rpe}/10</Text>
            {feedback.notiz ? <Text style={styles.feedbackNotiz}>{feedback.notiz}</Text> : null}
            <TouchableOpacity
              style={styles.editBtn}
              onPress={() => navigation.navigate('SportlerFeedback', { planId, wocheId, workoutId })}
            >
              <Text style={styles.editBtnText}>Feedback bearbeiten</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.completeBtn}
            onPress={() => navigation.navigate('SportlerFeedback', { planId, wocheId, workoutId })}
            activeOpacity={0.85}
          >
            <GBIcon name="check" size={18} color={C.accentContrast} />
            <Text style={styles.completeBtnText}>Workout abschließen</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const ring = StyleSheet.create({
  wrap: { width: RING_SIZE, height: RING_SIZE, alignItems: 'center', justifyContent: 'center' },
  center: { position: 'absolute', alignItems: 'center' },
  pct: { fontFamily: FONT_MONO, fontSize: FONT.md, fontWeight: '700', color: C.accent },
  label: { fontSize: 10, color: C.textMuted, fontWeight: '600' },
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.md },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted },

  hero: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: C.surface, borderRadius: R.xl, padding: SP.xl,
    borderWidth: 1, borderColor: C.border,
  },
  heroLeft: { flex: 1, gap: SP.md },
  heroStats: { flexDirection: 'row', gap: SP.xl },
  heroStat: { gap: 2 },
  heroStatVal: { fontFamily: FONT_MONO, fontSize: 20, fontWeight: '700', color: C.text },
  heroStatLabel: { fontSize: FONT.xs, color: C.textMuted },
  doneBadge: { flexDirection: 'row', alignItems: 'center', gap: SP.xs, backgroundColor: C.successBg, borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 3, alignSelf: 'flex-start' },
  doneBadgeText: { fontSize: FONT.xs, color: C.success, fontWeight: '600' },

  sectionHead: {},
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },

  exCard: { backgroundColor: C.surface, borderRadius: R.lg, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  exHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md },
  exNum: { width: 36, height: 36, borderRadius: R.sm, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  exNumText: { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '700', color: C.accent },
  exName: { flex: 1, fontSize: FONT.base, fontWeight: '600', color: C.text },

  setList: { paddingHorizontal: SP.md, paddingBottom: SP.md, gap: SP.xs },
  setRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, padding: SP.sm, borderRadius: R.sm },
  setRowDone: { backgroundColor: C.accentLight },
  setCheck: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, borderColor: C.borderStrong, alignItems: 'center', justifyContent: 'center' },
  setCheckDone: { backgroundColor: C.accent, borderColor: C.accent },
  setLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', width: 48 },
  setLabelDone: { color: C.accentDark },
  setVal: { flex: 1, fontSize: FONT.sm, fontWeight: '600', color: C.text },
  setValDone: { color: C.accentDark },
  setPause: { fontSize: FONT.xs, color: C.textDim },

  notizRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.xs, paddingHorizontal: SP.md, paddingBottom: SP.md },
  notizText: { flex: 1, fontSize: FONT.xs, color: C.textMuted, fontStyle: 'italic' },

  feedbackCard: { backgroundColor: C.surface, borderRadius: R.lg, padding: SP.xl, borderWidth: 1, borderColor: C.border, gap: SP.md },
  feedbackTitle: { fontSize: FONT.base, fontWeight: '700', color: C.text },
  starsRow: { flexDirection: 'row', gap: SP.xs },
  star: { fontSize: 24, color: C.border },
  starActive: { color: C.accent },
  rpeText: { fontSize: FONT.sm, color: C.textMuted },
  feedbackNotiz: { fontSize: FONT.sm, color: C.textSub, fontStyle: 'italic' },
  editBtn: { borderWidth: 1.5, borderColor: C.accent, borderRadius: R.full, paddingVertical: SP.sm, alignItems: 'center' },
  editBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accent },

  completeBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SP.sm, backgroundColor: C.accent, borderRadius: R.full,
    paddingVertical: SP.md + 2,
  },
  completeBtnText: { fontSize: FONT.base, fontWeight: '700', color: C.accentContrast },
});
