import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import Svg, { Rect, Line, Text as SvgText } from 'react-native-svg';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MehrStackParamList, WorkoutFeedback } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useSessionLogStore } from '../../store/sessionLogStore';
import { useAthletenStore } from '../../store/athletenStore';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

type Props = {
  navigation: StackNavigationProp<MehrStackParamList, 'Fortschritt'>;
};

const SCREEN_W = Dimensions.get('window').width - SP.xl * 2 - SP.lg * 2;
const BAR_W = SCREEN_W;

// Weekly workout counts over last 8 weeks
function useWeeklyStats(logs: WorkoutFeedback[]) {
  return useMemo(() => {
    const now = Date.now();
    const weeks: { label: string; count: number }[] = [];
    for (let w = 7; w >= 0; w--) {
      const start = new Date(now - (w + 1) * 7 * 86400000);
      const end   = new Date(now - w * 7 * 86400000);
      const count = logs.filter((l) => {
        const d = new Date(l.datum);
        return l.abgeschlossen && d >= start && d < end;
      }).length;
      const weekStart = new Date(now - (w + 1) * 7 * 86400000);
      const label = `${weekStart.getDate()}.${weekStart.getMonth() + 1}`;
      weeks.push({ label, count });
    }
    return weeks;
  }, [logs]);
}

