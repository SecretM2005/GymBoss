import React, { useLayoutEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList, Wochentag, PlanWorkout } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerWoche'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainerWoche'>;
};

const TAGE: Wochentag[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const TAG_NAMEN: Record<Wochentag, string> = {
  Mo: 'Montag', Di: 'Dienstag', Mi: 'Mittwoch',
  Do: 'Donnerstag', Fr: 'Freitag', Sa: 'Samstag', So: 'Sonntag',
};

const TYP_COLORS: Record<string, { bg: string; text: string }> = {
  'Krafttraining':  { bg: C.primaryLight, text: C.primary },
  'Kampfsport':     { bg: C.accentLight,  text: C.accent  },
  'Mobilität':      { bg: C.successBg,    text: C.success },
  'Ausdauer':       { bg: C.warningBg,    text: C.warning },
};

function typColor(typ: string) {
  const key = Object.keys(TYP_COLORS).find((k) => typ.startsWith(k));
  return key ? TYP_COLORS[key] : { bg: C.border, text: C.textSub };
}

export default function TrainerWocheScreen({ navigation, route }: Props) {
  const { planId, wocheId } = route.params;
  const { getPlanById, addWorkout, deleteWorkout } = useTrainingsplanStore();
  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);

  useLayoutEffect(() => {
    navigation.setOptions({ title: `Woche ${woche?.wochennummer ?? ''}` });
  }, [navigation, woche?.wochennummer]);

  if (!plan || !woche) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundText}>Woche nicht gefunden.</Text>
      </View>
    );
  }

  const workoutsByTag = TAGE.reduce<Record<Wochentag, PlanWorkout[]>>((acc, tag) => {
    acc[tag] = woche.workouts.filter((wo) => wo.wochentag === tag);
    return acc;
  }, {} as Record<Wochentag, PlanWorkout[]>);

  const handleAddWorkout = (tag: Wochentag) => {
    const workoutId = addWorkout(planId, wocheId, { name: 'Neues Workout', wochentag: tag, typ: 'Krafttraining' });
    navigation.navigate('TrainerWorkout', { planId, wocheId, workoutId });
  };

  const handleDeleteWorkout = (workoutId: string, name: string) => {
    Alert.alert('Workout löschen', `"${name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteWorkout(planId, wocheId, workoutId) },
    ]);
  };

  const activeTage = TAGE.filter((t) => workoutsByTag[t].length > 0);
  const inactiveTage = TAGE.filter((t) => workoutsByTag[t].length === 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary */}
      <View style={styles.summary}>
        <View style={styles.summaryLeft}>
          <Text style={styles.summaryTitle}>Woche {woche.wochennummer}</Text>
          <Text style={styles.summarySub}>{woche.workouts.length} Workouts · {plan.name}</Text>
        </View>
        <View style={styles.dayDots}>
          {TAGE.map((t) => (
            <View
              key={t}
              style={[styles.dayDot, workoutsByTag[t].length > 0 && styles.dayDotActive]}
            >
              <Text style={[styles.dayDotText, workoutsByTag[t].length > 0 && styles.dayDotTextActive]}>
                {t[0]}
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Active days */}
      {activeTage.map((tag) => (
        <View key={tag} style={styles.daySection}>
          <View style={styles.dayHeader}>
            <Text style={styles.dayName}>{TAG_NAMEN[tag]}</Text>
            <TouchableOpacity style={styles.addBtn} onPress={() => handleAddWorkout(tag)}>
              <Text style={styles.addBtnText}>+ Workout</Text>
            </TouchableOpacity>
          </View>
          {workoutsByTag[tag].map((wo) => {
            const tc = typColor(wo.typ);
            return (
              <TouchableOpacity
                key={wo.id}
                style={styles.workoutCard}
                onPress={() => navigation.navigate('TrainerWorkout', { planId, wocheId, workoutId: wo.id })}
                activeOpacity={0.75}
              >
                <View style={[styles.workoutStripe, { backgroundColor: tc.text }]} />
                <View style={styles.workoutBody}>
                  <View style={styles.workoutTop}>
                    <Text style={styles.workoutName}>{wo.name}</Text>
                    <TouchableOpacity
                      onPress={() => handleDeleteWorkout(wo.id, wo.name)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.workoutMeta}>
                    <View style={[styles.typBadge, { backgroundColor: tc.bg }]}>
                      <Text style={[styles.typText, { color: tc.text }]}>{wo.typ}</Text>
                    </View>
                    <Text style={styles.uebungCount}>{wo.uebungen.length} Übungen</Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      ))}

      {/* Add workouts for empty days */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Freie Tage</Text>
        <View style={styles.emptyDaysGrid}>
          {inactiveTage.map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.emptyDayBtn}
              onPress={() => handleAddWorkout(tag)}
            >
              <Text style={styles.emptyDayTag}>{tag}</Text>
              <Text style={styles.emptyDayPlus}>+</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.md, gap: SP.md, paddingBottom: SP.xxxl },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted },

  summary: { backgroundColor: C.primary, borderRadius: R.md, padding: SP.lg, gap: SP.sm, ...SHADOW_SM },
  summaryLeft: { gap: 2 },
  summaryTitle: { fontSize: FONT.lg, fontWeight: '800', color: C.white },
  summarySub: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.7)' },
  dayDots: { flexDirection: 'row', gap: SP.xs },
  dayDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  dayDotActive: { backgroundColor: C.accent },
  dayDotText: { fontSize: FONT.xs, fontWeight: '700', color: 'rgba(255,255,255,0.5)' },
  dayDotTextActive: { color: C.white },

  daySection: { gap: SP.sm },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dayName: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  addBtn: { backgroundColor: C.primaryLight, borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.xs },
  addBtnText: { color: C.primary, fontSize: FONT.xs, fontWeight: '700' },

  workoutCard: { backgroundColor: C.card, borderRadius: R.md, flexDirection: 'row', overflow: 'hidden', ...SHADOW_SM },
  workoutStripe: { width: 4 },
  workoutBody: { flex: 1, padding: SP.md, gap: SP.xs },
  workoutTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  workoutName: { fontWeight: '700', fontSize: FONT.base, color: C.text, flex: 1, marginRight: SP.sm },
  deleteBtn: { width: 26, height: 26, borderRadius: 13, backgroundColor: C.dangerBg, alignItems: 'center', justifyContent: 'center' },
  deleteBtnText: { color: C.danger, fontSize: 11, fontWeight: '700' },
  workoutMeta: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  typBadge: { borderRadius: R.sm, paddingHorizontal: SP.sm, paddingVertical: 2 },
  typText: { fontSize: FONT.xs, fontWeight: '700' },
  uebungCount: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '500' },

  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.md, gap: SP.sm, ...SHADOW_SM },
  sectionTitle: { fontSize: FONT.sm, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 0.5 },
  emptyDaysGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  emptyDayBtn: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm, paddingVertical: SP.sm, paddingHorizontal: SP.lg, alignItems: 'center', borderStyle: 'dashed', gap: 2 },
  emptyDayTag: { fontWeight: '700', fontSize: FONT.sm, color: C.textSub },
  emptyDayPlus: { fontSize: FONT.xs, color: C.textMuted },
});
