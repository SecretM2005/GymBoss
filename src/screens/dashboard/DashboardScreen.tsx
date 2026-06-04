import React, { useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { usePlanStore } from '../../store/planStore';
import { useAthletenStore } from '../../store/athletenStore';
import { useFeedbackStore, Feedback } from '../../store/feedbackStore';
import { useGamificationStore } from '../../store/gamificationStore';
import { useSessionLogStore } from '../../store/sessionLogStore';
import { getPlannedEinheiten, overallComplianceRate, getComplianceColor } from '../../utils/compliance';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import { C, useColors, SP, R, FONT, FONT_MONO, SHADOW_SM } from '../../theme';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const MONATE_KURZ = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const WOCHENTAGE = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const WOCHENTAGE_LANG = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

function isoToday(): string {
  return new Date().toISOString().split('T')[0];
}

function isoOf(d: Date): string {
  return d.toISOString().split('T')[0];
}

function getWeekDates(today: Date): Date[] {
  const dow = (today.getDay() + 6) % 7; // Mon = 0
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Guten Morgen';
  if (h < 17) return 'Guten Tag';
  return 'Guten Abend';
}

function relativeDate(iso: string): string {
  const diff = Math.floor((new Date().getTime() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Heute';
  if (diff === 1) return 'Gestern';
  if (diff < 7) return `vor ${diff} Tagen`;
  const d = new Date(iso);
  return `${d.getDate()}. ${MONATE_KURZ[d.getMonth()]}`;
}

function formatUpcomingDate(iso: string): string {
  const today = isoToday();
  const tomorrow = isoOf(new Date(new Date().getTime() + 86400000));
  if (iso === today) return 'Heute';
  if (iso === tomorrow) return 'Morgen';
  const d = new Date(iso);
  return `${WOCHENTAGE_LANG[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${MONATE_KURZ[d.getMonth()]}`;
}

function rpeColor(rpe: number): string {
  if (rpe <= 4) return C.success;
  if (rpe <= 6) return C.accent;
  if (rpe <= 8) return '#FFB74D';
  return C.warn;
}

const SPORTART_COLORS: Record<string, { bg: string; fg: string }> = {
  'Kraftsport':      { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E' },
  'Kampfsport':      { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66' },
  'Leichtathletik':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF' },
  'Konditionierung': { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF' },
  'Mobility':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF' },
  'Crossfit':        { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582' },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function Stars({ value, size = 13 }: { value: number; size?: number }) {
  const C = useColors();
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Ionicons key={i} name={i <= value ? 'star' : 'star-outline'} size={size} color={i <= value ? '#FFD166' : C.textDim} />
      ))}
    </View>
  );
}

function KpiTile({ icon, label, value, sub, accent }: {
  icon: string; label: string; value: string; sub?: string; accent?: boolean;
}) {
  const C = useColors();
  return (
    <View style={[kpi.tile, accent && kpi.tileAccent, { backgroundColor: accent ? C.accent : C.surface, borderColor: accent ? C.accent : C.border }]}>
      <View style={[kpi.iconWrap, accent && kpi.iconWrapAccent, !accent && { backgroundColor: C.accentLight }]}>
        <GBIcon name={icon as any} size={18} color={accent ? C.accentContrast : C.accent} />
      </View>
      <Text style={[kpi.value, accent && kpi.valueAccent, { color: accent ? C.accentContrast : C.text }]}>{value}</Text>
      <Text style={[kpi.label, accent && kpi.labelAccent, !accent && { color: C.textMuted }]}>{label}</Text>
      {sub ? <Text style={[kpi.sub, accent && kpi.subAccent, !accent && { color: C.textDim }]}>{sub}</Text> : null}
    </View>
  );
}

const kpi = StyleSheet.create({
  tile:          { flex: 1, backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.md, gap: SP.xs, minHeight: 100 },
  tileAccent:    { backgroundColor: C.accent, borderColor: C.accent },
  iconWrap:      { width: 34, height: 34, borderRadius: R.md, backgroundColor: C.accentLight, alignItems: 'center', justifyContent: 'center', marginBottom: 2 },
  iconWrapAccent:{ backgroundColor: 'rgba(0,0,0,0.18)' },
  value:         { fontSize: FONT.lg, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  valueAccent:   { color: C.accentContrast },
  label:         { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 0.4 },
  labelAccent:   { color: 'rgba(11,11,13,0.65)' },
  sub:           { fontSize: 10, fontWeight: '600', color: C.textDim },
  subAccent:     { color: 'rgba(11,11,13,0.5)' },
});

function SectionHeader({ label, count, onMore }: { label: string; count?: number; onMore?: () => void }) {
  const C = useColors();
  return (
    <View style={s.sectionHeader}>
      <Text style={[s.sectionLabel, { color: C.textMuted }]}>{label}</Text>
      {count !== undefined && <Text style={[s.sectionCount, { color: C.textDim }]}>{count}</Text>}
      {onMore && (
        <TouchableOpacity onPress={onMore} style={s.sectionMoreBtn} activeOpacity={0.7}>
          <Text style={[s.sectionMore, { color: C.accent }]}>Alle</Text>
          <GBIcon name="chevronRight" size={12} color={C.accent} />
        </TouchableOpacity>
      )}
    </View>
  );
}

function FeedbackCard({ fb, sportlerName, sportlerInitials }: {
  fb: Feedback; sportlerName: string; sportlerInitials: string;
}) {
  const C = useColors();
  return (
    <View style={[fbCard.wrap, { backgroundColor: C.surface, borderColor: C.border }]}>
      <GBAvatar name={sportlerName} initials={sportlerInitials} size={40} />
      <View style={{ flex: 1, gap: 4 }}>
        <View style={fbCard.topRow}>
          <Text style={[fbCard.name, { color: C.text }]} numberOfLines={1}>{sportlerName}</Text>
          <Text style={[fbCard.date, { color: C.textDim }]}>{relativeDate(fb.datum)}</Text>
        </View>
        <Text style={[fbCard.einheit, { color: C.textMuted }]}>{fb.einheitName}</Text>
        <View style={fbCard.ratingRow}>
          <Stars value={fb.bewertung} />
          <View style={[fbCard.rpePill, { backgroundColor: `${rpeColor(fb.rpe)}22` }]}>
            <Text style={[fbCard.rpeText, { color: rpeColor(fb.rpe) }]}>RPE {fb.rpe}</Text>
          </View>
        </View>
        {fb.notiz ? (
          <Text style={[fbCard.notiz, { color: C.textSub }]} numberOfLines={2}>„{fb.notiz}"</Text>
        ) : null}
      </View>
    </View>
  );
}

const fbCard = StyleSheet.create({
  wrap:      { flexDirection: 'row', gap: SP.md, backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.md },
  topRow:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: SP.sm },
  name:      { fontSize: FONT.base, fontWeight: '700', color: C.text, flex: 1 },
  date:      { fontSize: 11, fontWeight: '600', color: C.textDim },
  einheit:   { fontSize: FONT.sm, fontWeight: '600', color: C.textMuted },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  rpePill:   { paddingHorizontal: 7, paddingVertical: 2, borderRadius: R.full },
  rpeText:   { fontSize: 11, fontWeight: '800', letterSpacing: 0.3 },
  notiz:     { fontSize: FONT.xs, color: C.textSub, lineHeight: 17, fontStyle: 'italic' },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { plaene } = usePlanStore();
  const { sportler } = useAthletenStore();
  const { feedback } = useFeedbackStore();
  const gamification = useGamificationStore();
  const { logs } = useSessionLogStore();
  const C = useColors();

  const today = new Date();
  const todayIso = isoToday();
  const weekDates = getWeekDates(today);

  // Collect all einheiten from all plans (with datum)
  const allEinheiten = useMemo(() =>
    plaene.flatMap((plan) =>
      plan.wochen.flatMap((w) =>
        w.einheiten
          .filter((e) => !!e.datum)
          .map((e) => ({ einheit: e, plan, wocheId: w.id }))
      )
    ),
    [plaene]
  );

  // Days this week with training
  const weekTrainingDays = useMemo(() => {
    const days = new Set<string>();
    const weekIsos = weekDates.map(isoOf);
    allEinheiten.forEach(({ einheit }) => {
      if (einheit.datum && weekIsos.includes(einheit.datum)) days.add(einheit.datum);
    });
    return days;
  }, [allEinheiten, weekDates]);

  // Upcoming einheiten (today + next 7 days), sorted
  const upcoming = useMemo(() => {
    const limitIso = isoOf(new Date(today.getTime() + 7 * 86400000));
    return allEinheiten
      .filter(({ einheit }) => einheit.datum! >= todayIso && einheit.datum! <= limitIso)
      .sort((a, b) => a.einheit.datum!.localeCompare(b.einheit.datum!))
      .slice(0, 5);
  }, [allEinheiten, todayIso]);

  // KPIs
  const avgBewertung = useMemo(() => {
    if (!feedback.length) return null;
    const avg = feedback.slice(0, 10).reduce((sum, f) => sum + f.bewertung, 0) / Math.min(feedback.length, 10);
    return avg.toFixed(1);
  }, [feedback]);

  const weekEinheitenCount = weekTrainingDays.size === 0
    ? allEinheiten.filter(({ einheit }) => {
        const weekIsos = weekDates.map(isoOf);
        return einheit.datum && weekIsos.includes(einheit.datum);
      }).length
    : allEinheiten.filter(({ einheit }) => weekTrainingDays.has(einheit.datum!)).length;

  const getSportler = (id: string) => sportler.find((s) => s.id === id);

  // Trainer score
  const trainerScore = gamification.getTrainerScore(
    sportler.map((s) => s.id),
    Object.fromEntries(sportler.map((sp) => [sp.id, logs.filter((l) => l.sportlerId === sp.id)])),
    Object.fromEntries(sportler.map((sp) => [sp.id, getPlannedEinheiten(plaene, sp.id)])),
  );
  const scoreLabel = trainerScore >= 71 ? 'Elite' : trainerScore >= 41 ? 'Erfahren' : 'Einsteiger';

  // Date header
  const dateLabel = `${WOCHENTAGE_LANG[(today.getDay() + 6) % 7]}, ${today.getDate()}. ${MONATE[today.getMonth()]} ${today.getFullYear()}`;

  return (
    <View style={[s.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.headerLeft}>
            <Text style={[s.greeting, { color: C.text }]}>{getGreeting()}</Text>
            <Text style={[s.dateText, { color: C.textMuted }]}>{dateLabel}</Text>
          </View>
          <View style={{ alignItems: 'flex-end', gap: 6 }}>
            <View style={[s.logo, { backgroundColor: C.accent }]}>
              <Text style={[s.logoText, { color: C.accentContrast }]}>GB</Text>
            </View>
            <View style={[s.scoreBadge, { backgroundColor: C.surface, borderColor: C.border }]}>
              <Text style={[s.scoreVal, { color: C.accent }]}>{trainerScore}</Text>
              <Text style={[s.scoreLabel, { color: C.textMuted }]}>{scoreLabel}</Text>
            </View>
          </View>
        </View>

        {/* ── KPI Grid ── */}
        <View style={s.kpiGrid}>
          <View style={s.kpiRow}>
            <KpiTile
              icon="users"
              label="Sportler"
              value={String(sportler.length)}
              sub={`${plaene.reduce((n, p) => n + p.sportlerIds.length, 0)} Zuw.`}
            />
            <KpiTile
              icon="layers"
              label="Pläne"
              value={String(plaene.length)}
              sub={`${plaene.reduce((n, p) => n + p.wochen.length, 0)} Wochen`}
            />
          </View>
          <View style={s.kpiRow}>
            <KpiTile
              icon="calendar"
              label="Diese Woche"
              value={weekEinheitenCount === 0 ? '—' : String(weekEinheitenCount)}
              sub={weekEinheitenCount === 0 ? 'Keine geplant' : 'Einheiten'}
            />
            <KpiTile
              icon="starFill"
              label="Ø Bewertung"
              value={avgBewertung ? `${avgBewertung} ★` : '—'}
              sub={avgBewertung ? `aus ${Math.min(feedback.length, 10)} Einh.` : 'Kein Feedback'}
              accent={!!avgBewertung && Number(avgBewertung) >= 4}
            />
          </View>
        </View>

        {/* ── Wochenstreifen ── */}
        <View style={[s.weekCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[s.weekCardTitle, { color: C.textMuted }]}>Diese Woche</Text>
          <View style={s.weekStrip}>
            {weekDates.map((date, i) => {
              const iso = isoOf(date);
              const isToday = iso === todayIso;
              const hasTrain = weekTrainingDays.has(iso);
              const isPast = iso < todayIso;
              return (
                <View key={i} style={s.weekDay}>
                  <Text style={[s.weekDayLabel, isToday && s.weekDayLabelToday, { color: isToday ? C.accent : C.textDim }]}>
                    {WOCHENTAGE[i]}
                  </Text>
                  <View style={[
                    s.weekDayCircle,
                    isToday && s.weekDayCircleToday,
                    hasTrain && !isToday && s.weekDayCircleTrain,
                    isToday && { backgroundColor: C.accent },
                  ]}>
                    <Text style={[
                      s.weekDayNum,
                      isToday && s.weekDayNumToday,
                      hasTrain && !isToday && s.weekDayNumTrain,
                      isPast && !isToday && !hasTrain && s.weekDayNumPast,
                      { color: isToday ? C.accentContrast : hasTrain ? C.accent : isPast ? C.textDim : C.textSub },
                    ]}>
                      {date.getDate()}
                    </Text>
                  </View>
                  {hasTrain && <View style={[s.weekDot, isToday && s.weekDotToday, { backgroundColor: isToday ? C.accentContrast : C.accent }]} />}
                </View>
              );
            })}
          </View>
        </View>

        {/* ── Anstehende Einheiten ── */}
        <SectionHeader label="Anstehend" count={upcoming.length} />

        {upcoming.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <GBIcon name="calendar" size={26} color={C.textDim} />
            <Text style={[s.emptyTitle, { color: C.textSub }]}>Keine geplanten Einheiten</Text>
            <Text style={[s.emptySub, { color: C.textDim }]}>Weise Einheiten im Kalender einem Datum zu.</Text>
          </View>
        ) : (
          upcoming.map(({ einheit, plan }) => {
            const sc = SPORTART_COLORS[plan.sportart ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted };
            const assignedNames = sportler
              .filter((sp) => plan.sportlerIds.includes(sp.id))
              .map((sp) => sp.name.split(' ')[0])
              .join(', ');
            const dateStr = formatUpcomingDate(einheit.datum!);
            const isToday = einheit.datum === todayIso;
            return (
              <View key={einheit.id} style={[s.upcomingCard, { backgroundColor: C.surface, borderColor: C.border }, isToday && s.upcomingCardToday]}>
                <View style={[s.upcomingStripe, { backgroundColor: sc.fg }]} />
                <View style={s.upcomingBody}>
                  <View style={s.upcomingTop}>
                    <Text style={[s.upcomingName, { color: C.text }]}>{einheit.name}</Text>
                    <View style={[s.upcomingDatePill, { backgroundColor: C.surfaceAlt }, isToday && s.upcomingDatePillToday]}>
                      <Text style={[s.upcomingDateText, { color: C.textDim }, isToday && s.upcomingDateTextToday]}>{dateStr}</Text>
                    </View>
                  </View>
                  <View style={s.upcomingMeta}>
                    <Text style={[s.upcomingPlan, { color: C.textMuted }]} numberOfLines={1}>{plan.name}</Text>
                    {assignedNames ? (
                      <View style={s.upcomingAthletes}>
                        <GBIcon name="user" size={11} color={C.textDim} />
                        <Text style={[s.upcomingAthleteText, { color: C.textDim }]}>{assignedNames}</Text>
                      </View>
                    ) : null}
                  </View>
                  {(einheit.warmup.length + einheit.haupteinheit.length + einheit.cooldown.length) > 0 && (
                    <View style={s.upcomingPhases}>
                      {einheit.warmup.length > 0 && (
                        <View style={[s.phasePill, { backgroundColor: 'rgba(255,138,102,0.15)' }]}>
                          <Text style={[s.phasePillText, { color: '#FF8A66' }]}>
                            WU {einheit.warmup.length}
                          </Text>
                        </View>
                      )}
                      {einheit.haupteinheit.length > 0 && (
                        <View style={[s.phasePill, { backgroundColor: C.accentLight }]}>
                          <Text style={[s.phasePillText, { color: C.accent }]}>
                            {einheit.haupteinheit.length} Übungen
                          </Text>
                        </View>
                      )}
                      {einheit.cooldown.length > 0 && (
                        <View style={[s.phasePill, { backgroundColor: 'rgba(122,191,255,0.15)' }]}>
                          <Text style={[s.phasePillText, { color: '#7ABFFF' }]}>
                            CD {einheit.cooldown.length}
                          </Text>
                        </View>
                      )}
                    </View>
                  )}
                </View>
              </View>
            );
          })
        )}

        {/* ── Compliance Übersicht ── */}
        {sportler.length > 0 && (
          <View style={[s.complianceCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.cardTitle, { color: C.text }]}>Compliance Übersicht</Text>
            {sportler.slice(0, 5).map((sp) => {
              const spLogs = logs.filter((l) => l.sportlerId === sp.id);
              const spEinheiten = getPlannedEinheiten(plaene, sp.id);
              const rate = overallComplianceRate(spLogs, spEinheiten);
              const color = getComplianceColor(rate);
              return (
                <View key={sp.id} style={s.complianceRow}>
                  <GBAvatar name={sp.name} initials={sp.initials} size={28} />
                  <Text style={[s.complianceName, { color: C.text }]} numberOfLines={1}>{sp.name}</Text>
                  <View style={[s.complianceBar, { backgroundColor: C.surfaceAlt }]}>
                    <View style={[s.complianceFill, { width: `${Math.round(rate * 100)}%` as any, backgroundColor: color }]} />
                  </View>
                  <Text style={[s.compliancePct, { color }]}>{Math.round(rate * 100)}%</Text>
                </View>
              );
            })}
          </View>
        )}

        {/* ── Letzte Bewertungen ── */}
        <SectionHeader label="Letzte Bewertungen" count={feedback.length} />

        {feedback.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <GBIcon name="starFill" size={26} color={C.textDim} />
            <Text style={[s.emptyTitle, { color: C.textSub }]}>Noch kein Feedback</Text>
            <Text style={[s.emptySub, { color: C.textDim }]}>Athleten-Bewertungen erscheinen hier.</Text>
          </View>
        ) : (
          feedback.slice(0, 5).map((fb) => {
            const sp = getSportler(fb.sportlerId);
            if (!sp) return null;
            return (
              <FeedbackCard
                key={fb.id}
                fb={fb}
                sportlerName={sp.name}
                sportlerInitials={sp.initials}
              />
            );
          })
        )}

        {/* ── Aktive Pläne ── */}
        <SectionHeader
          label="Aktive Pläne"
          count={plaene.length}
          onMore={() => navigation.navigate('Plaene')}
        />

        {plaene.length === 0 ? (
          <View style={[s.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <GBIcon name="dumbbell" size={26} color={C.textDim} />
            <Text style={[s.emptyTitle, { color: C.textSub }]}>Keine Pläne vorhanden</Text>
          </View>
        ) : (
          <View style={s.planRow}>
            {plaene.slice(0, 3).map((plan) => {
              const sc = SPORTART_COLORS[plan.sportart ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted };
              const assignedSportler = sportler.filter((sp) => plan.sportlerIds.includes(sp.id));
              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[s.planMini, { backgroundColor: C.surface, borderColor: C.border }]}
                  activeOpacity={0.8}
                  onPress={() => navigation.navigate('Plaene', { screen: 'PlanDetail', params: { planId: plan.id } })}
                >
                  <View style={[s.planMiniStripe, { backgroundColor: sc.fg }]} />
                  <Text style={[s.planMiniName, { color: C.text }]} numberOfLines={2}>{plan.name}</Text>
                  {plan.sportart && (
                    <View style={[s.planMiniChip, { backgroundColor: sc.bg }]}>
                      <Text style={[s.planMiniChipText, { color: sc.fg }]}>{plan.sportart}</Text>
                    </View>
                  )}
                  <View style={s.planMiniFooter}>
                    <Text style={[s.planMiniStat, { color: C.textDim }]}>{plan.wochen.length} Wo.</Text>
                    <View style={{ flexDirection: 'row', gap: 2 }}>
                      {assignedSportler.slice(0, 3).map((sp) => (
                        <GBAvatar key={sp.id} name={sp.name} initials={sp.initials} size={20} />
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* ── Schnellzugriff ── */}
        <View style={s.quickRow}>
          <TouchableOpacity
            style={s.quickBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Sportler', { screen: 'SportlerForm' })}
          >
            <GBIcon name="plus" size={16} color={C.accent} />
            <Text style={[s.quickBtnText, { color: C.accent }]}>Sportler</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={s.quickBtn}
            activeOpacity={0.8}
            onPress={() => navigation.navigate('Plaene', { screen: 'PlanForm' })}
          >
            <GBIcon name="plus" size={16} color={C.accent} />
            <Text style={[s.quickBtnText, { color: C.accent }]}>Trainingsplan</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  scroll: { paddingHorizontal: SP.xl, paddingTop: SP.md, gap: SP.lg },

  // Header
  header:     { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  headerLeft: { gap: 3 },
  greeting:   { fontSize: FONT.xxl, fontWeight: '800', color: C.text, letterSpacing: -0.8, lineHeight: 34 },
  dateText:   { fontSize: FONT.sm, color: C.textMuted, fontWeight: '500' },
  logo:       { width: 44, height: 44, borderRadius: R.lg, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  logoText:   { fontSize: FONT.base, fontWeight: '900', color: C.accentContrast, letterSpacing: 0.5 },

  // KPI
  kpiGrid: { gap: SP.sm },
  kpiRow:  { flexDirection: 'row', gap: SP.sm },

  // Week strip
  weekCard:       { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.lg, gap: SP.md },
  weekCardTitle:  { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 },
  weekStrip:      { flexDirection: 'row', justifyContent: 'space-between' },
  weekDay:        { alignItems: 'center', gap: 4, flex: 1 },
  weekDayLabel:   { fontSize: 10, fontWeight: '700', color: C.textDim, letterSpacing: 0.4 },
  weekDayLabelToday: { color: C.accent },
  weekDayCircle:  { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  weekDayCircleToday: { backgroundColor: C.accent },
  weekDayCircleTrain: { backgroundColor: C.accentLight, borderWidth: 1, borderColor: 'rgba(203,255,62,0.30)' },
  weekDayNum:     { fontFamily: FONT_MONO, fontSize: FONT.sm, fontWeight: '600', color: C.textSub },
  weekDayNumToday: { color: C.accentContrast, fontWeight: '800' },
  weekDayNumTrain: { color: C.accent, fontWeight: '700' },
  weekDayNumPast: { color: C.textDim },
  weekDot:        { width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  weekDotToday:   { backgroundColor: C.accentContrast },

  // Section header
  sectionHeader:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm, marginBottom: -SP.xs },
  sectionLabel:   { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.6, flex: 1 },
  sectionCount:   { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '600', color: C.textDim },
  sectionMoreBtn: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionMore:    { fontSize: FONT.xs, fontWeight: '700', color: C.accent },

  // Empty state
  emptyCard:  { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.xl, alignItems: 'center', gap: SP.sm },
  emptyTitle: { fontSize: FONT.base, fontWeight: '700', color: C.textSub },
  emptySub:   { fontSize: FONT.sm, color: C.textDim, textAlign: 'center' },

  // Upcoming einheiten
  upcomingCard:         { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  upcomingCardToday:    { borderColor: 'rgba(203,255,62,0.30)' },
  upcomingStripe:       { width: 3 },
  upcomingBody:         { flex: 1, padding: SP.md, gap: SP.xs },
  upcomingTop:          { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: SP.sm },
  upcomingName:         { fontSize: FONT.base, fontWeight: '700', color: C.text, flex: 1, lineHeight: 20 },
  upcomingDatePill:     { backgroundColor: C.surfaceAlt, borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 3 },
  upcomingDatePillToday:{ backgroundColor: C.accentLight },
  upcomingDateText:     { fontFamily: FONT_MONO, fontSize: 11, fontWeight: '600', color: C.textDim },
  upcomingDateTextToday:{ color: C.accent },
  upcomingMeta:         { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  upcomingPlan:         { fontSize: FONT.sm, color: C.textMuted, flex: 1 },
  upcomingAthletes:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  upcomingAthleteText:  { fontSize: 11, color: C.textDim, fontWeight: '600' },
  upcomingPhases:       { flexDirection: 'row', gap: SP.xs, flexWrap: 'wrap' },
  phasePill:            { paddingHorizontal: 7, paddingVertical: 2, borderRadius: R.full },
  phasePillText:        { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },

  // Plan mini cards
  planRow:           { flexDirection: 'row', gap: SP.sm },
  planMini:          { flex: 1, backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden', minHeight: 110 },
  planMiniStripe:    { height: 3 },
  planMiniName:      { fontSize: FONT.sm, fontWeight: '700', color: C.text, paddingHorizontal: SP.md, paddingTop: SP.sm, lineHeight: 18 },
  planMiniChip:      { alignSelf: 'flex-start', marginHorizontal: SP.md, marginTop: 4, paddingHorizontal: 6, paddingVertical: 2, borderRadius: R.full },
  planMiniChipText:  { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  planMiniFooter:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.md, paddingBottom: SP.sm, marginTop: 'auto', paddingTop: SP.sm },
  planMiniStat:      { fontFamily: FONT_MONO, fontSize: 11, color: C.textDim, fontWeight: '600' },

  // Quick actions
  quickRow:   { flexDirection: 'row', gap: SP.sm },
  quickBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, paddingVertical: SP.md, borderRadius: R.lg, borderWidth: 1.5, borderStyle: 'dashed', borderColor: 'rgba(203,255,62,0.35)', backgroundColor: 'rgba(203,255,62,0.04)' },
  quickBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accent },

  // Trainer score
  scoreBadge: { paddingHorizontal: SP.md, paddingVertical: SP.xs, borderRadius: R.full, borderWidth: 1, alignItems: 'center' },
  scoreVal:   { fontSize: FONT.lg, fontWeight: '800' },
  scoreLabel: { fontSize: 10, fontWeight: '600' },

  // Compliance card
  complianceCard: { borderRadius: R.xl, borderWidth: 1, padding: SP.md, gap: SP.sm },
  cardTitle:      { fontSize: FONT.base, fontWeight: '700', color: C.text },
  complianceRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  complianceName: { flex: 1, fontSize: FONT.sm, fontWeight: '600' },
  complianceBar:  { width: 80, height: 6, borderRadius: 3, overflow: 'hidden' },
  complianceFill: { height: 6, borderRadius: 3 },
  compliancePct:  { fontSize: FONT.xs, fontWeight: '700', width: 32, textAlign: 'right' },
});