function BarChart({ data, C }: {
  data: { label: string; count: number }[];
  C: ReturnType<typeof useColors>;
}) {
  const maxVal = Math.max(...data.map((d) => d.count), 1);
  const chartH = 120;
  const barW   = (BAR_W - 40) / data.length - 6;

  return (
    <Svg width={BAR_W} height={chartH + 28}>
      {/* Y-axis lines */}
      {[0, 0.5, 1].map((f) => (
        <Line
          key={f}
          x1={0} y1={chartH * (1 - f)}
          x2={BAR_W} y2={chartH * (1 - f)}
          stroke={C.border} strokeWidth={1}
        />
      ))}
      {data.map((d, i) => {
        const x   = 4 + i * (barW + 6);
        const h   = Math.max((d.count / maxVal) * chartH, d.count > 0 ? 4 : 0);
        const y   = chartH - h;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x} y={y} width={barW} height={h}
              rx={4} fill={d.count > 0 ? C.accent : C.surfaceAlt}
            />
            <SvgText
              x={x + barW / 2} y={chartH + 18}
              textAnchor="middle"
              fontSize={9} fill={C.textDim}
              fontFamily="System"
            >
              {d.label}
            </SvgText>
            {d.count > 0 && (
              <SvgText
                x={x + barW / 2} y={y - 4}
                textAnchor="middle"
                fontSize={9} fill={C.accent}
                fontFamily="System" fontWeight="700"
              >
                {d.count}
              </SvgText>
            )}
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

export default function FortschrittScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { plaene } = usePlanStore();
  const { logs } = useSessionLogStore();
  const { sportler } = useAthletenStore();

  const weeklyStats = useWeeklyStats(logs);
  const totalDone = logs.filter((l) => l.abgeschlossen).length;
  const avgRpe = useMemo(() => {
    const done = logs.filter((l) => l.abgeschlossen && l.rpe > 0);
    if (!done.length) return 0;
    return Math.round(done.reduce((s, l) => s + l.rpe, 0) / done.length * 10) / 10;
  }, [logs]);
  const avgBewertung = useMemo(() => {
    const done = logs.filter((l) => l.abgeschlossen && l.bewertung > 0);
    if (!done.length) return 0;
    return Math.round(done.reduce((s, l) => s + l.bewertung, 0) / done.length * 10) / 10;
  }, [logs]);

  // Per-plan progress
  const planProgress = useMemo(() =>
    plaene.map((plan) => {
      const allE = plan.wochen.flatMap((w) => w.einheiten);
      const done = allE.filter((e) =>
        plan.sportlerIds.some((sid) => logs.find((l) => l.workoutId === e.id && l.sportlerId === sid && l.abgeschlossen))
      ).length;
      const pct = allE.length > 0 ? done / allE.length : 0;
      return { plan, done, total: allE.length, pct };
    }),
  [plaene, logs]);

  // Per-sportler stats
  const sportlerStats = useMemo(() =>
    sportler.map((sp) => {
      const spLogs = logs.filter((l) => l.sportlerId === sp.id && l.abgeschlossen);
      const avgR = spLogs.length
        ? Math.round(spLogs.reduce((s, l) => s + l.bewertung, 0) / spLogs.length * 10) / 10
        : 0;
      return { sp, count: spLogs.length, avgRating: avgR };
    }).sort((a, b) => b.count - a.count),
  [sportler, logs]);

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <View style={[s.topBar, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.iconBtn, { backgroundColor: C.surface }]}
          activeOpacity={0.7}
        >
          <GBIcon name="chevronLeft" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={[s.tileIcon, { backgroundColor: 'rgba(203,255,62,0.10)' }]}>
          <GBIcon name="barChart" size={18} color={C.accent} />
        </View>
        <Text style={[s.headerTitle, { color: C.text }]}>Fortschritt & Statistiken</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* KPI Row */}
        <View style={s.kpiRow}>
          <View style={[s.kpiCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.kpiValue, { color: C.accent }]}>{totalDone}</Text>
            <Text style={[s.kpiLabel, { color: C.textDim }]}>Einheiten{'\n'}abgeschlossen</Text>
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

        {/* Weekly Bar Chart */}
        <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[s.cardTitle, { color: C.text }]}>Trainingsvolumen (8 Wochen)</Text>
          <Text style={[s.cardSub, { color: C.textDim }]}>Abgeschlossene Einheiten pro Woche</Text>
          <View style={s.chartWrap}>
            <BarChart data={weeklyStats} C={C} />
          </View>
        </View>

        {/* Plan Progress */}
        {planProgress.length > 0 && (
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: C.textDim }]}>PLAN-FORTSCHRITT</Text>
            {planProgress.map(({ plan, done, total, pct }) => (
              <View key={plan.id} style={[s.planRow, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={s.planRowTop}>
                  <Text style={[s.planName, { color: C.text }]} numberOfLines={1}>{plan.name}</Text>
                  <Text style={[s.planCount, { color: C.textMuted, fontFamily: FONT_MONO }]}>
                    {done}/{total}
                  </Text>
                </View>
                <View style={[s.progressBar, { backgroundColor: C.surfaceAlt }]}>
                  <View
                    style={[
                      s.progressFill,
                      { width: `${Math.round(pct * 100)}%`, backgroundColor: pct === 1 ? C.accent : '#7ABFFF' },
                    ]}
                  />
                </View>
                <Text style={[s.progressPct, { color: pct === 1 ? C.accent : C.textDim }]}>
                  {Math.round(pct * 100)}% abgeschlossen
                  {pct === 1 ? ' ✓' : ''}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Per-Sportler Leaderboard */}
        {sportlerStats.some((s) => s.count > 0) && (
          <View style={s.section}>
            <Text style={[s.sectionLabel, { color: C.textDim }]}>SPORTLER ÜBERSICHT</Text>
            <View style={[s.card, { backgroundColor: C.surface, borderColor: C.border, gap: 0, padding: 0 }]}>
              {sportlerStats.filter((s) => s.count > 0).map((item, i) => (
                <View
                  key={item.sp.id}
                  style={[s.sportlerRow, { borderBottomColor: C.border }, i > 0 && { borderTopWidth: 1, borderTopColor: C.border }]}
                >
                  <View style={[s.rankBadge, { backgroundColor: i === 0 ? 'rgba(203,255,62,0.15)' : C.surfaceAlt }]}>
                    <Text style={[s.rankText, { color: i === 0 ? C.accent : C.textDim }]}>{i + 1}</Text>
                  </View>
                  <Text style={[s.sportlerName, { color: C.text }]}>{item.sp.name}</Text>
                  <View style={{ flex: 1 }} />
                  <Text style={[s.sportlerCount, { color: C.textMuted, fontFamily: FONT_MONO }]}>
                    {item.count} ✓
                  </Text>
                  {item.avgRating > 0 && (
                    <Text style={[s.sportlerRating, { color: '#FFD166' }]}>
                      {item.avgRating}★
                    </Text>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {totalDone === 0 && (
          <View style={[s.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <GBIcon name="barChart" size={40} color={C.textDim} />
            <Text style={[s.emptyTitle, { color: C.textSub }]}>Noch keine Daten</Text>
            <Text style={[s.emptySub, { color: C.textDim }]}>
              Schließe Trainingseinheiten ab, um Statistiken zu sehen.
            </Text>
          </View>
        )}

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  topBar:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderBottomWidth: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: -0.4, color: C.text },

  content: { padding: SP.xl, gap: SP.lg },

  kpiRow:  { flexDirection: 'row', gap: SP.sm },
  kpiCard: { flex: 1, borderRadius: R.lg, borderWidth: 1, padding: SP.md, alignItems: 'center', gap: 4 },
  kpiValue: { fontFamily: FONT_MONO, fontSize: FONT.lg, fontWeight: '800' },
  kpiLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', lineHeight: 13 },

  card:      { borderRadius: R.xl, borderWidth: 1, padding: SP.lg, gap: SP.sm },
  cardTitle: { fontSize: FONT.base, fontWeight: '700', color: C.text },
  cardSub:   { fontSize: FONT.xs, color: C.textDim },
  chartWrap: { marginTop: SP.sm },

  section:      { gap: SP.sm },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1.6, paddingHorizontal: 2 },

  planRow:    { borderRadius: R.lg, borderWidth: 1, padding: SP.md, gap: SP.sm },
  planRowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planName:   { flex: 1, fontSize: FONT.base, fontWeight: '700', color: C.text },
  planCount:  { fontSize: FONT.sm, fontWeight: '700' },
  progressBar:  { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3 },
  progressPct:  { fontSize: FONT.xs, fontWeight: '600' },

  sportlerRow:   { flexDirection: 'row', alignItems: 'center', gap: SP.sm, padding: SP.md },
  rankBadge:     { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  rankText:      { fontFamily: FONT_MONO, fontSize: 11, fontWeight: '800' },
  sportlerName:  { fontSize: FONT.base, fontWeight: '600', color: C.text },
  sportlerCount: { fontSize: FONT.sm, fontWeight: '700' },
  sportlerRating: { fontSize: FONT.sm, fontWeight: '700' },

  emptyCard:  { borderRadius: R.xl, borderWidth: 1, padding: SP.xxxl, alignItems: 'center', gap: SP.md },
  emptyTitle: { fontSize: FONT.md, fontWeight: '700' },
  emptySub:   { fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },
});
