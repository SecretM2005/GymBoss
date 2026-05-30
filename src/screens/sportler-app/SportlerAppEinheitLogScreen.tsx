import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeinTrainingStackParamList } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useSessionLogStore } from '../../store/sessionLogStore';
import { GBIcon } from '../../components/GBIcon';
import { PHASE_CFG, PHASES, buildUebSuffix } from '../plaene/EinheitDetailScreen';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<MeinTrainingStackParamList, 'EinheitLog'>;
  route:      RouteProp<MeinTrainingStackParamList, 'EinheitLog'>;
};

const RPE_LABELS: Record<number, string> = {
  1: 'Sehr leicht', 2: 'Leicht', 3: 'Moderat', 4: 'Etwas schwer', 5: 'Schwer',
  6: 'Schwer+', 7: 'Sehr schwer', 8: 'Sehr schwer+', 9: 'Maximal', 10: 'Absolut max.',
};

export default function SportlerAppEinheitLogScreen({ navigation, route }: Props) {
  const { planId, wocheId, einheitId } = route.params;
  const { getPlanById }    = usePlanStore();
  const { activeSportlerId } = useSettingsStore();
  const { getLogForEinheit, saveLog } = useSessionLogStore();
  const insets = useSafeAreaInsets();
  const C = useColors();

  const plan   = getPlanById(planId);
  const woche  = plan?.wochen.find((w) => w.id === wocheId);
  const einheit = woche?.einheiten.find((e) => e.id === einheitId);

  const override = einheit?.sportlerOverrides?.[activeSportlerId ?? ''];
  const display  = override ? { ...einheit!, ...override } : einheit;

  const existingLog = getLogForEinheit(einheitId, activeSportlerId ?? '');

  const [bewertung, setBewertung] = useState(existingLog?.bewertung ?? 0);
  const [rpe, setRpe]             = useState(existingLog?.rpe ?? 6);
  const [notiz, setNotiz]         = useState(existingLog?.notiz ?? '');

  if (!display) { navigation.goBack(); return null; }

  const handleSave = (abgeschlossen: boolean) => {
    const datum = existingLog?.datum ?? new Date().toISOString().split('T')[0];
    saveLog({
      workoutId:    einheitId,
      sportlerId:   activeSportlerId!,
      datum,
      bewertung,
      rpe,
      notiz:        notiz.trim(),
      abgeschlossen,
    });
    navigation.goBack();
  };

  const totalEx = display.warmup.length + display.haupteinheit.length + display.cooldown.length;
  const alreadyDone = existingLog?.abgeschlossen ?? false;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>

        {/* Top Bar */}
        <View style={[styles.topBar, { borderBottomColor: C.border }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={20} color={C.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={[styles.topSub, { color: C.accent }]} numberOfLines={1}>{plan?.name}</Text>
            <Text style={[styles.topTitle, { color: C.text }]} numberOfLines={1}>{display.name}</Text>
          </View>
          {alreadyDone && (
            <View style={[styles.doneBadge, { backgroundColor: 'rgba(203,255,62,0.15)' }]}>
              <GBIcon name="check" size={12} color={C.accent} />
              <Text style={[styles.doneBadgeText, { color: C.accent }]}>Fertig</Text>
            </View>
          )}
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Info row */}
          <View style={[styles.infoCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <View style={styles.infoRow}>
              <GBIcon name="layers" size={13} color={C.textMuted} />
              <Text style={[styles.infoText, { color: C.textMuted }]}>
                Woche {woche?.wochennummer} · {totalEx} Übungen
              </Text>
            </View>
            {display.datum && (
              <View style={styles.infoRow}>
                <GBIcon name="calendar" size={13} color={C.textMuted} />
                <Text style={[styles.infoText, { color: C.textMuted }]}>
                  {new Date(display.datum).toLocaleDateString('de-DE')}
                </Text>
              </View>
            )}
          </View>

          {/* Phases – read-only */}
          {PHASES.map((phase) => {
            const cfg = PHASE_CFG[phase];
            const exercises = display[phase];
            if (exercises.length === 0) return null;
            return (
              <View key={phase} style={styles.phaseSection}>
                <View style={[styles.phaseHeader, { borderLeftColor: cfg.color }]}>
                  <Text style={[styles.phaseTitle, { color: cfg.color }]}>{cfg.label}</Text>
                  <Text style={[styles.phaseCount, { color: C.textDim }]}>{exercises.length}</Text>
                </View>
                {exercises.map((ueb) => (
                  <View key={ueb.id} style={[styles.uebRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                    <View style={[styles.uebDot, { backgroundColor: cfg.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.uebName, { color: C.text }]}>{ueb.name}</Text>
                      {buildUebSuffix(ueb).length > 0 && (
                        <Text style={[styles.uebParams, { color: C.textMuted }]}>{buildUebSuffix(ueb)}</Text>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            );
          })}

          {/* Feedback Card */}
          <View style={[styles.feedbackCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[styles.feedbackTitle, { color: C.text }]}>
              {alreadyDone ? 'Dein Feedback' : 'Training bewerten'}
            </Text>

            {/* Stars */}
            <View style={styles.feedbackSection}>
              <Text style={[styles.feedbackLabel, { color: C.textMuted }]}>Bewertung</Text>
              <View style={styles.starsRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <TouchableOpacity key={star} onPress={() => setBewertung(star)} activeOpacity={0.7} style={styles.starBtn}>
                    <Text style={[styles.star, { color: star <= bewertung ? '#FFD166' : C.textDim }]}>★</Text>
                  </TouchableOpacity>
                ))}
                {bewertung > 0 && (
                  <TouchableOpacity onPress={() => setBewertung(0)} activeOpacity={0.7}>
                    <GBIcon name="close" size={14} color={C.textDim} />
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* RPE */}
            <View style={styles.feedbackSection}>
              <View style={styles.rpeLabelRow}>
                <Text style={[styles.feedbackLabel, { color: C.textMuted }]}>Anstrengung (RPE)</Text>
                <Text style={[styles.rpeVal, { color: rpe >= 8 ? C.warn : rpe >= 5 ? '#FFB74D' : C.accent }]}>
                  {rpe} – {RPE_LABELS[rpe]}
                </Text>
              </View>
              <View style={styles.rpeRow}>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((v) => {
                  const active = v <= rpe;
                  const color = v >= 9 ? C.warn : v >= 7 ? '#FFB74D' : C.accent;
                  return (
                    <TouchableOpacity
                      key={v}
                      onPress={() => setRpe(v)}
                      style={[styles.rpeCell, { backgroundColor: active ? `${color}22` : C.surfaceAlt, borderColor: active ? color : C.border }]}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.rpeCellText, { color: active ? color : C.textDim, fontWeight: active ? '800' : '400' }]}>{v}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Notiz */}
            <View style={styles.feedbackSection}>
              <Text style={[styles.feedbackLabel, { color: C.textMuted }]}>Notiz (optional)</Text>
              <TextInput
                style={[styles.notizInput, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
                value={notiz}
                onChangeText={setNotiz}
                placeholder="Wie war das Training? Was hat gut/schlecht funktioniert?"
                placeholderTextColor={C.textDim}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* CTA */}
          <TouchableOpacity
            style={[styles.ctaBtn, { backgroundColor: C.accent }]}
            onPress={() => handleSave(true)}
            activeOpacity={0.85}
          >
            <GBIcon name="check" size={19} color={C.accentContrast} />
            <Text style={[styles.ctaBtnText, { color: C.accentContrast }]}>
              {alreadyDone ? 'Feedback aktualisieren' : 'Training abschließen'}
            </Text>
          </TouchableOpacity>

          {alreadyDone && (
            <TouchableOpacity
              style={[styles.secondaryBtn, { borderColor: C.border }]}
              onPress={() => handleSave(false)}
              activeOpacity={0.7}
            >
              <Text style={[styles.secondaryBtnText, { color: C.textMuted }]}>Als offen markieren</Text>
            </TouchableOpacity>
          )}

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingVertical: SP.md, gap: SP.sm, borderBottomWidth: 1 },
  iconBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topCenter:   { flex: 1, paddingHorizontal: SP.sm },
  topSub:      { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle:    { fontSize: FONT.md, fontWeight: '700', color: C.text, letterSpacing: -0.3, marginTop: 2 },
  doneBadge:   { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: R.full },
  doneBadgeText: { fontSize: FONT.xs, fontWeight: '700' },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.lg },

  infoCard: { borderRadius: R.lg, borderWidth: 1, padding: SP.md, gap: SP.xs },
  infoRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  infoText: { fontSize: FONT.sm, color: C.textMuted },

  phaseSection: { gap: SP.sm },
  phaseHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderLeftWidth: 3, paddingLeft: SP.sm },
  phaseTitle:   { fontSize: FONT.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  phaseCount:   { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '600' },
  uebRow:       { flexDirection: 'row', alignItems: 'center', gap: SP.md, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  uebDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  uebName:      { fontSize: FONT.base, fontWeight: '600', color: C.text },
  uebParams:    { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2, lineHeight: 16 },

  feedbackCard:    { borderRadius: R.xl, borderWidth: 1, padding: SP.lg, gap: SP.lg },
  feedbackTitle:   { fontSize: FONT.md, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  feedbackSection: { gap: SP.sm },
  feedbackLabel:   { fontSize: FONT.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  starsRow:        { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  starBtn:         { padding: 4 },
  star:            { fontSize: 32, lineHeight: 36 },

  rpeLabelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SP.sm },
  rpeVal:      { fontSize: FONT.xs, fontWeight: '700', color: C.accent },
  rpeRow:      { flexDirection: 'row', gap: 4 },
  rpeCell:     { flex: 1, aspectRatio: 1, alignItems: 'center', justifyContent: 'center', borderRadius: R.sm, borderWidth: 1 },
  rpeCellText: { fontFamily: FONT_MONO, fontSize: FONT.xs },

  notizInput: { borderRadius: R.md, borderWidth: 1, padding: SP.md, fontSize: FONT.sm, minHeight: 100, lineHeight: 20 },

  ctaBtn:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.lg, borderRadius: R.lg },
  ctaBtnText:  { fontSize: FONT.base, fontWeight: '800', letterSpacing: -0.2 },
  secondaryBtn:     { alignItems: 'center', paddingVertical: SP.md, borderRadius: R.md, borderWidth: 1 },
  secondaryBtnText: { fontSize: FONT.sm, fontWeight: '600' },
});
