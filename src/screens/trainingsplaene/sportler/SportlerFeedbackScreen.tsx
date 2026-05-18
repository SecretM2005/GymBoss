import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useFeedbackStore } from '../../../store/feedbackStore';
import { useRoleStore } from '../../../store/roleStore';
import TopBar from '../../../components/TopBar';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'SportlerFeedback'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'SportlerFeedback'>;
};

const STAR_LABELS = ['', 'Schlecht', 'Okay', 'Gut', 'Sehr gut', 'Ausgezeichnet!'];

const RPE_LABELS: Record<number, string> = {
  1: 'Sehr leicht', 2: 'Leicht', 3: 'Moderat', 4: 'Etwas anstrengend',
  5: 'Anstrengend', 6: 'Sehr anstrengend', 7: 'Hart',
  8: 'Sehr hart', 9: 'Maximal', 10: 'Absolutes Maximum',
};

function rpeColor(v: number): string {
  if (v <= 4) return C.success;
  if (v <= 6) return C.accent;
  if (v <= 8) return C.warning;
  return C.danger;
}

export default function SportlerFeedbackScreen({ navigation, route }: Props) {
  const { planId, wocheId, workoutId } = route.params;
  const { getPlanById } = useTrainingsplanStore();
  const { getFeedbackForWorkout, addFeedback, updateFeedback } = useFeedbackStore();
  const { currentUser } = useRoleStore();

  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);
  const workout = woche?.workouts.find((wo) => wo.id === workoutId);
  const existing = getFeedbackForWorkout(workoutId, currentUser.id);

  const [bewertung, setBewertung] = useState(existing?.bewertung ?? 0);
  const [rpe, setRpe]             = useState(existing?.rpe ?? 5);
  const [notiz, setNotiz]         = useState(existing?.notiz ?? '');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors]       = useState<Record<string, string>>({});

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (bewertung === 0) e.bewertung = 'Bitte Bewertung auswählen';
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    const data = {
      workoutId,
      sportlerId: currentUser.id,
      datum: new Date().toISOString().split('T')[0],
      bewertung,
      rpe,
      notiz: notiz.trim() || undefined,
      abgeschlossen: true,
    };

    if (existing) updateFeedback(existing.id, data);
    else addFeedback(data);

    setSubmitted(true);
    setTimeout(() => navigation.goBack(), 900);
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.root}>
        <TopBar
          large
          subtitle={workout?.name ?? 'Workout'}
          title="Feedback"
          leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
        />

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Workout context */}
          {workout && (
            <View style={styles.contextCard}>
              <Text style={styles.contextName}>{workout.name}</Text>
              <Text style={styles.contextMeta}>{workout.typ} · {workout.uebungen.length} Übungen · Woche {woche?.wochennummer}</Text>
            </View>
          )}

          {/* Star rating */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wie war das Workout?</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => { setBewertung(s); setErrors((e) => ({ ...e, bewertung: '' })); }}
                  style={styles.starBtn}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.star, s <= bewertung && styles.starActive]}>
                    {s <= bewertung ? '★' : '☆'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {bewertung > 0 && <Text style={styles.starLabel}>{STAR_LABELS[bewertung]}</Text>}
            {errors.bewertung ? <Text style={styles.errText}>{errors.bewertung}</Text> : null}
          </View>

          {/* RPE */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gefühlte Anstrengung (RPE)</Text>
            <View style={styles.rpeLarge}>
              <Text style={[styles.rpeNum, { color: rpeColor(rpe) }]}>{rpe}</Text>
              <Text style={styles.rpeOf}>/10</Text>
            </View>
            {rpe > 0 && <Text style={styles.rpeDesc}>{RPE_LABELS[rpe]}</Text>}

            {/* RPE track */}
            <View style={styles.rpeTrack}>
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
                const on = v <= rpe;
                const color = rpeColor(v);
                return (
                  <TouchableOpacity
                    key={v}
                    style={[styles.rpeSegment, { backgroundColor: on ? color : C.surface }]}
                    onPress={() => setRpe(v)}
                    activeOpacity={0.7}
                  />
                );
              })}
            </View>
            <View style={styles.rpeTrackLabels}>
              <Text style={styles.rpeTrackLabel}>Leicht</Text>
              <Text style={styles.rpeTrackLabel}>Maximum</Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notizen (optional)</Text>
            <TextInput
              style={styles.notizInput}
              value={notiz}
              onChangeText={setNotiz}
              placeholder="Was lief gut? Was möchtest du verbessern?"
              placeholderTextColor={C.textDim}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, submitted && styles.submitBtnDone]}
            onPress={handleSave}
            activeOpacity={0.85}
            disabled={submitted}
          >
            <GBIcon name="check" size={18} color={submitted ? C.accentContrast : C.accentContrast} />
            <Text style={styles.submitBtnText}>
              {submitted ? 'Gespeichert!' : existing ? 'Feedback aktualisieren' : 'Feedback senden'}
            </Text>
          </TouchableOpacity>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.lg },

  contextCard: {
    backgroundColor: C.surface, borderRadius: R.lg, padding: SP.lg,
    borderWidth: 1, borderColor: C.border,
  },
  contextName: { fontSize: FONT.md, fontWeight: '700', color: C.text },
  contextMeta: { fontSize: FONT.sm, color: C.textMuted, marginTop: 4 },

  section: { gap: SP.md },
  sectionTitle: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.4, textTransform: 'uppercase' },
  errText: { fontSize: FONT.xs, color: C.danger },

  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SP.md },
  starBtn: { padding: SP.xs },
  star: { fontSize: 44, color: C.border },
  starActive: { color: C.accent },
  starLabel: { textAlign: 'center', fontSize: FONT.sm, color: C.textMuted, fontWeight: '600' },

  rpeLarge: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'center' },
  rpeNum: { fontFamily: FONT_MONO, fontSize: 72, fontWeight: '700', letterSpacing: -2 },
  rpeOf: { fontSize: FONT.xl, color: C.textDim, fontWeight: '600', marginLeft: SP.xs },
  rpeDesc: { textAlign: 'center', fontSize: FONT.sm, color: C.textMuted, fontWeight: '500', marginTop: -SP.sm },

  rpeTrack: { flexDirection: 'row', gap: 3, height: 12 },
  rpeSegment: { flex: 1, borderRadius: 3 },
  rpeTrackLabels: { flexDirection: 'row', justifyContent: 'space-between' },
  rpeTrackLabel: { fontSize: 10, color: C.textDim, fontWeight: '600' },

  notizInput: {
    backgroundColor: C.surface, borderRadius: R.md, padding: SP.md,
    fontSize: FONT.base, color: C.text, borderWidth: 1, borderColor: C.border,
    minHeight: 100,
  },

  submitBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SP.sm, backgroundColor: C.accent, borderRadius: R.full,
    paddingVertical: SP.md + 2,
  },
  submitBtnDone: { backgroundColor: C.success },
  submitBtnText: { fontSize: FONT.base, fontWeight: '700', color: C.accentContrast },
});
