import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WorkoutFeedback } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useSessionLogStore } from '../../store/sessionLogStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAthletenStore } from '../../store/athletenStore';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

const SCREEN_W = Dimensions.get('window').width - SP.xl * 2 - SP.lg * 2;

function useWeeklyStats(logs: WorkoutFeedback[]) {
  return useMemo(() => {
    const now = Date.now();
    const weeks: { label: string; count: number; avgRpe: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(now - (w + 1) * 7 * 86400000);
      const end   = new Date(now - w * 7 * 86400000);
      const inRange = logs.filter((l) => {
        const d = new Date(l.datum);
        return l.abgeschlossen && d >= start && d < end;
      });
      const avgRpe = inRange.length && inRange.some((l) => l.rpe > 0)
        ? inRange.reduce((s, l) => s + l.rpe, 0) / inRange.filter((l) => l.rpe > 0).length
        : 0;
      const weekStart = new Date(now - (w + 1) * 7 * 86400000);
      weeks.push({ label: `${weekStart.getDate()}.${weekStart.getMonth() + 1}`, count: inRange.length, avgRpe });
    }
    return weeks;
  }, [logs]);
}

function BarChart({ data, C }: {
  data: { label: string; count: number }[];
  C: ReturnType<typeof useColors>;
}) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const chartH = 130;
  const barW   = (SCREEN_W - 40) / data.length - 6;

  return (
    <Svg width={SCREEN_W} height={chartH + 28}>
      {[0, 0.5, 1].map((f) => (
        <Line key={f} x1={0} y1={chartH * (1 - f)} x2={SCREEN_W} y2={chartH * (1 - f)}
          stroke={C.border} strokeWidth={1} />
      ))}
      {data.map((d, i) => {
        const x = 4 + i * (barW + 6);
        const h = Math.max((d.count / maxVal) * chartH, d.count > 0 ? 4 : 0);
        const y = chartH - h;
        return (
          <React.Fragment key={i}>
            <Rect x={x} y={y} width={barW} height={h} rx={4}
              fill={d.count > 0 ? C.accent : C.surfaceAlt} />
            <SvgText x={x + barW / 2} y={chartH + 18} textAnchor="middle"
              fontSize={9} fill={C.textDim} fontFamily="System">{d.label}</SvgText>
            {d.count > 0 && (
              <SvgText x={x + barW / 2} y={y - 4} textAnchor="middle"
                fontSize={9} fill={C.accent} fontFamily="System" fontWeight="700">{d.count}</SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function SportlerFortschrittScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { activeSportlerId } = useSettingsStore();
  const { getSportlerById }  = useAthletenStore();
  const { getPlaeneForSportler } = usePlanStore();
  const { getLogsForSportler }   = useSessionLogStore();

  const sportler = getSportlerById(activeSportlerId ?? '');
  const allLogs  = getLogsForSportler(activeSportlerId ?? '');
  const doneLogs = allLogs.filter((l) => l.abgeschlossen);
  const plaene   = getPlaeneForSportler(activeSportlerId ?? '');

  const weeklyStats  = useWeeklyStats(allLogs);
  const totalDone    = doneLogs.length;
  const currentStreak = useMemo(() => {
    let streak = 0;
    const sorted = [...doneLogs].sort((a, b) => b.datum.localeCompare(a.datum));
    let prev: Date | null = null;
    for (const log of sorted) {
      const d = new Date(log.datum);
      if (!prev) { streak = 1; prev = d; continue; }
      const diffDays = Math.floor((prev.getTime() - d.getTime()) / 86400000);
      if (diffDays <= 7) { streak++; prev = d; } else break;
    }
    return streak;
  }, [doneLogs]);

  const avgRpe = useMemo(() => {
    const with_rpe = doneLogs.filter((l) => l.rpe > 0);
    if (!with_rpe.length) return 0;
    return Math.round(with_rpe.reduce((s, l) => s + l.rpe, 0) / with_rpe.length * 10) / 10;
  }, [doneLogs]);

  const avgBewertung = useMemo(() => {
    const with_b = doneLogs.filter((l) => l.bewertung > 0);
    if (!with_b.length) return 0;
    return Math.round(with_b.reduce((s, l) => s + l.bewertung, 0) / with_b.length * 10) / 10;
  }, [doneLogs]);

  const planProgress = useMemo(() =>
    plaene.map((plan) => {
      const allE = plan.wochen.flatMap((w) => w.einheiten);
      const done = allE.filter((e) =>
        allLogs.find((l) => l.workoutId === e.id && l.abgeschlossen)
      ).length;
      const pct = allE.length > 0 ? done / allE.length : 0;
      return { plan, done, total: allE.length, pct };
    }),
  [plaene, allLogs]);

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <Text style={[s.headerTitle, { color: C.text }]}>Mein Fortschritt</Text>
        {sportler && (
          <Text style={[s.headerSub, { color: C.accent }]}>{sportler.name}</Text>
        )}
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* KPI Row */}
        <View style={s.kpiRow}>
          <View style={[s.kpiCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.kpiValue, { color: C.accent }]}>{totalDone}</Text>
            <Text style={[s.kpiLabel, { color: C.textDim }]}>Einheiten{'\n'}absolviert</Text>
          </View>
          <View style={[s.kpiCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.kpiValue, { color: '#FF8A66' }]}>{currentStreak}</Text>
            <Text style={[s.kpiLabel, { color: C.textDim }]}>Wochen{'\n'}Streak</Text>
          </View>
          <View style={[s.kpiCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.kpiValue, { color: '#7ABFFF' }]}>{avgRpe || '—'}</Text>
            <Text style={[s.kpiLabel, { color: C.textDim }]}>Ø RPE</Text>
          </View>
          <View style={[s.kpiCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.kpiValue, { color: '#FFD166' }]}>{avgBewertung ? `${avgBewertung}★` : '—'}</Text>
            <Text style={[s.kpiLabel, { color: C.textDim }]}>Ø Bewertung</Text>
          </View>
        </View>

        {/* Weekly Volume Chart */}
        <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[s.cardTitle, { color: C.text }]}>Trainingsvolumen (8 Wochen)</Text>
          <Text style={[s.cardSub, { color: C.textDim }]}>Abgeschlossene Einheiten pro Woche</Text>
          <View style={{ marginTop: SP.sm }}>
            <BarChart data={weeklyStats} C={C} />
          </View>
        </View>

        {/* Plan Progress */}
        {planProgress.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: C.textDim }]}>MEINE PLÄNE</Text>
            {planProgress.map(({ plan, done, total, pct }) => (
              <View key={plan.id} style={[s.planRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={s.planRowTop}>
                  <Text style={[s.planName, { color: C.text }]} numberOfLines={1}>{plan.name}</Text>
                  <Text style={[s.planCount, { color: C.textMuted, fontFamily: FONT_MONO }]}>{done}/{total}</Text>
                </View>
                <View style={[s.progressTrack, { backgroundColor: C.surfaceAlt }]}>
                  <View style={[s.progressFill, {
                    width: `${Math.round(pct * 100)}%`,
                    backgroundColor: pct === 1 ? C.accent : '#7ABFFF',
                  }]} />
                </View>
                <Text style={[s.progressPct, { color: pct === 1 ? C.accent : C.textDim }]}>
                  {Math.round(pct * 100)}%{pct === 1 ? ' — Abgeschlossen ✓' : ' abgeschlossen'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {totalDone === 0 && (
          <View style={[s.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <GBIcon name="barChart" size={40} color={C.textDim} />
            <Text style={[s.emptyTitle, { color: C.textSub }]}>Noch keine Daten</Text>
            <Text style={[s.emptySub, { color: C.textDim }]}>
              Schließe deine erste Trainingseinheit ab, um deinen Fortschritt zu sehen.
            </Text>
          </View>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1 },
  header: { paddingHorizontal: SP.xl, paddingVertical: SP.lg, borderBottomWidth: 1 },
  headerTitle: { fontSize: FONT.xl, fontWeight: '700', letterSpacing: -0.5, color: C.text },
  headerSub:   { fontSize: FONT.xs, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2, marginTop: 2 },

  content: { padding: SP.xl, gap: SP.lg },

  kpiRow:   { flexDirection: 'row', gap: SP.xs },
  kpiCard:  { flex: 1, borderRadius: R.lg, borderWidth: 1, padding: SP.sm, alignItems: 'center', gap: 3 },
  kpiValue: { fontFamily: FONT_MONO, fontSize: FONT.md, fontWeight: '800' },
  kpiLabel: { fontSize: 8, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.4, textAlign: 'center', lineHeight: 12 },

  card:      { borderRadius: R.xl, borderWidth: 1, padding: SP.lg, gap: SP.sm },
  cardTitle: { fontSize: FONT.base, fontWeight: '700', color: C.text },
  cardSub:   { fontSize: FONT.xs, color: C.textDim },

  section:      { gap: SP.sm },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1.6, paddingHorizontal: 2 },

  planRow:      { borderRadius: R.lg, borderWidth: 1, padding: SP.md, gap: SP.sm },
  planRowTop:   { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName:     { flex: 1, fontSize: FONT.base, fontWeight: '700', color: C.text },
  planCount:    { fontSize: FONT.sm, fontWeight: '700' },
  progressTrack: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill:  { height: 6, borderRadius: 3 },
  progressPct:   { fontSize: FONT.xs, fontWeight: '600' },

  emptyCard:  { borderRadius: R.xl, borderWidth: 1, padding: SP.xxxl, alignItems: 'center', gap: SP.md },
  emptyTitle: { fontSize: FONT.md, fontWeight: '700' },
  emptySub:   { fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },
});
