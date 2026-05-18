import React, { useState, useLayoutEffect } from 'react';
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
import { C, SP, R, FONT, SHADOW_SM } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'SportlerFeedback'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'SportlerFeedback'>;
};

const RPE_LABELS: Record<number, string> = {
  1: 'Sehr leicht', 2: 'Leicht', 3: 'Moderat', 4: 'Etwas anstrengend', 5: 'Anstrengend',
  6: 'Sehr anstrengend', 7: 'Hart', 8: 'Sehr hart', 9: 'Maximal', 10: 'Absolutes Maximum',
};

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
  const [rpe, setRpe]             = useState(existing?.rpe ?? 0);
  const [notiz, setNotiz]         = useState(existing?.notiz ?? '');
  const [errors, setErrors]       = useState<Record<string, string>>({});

  useLayoutEffect(() => {
    navigation.setOptions({ title: `Feedback: ${workout?.name ?? 'Workout'}` });
  }, [navigation, workout?.name]);

  const handleSave = () => {
    const e: Record<string, string> = {};
    if (bewertung === 0) e.bewertung = 'Bitte Bewertung auswählen';
    if (rpe === 0) e.rpe = 'Bitte RPE angeben';
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

    if (existing) {
      updateFeedback(existing.id, data);
    } else {
      addFeedback(data);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

        {/* Workout context */}
        {workout && (
          <View style={styles.contextCard}>
            <Text style={styles.contextName}>{workout.name}</Text>
            <Text style={styles.contextMeta}>{workout.typ} · {workout.uebungen.length} Übungen · Woche {woche?.wochennummer}</Text>
          </View>
        )}

        {/* Sterne-Bewertung */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Wie war das Workout?</Text>
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((s) => (
              <TouchableOpacity
                key={s}
                onPress={() => { setBewertung(s); setErrors((e) => ({ ...e, bewertung: '' })); }}
                style={styles.starBtn}
              >
                <Text style={[styles.star, s <= bewertung && styles.starActive]}>{s <= bewertung ? '★' : '☆'}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {bewertung > 0 && (
            <Text style={styles.bewertungLabel}>
              {bewertung === 1 ? 'Schlecht' : bewertung === 2 ? 'Okay' : bewertung === 3 ? 'Gut' : bewertung === 4 ? 'Sehr gut' : 'Ausgezeichnet!'}
            </Text>
          )}
          {errors.bewertung ? <Text style={styles.errorText}>{errors.bewertung}</Text> : null}
        </View>

        {/* RPE */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gefühlte Anstrengung (RPE)</Text>
          <Text style={styles.rpeSubtitle}>1 = sehr leicht · 10 = absolutes Maximum</Text>
          <View style={styles.rpeGrid}>
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => (
              <TouchableOpacity
                key={v}
                onPress={() => { setRpe(v); setErrors((e) => ({ ...e, rpe: '' })); }}
                style={[styles.rpeBtn, rpe === v && styles.rpeBtnActive, v >= 8 && styles.rpeBtnHigh, v >= 8 && rpe === v && styles.rpeBtnHighActive]}
              >
                <Text style={[styles.rpeNum, rpe === v && styles.rpeNumActive]}>{v}</Text>
              </TouchableOpacity>
            ))}
          </View>
          {rpe > 0 && <Text style={styles.rpeLabel}>{RPE_LABELS[rpe]}</Text>}
          {errors.rpe ? <Text style={styles.errorText}>{errors.rpe}</Text> : null}
        </View>

        {/* Notiz */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notizen (optional)</Text>
          <TextInput
            style={styles.notizInput}
            value={notiz}
            onChangeText={setNotiz}
            placeholder="Was lief gut? Was möchtest du verbessern?"
            placeholderTextColor={C.textMuted}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
          <Text style={styles.saveBtnText}>
            {existing ? 'Feedback aktualisieren' : '✓  Workout abschließen'}
          </Text>
        </TouchableOpacity>

        {existing && (
          <View style={styles.prevFeedback}>
            <Text style={styles.prevTitle}>Bisheriges Feedback</Text>
            <Text style={styles.prevDate}>vom {new Date(existing.datum).toLocaleDateString('de-DE')}</Text>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  content: { padding: SP.lg, gap: SP.md, paddingBottom: SP.xxxl },

  contextCard: { backgroundColor: C.primary, borderRadius: R.md, padding: SP.lg, ...SHADOW_SM },
  contextName: { fontWeight: '800', fontSize: FONT.md, color: C.white },
  contextMeta: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  section: { backgroundColor: C.card, borderRadius: R.md, padding: SP.lg, gap: SP.md, ...SHADOW_SM },
  sectionTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  errorText: { color: C.danger, fontSize: FONT.xs },

  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SP.sm },
  starBtn: { padding: SP.xs },
  star: { fontSize: 44, color: C.border },
  starActive: { color: C.accent },
  bewertungLabel: { textAlign: 'center', fontSize: FONT.sm, color: C.textSub, fontWeight: '600' },

  rpeSubtitle: { fontSize: FONT.xs, color: C.textMuted },
  rpeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  rpeBtn: {
    width: 52, height: 52, borderRadius: R.md, borderWidth: 1.5, borderColor: C.border,
    backgroundColor: C.cardAlt, alignItems: 'center', justifyContent: 'center',
  },
  rpeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  rpeBtnHigh: { borderColor: C.warningBg },
  rpeBtnHighActive: { backgroundColor: C.danger, borderColor: C.danger },
  rpeNum: { fontWeight: '800', fontSize: FONT.md, color: C.textSub },
  rpeNumActive: { color: C.white },
  rpeLabel: { fontSize: FONT.sm, color: C.textSub, fontWeight: '500', textAlign: 'center' },

  notizInput: { borderWidth: 1.5, borderColor: C.border, borderRadius: R.sm, paddingHorizontal: SP.md, paddingVertical: SP.md, fontSize: FONT.base, color: C.text, backgroundColor: C.cardAlt, height: 100 },

  saveBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg, alignItems: 'center', ...SHADOW_SM },
  saveBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.md },

  prevFeedback: { alignItems: 'center', gap: 2 },
  prevTitle: { fontSize: FONT.xs, color: C.textMuted },
  prevDate: { fontSize: FONT.xs, color: C.textMuted },
});
