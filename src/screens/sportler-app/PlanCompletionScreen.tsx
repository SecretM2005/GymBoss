import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ConfettiView } from '../../components/ConfettiView';
import { BadgeGrid } from '../../components/BadgeGrid';
import { useColors, SP, R, FONT } from '../../theme';
import { Badge, TrainingsPlan, WorkoutFeedback } from '../../types';
import { overallComplianceRate } from '../../utils/compliance';

type Props = {
  plan: TrainingsPlan;
  logs: WorkoutFeedback[];
  earnedBadges: Badge[];
  onClose: () => void;
  onSendCongrats?: () => void;
  isTrainer?: boolean;
};

export function PlanCompletionScreen({ plan, logs, earnedBadges, onClose, onSendCongrats, isTrainer = false }: Props) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const [showConfetti, setShowConfetti] = useState(true);

  const totalEinheiten = plan.wochen.reduce((s, w) => s + w.einheiten.length, 0);
  const completedEinheiten = plan.wochen
    .flatMap((w) => w.einheiten)
    .filter((e) => logs.some((l) => l.workoutId === e.id && l.abgeschlossen)).length;
  const compliance = overallComplianceRate(
    logs,
    plan.wochen.flatMap((w) => w.einheiten),
  );

  useEffect(() => {
    const t = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(t);
  }, []);

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <ConfettiView visible={showConfetti} />

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
        <Text style={s.trophy}>🏆</Text>
        <Text style={[s.title, { color: C.text }]}>Plan abgeschlossen!</Text>
        <Text style={[s.planName, { color: C.accent }]}>{plan.name}</Text>

        <View style={s.statsRow}>
          <StatBox label="Wochen" value={String(plan.wochen.length)} C={C} />
          <StatBox label="Einheiten" value={`${completedEinheiten}/${totalEinheiten}`} C={C} />
          <StatBox
            label="Compliance"
            value={`${Math.round(compliance * 100)}%`}
            C={C}
            color={compliance >= 0.8 ? '#4ADE80' : compliance >= 0.5 ? '#FACC15' : '#F87171'}
          />
        </View>

        {earnedBadges.length > 0 && (
          <View style={s.badgeSection}>
            <Text style={[s.badgeSectionTitle, { color: C.textMuted }]}>VERDIENTE BADGES</Text>
            <BadgeGrid badges={earnedBadges} horizontal={false} />
          </View>
        )}

        <TouchableOpacity
          style={[s.btn, { backgroundColor: C.accent }]}
          onPress={onClose}
          activeOpacity={0.85}
        >
          <Text style={[s.btnText, { color: C.accentContrast }]}>Weiter</Text>
        </TouchableOpacity>

        {isTrainer && onSendCongrats && (
          <TouchableOpacity
            style={[s.btnSecondary, { borderColor: C.border }]}
            onPress={onSendCongrats}
            activeOpacity={0.8}
          >
            <Text style={[s.btnSecondaryText, { color: C.textMuted }]}>🎉 Glückwunsch senden</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function StatBox({ label, value, C, color }: { label: string; value: string; C: any; color?: string }) {
  return (
    <View style={[s.statBox, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={[s.statValue, { color: color ?? C.text }]}>{value}</Text>
      <Text style={[s.statLabel, { color: C.textMuted }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  root:             { flex: 1 },
  content:          { padding: SP.xl, alignItems: 'center', gap: SP.lg },
  trophy:           { fontSize: 72, marginTop: SP.xl },
  title:            { fontSize: 28, fontWeight: '900', letterSpacing: -0.8, textAlign: 'center' },
  planName:         { fontSize: FONT.lg, fontWeight: '700', textAlign: 'center' },
  statsRow:         { flexDirection: 'row', gap: SP.md, width: '100%' },
  statBox:          { flex: 1, alignItems: 'center', gap: 4, borderRadius: R.xl, borderWidth: 1, paddingVertical: SP.lg },
  statValue:        { fontSize: FONT.xl, fontWeight: '800' },
  statLabel:        { fontSize: FONT.xs, fontWeight: '600' },
  badgeSection:     { width: '100%', gap: SP.sm },
  badgeSectionTitle:{ fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1.4, textTransform: 'uppercase' },
  btn:              { width: '100%', borderRadius: R.full, paddingVertical: SP.lg, alignItems: 'center', marginTop: SP.md },
  btnText:          { fontSize: FONT.md, fontWeight: '800' },
  btnSecondary:     { width: '100%', borderRadius: R.full, paddingVertical: SP.md, alignItems: 'center', borderWidth: 1 },
  btnSecondaryText: { fontSize: FONT.base, fontWeight: '600' },
});
