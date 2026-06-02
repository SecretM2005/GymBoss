import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeinTrainingStackParamList, TrainingsPlan, Einheit } from '../../types';
import { exportPlanAsPdf } from '../../utils/planPdfExport';
import { usePlanStore } from '../../store/planStore';
import { useSettingsStore } from '../../store/settingsStore';
import { useAthletenStore } from '../../store/athletenStore';
import { useSessionLogStore } from '../../store/sessionLogStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import MonthCalendar from '../../components/MonthCalendar';
import { buildUebSuffix, formatWocheRange } from '../plaene/EinheitDetailScreen';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<MeinTrainingStackParamList, 'MeinTrainingMain'>;
};

const MONATE_KURZ = ['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'];
const WOCHENTAGE_LANG = ['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'];

const SPORTART_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  'Kraftsport':      { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E', dot: '#CBFF3E' },
  'Kampfsport':      { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66', dot: '#FF6A3D' },
  'Leichtathletik':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Konditionierung': { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Mobility':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF', dot: '#C39CFF' },
  'Crossfit':        { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582', dot: '#7AE582' },
};

function parseDatum(str: string): Date | null {
  const p = str.split('.');
  if (p.length === 3) return new Date(parseInt(p[2]), parseInt(p[1]) - 1, parseInt(p[0]));
  return null;
}

function getWocheIdForDate(plan: TrainingsPlan, year: number, month: number, day: number): string | null {
  if (plan.wochen.length === 0) return null;
  if (plan.wochen.length === 1) return plan.wochen[0].id;
  if (plan.startdatum) {
    const start = parseDatum(plan.startdatum);
    if (start) {
      const target = new Date(year, month, day);
      const diffDays = Math.floor((target.getTime() - start.getTime()) / 86400000);
      if (diffDays >= 0) {
        const woche = plan.wochen.find((w) => w.wochennummer === Math.floor(diffDays / 7) + 1);
        if (woche) return woche.id;
      }
    }
  }
  return plan.wochen[0].id;
}

function isoDate(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function formatDay(iso: string): string {
  const d = new Date(iso);
  return `${WOCHENTAGE_LANG[(d.getDay() + 6) % 7]}, ${d.getDate()}. ${MONATE_KURZ[d.getMonth()]}`;
}

export default function SportlerAppPlanScreen({ navigation }: Props) {
  const { getPlaeneForSportler } = usePlanStore();
  const { activeSportlerId, coachingView } = useSettingsStore();
  const { getSportlerById } = useAthletenStore();
  const { getLogForEinheit } = useSessionLogStore();
  const insets = useSafeAreaInsets();
  const C = useColors();

  const sportler = getSportlerById(activeSportlerId ?? '');
  const plaene   = getPlaeneForSportler(activeSportlerId ?? '');

  const [calYear, setCalYear]   = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [selectedIso, setSelectedIso] = useState<string | null>(null);

  const markedDays = useMemo(() => {
    const days = new Set<number>();
    plaene.forEach((plan) =>
      plan.wochen.flatMap((w) => w.einheiten).forEach((e) => {
        if (e.datum) {
          const d = new Date(e.datum);
          if (d.getFullYear() === calYear && d.getMonth() === calMonth) days.add(d.getDate());
        }
      }),
    );
    return days;
  }, [plaene, calYear, calMonth]);

  const dayEinheiten = useMemo((): Array<{ einheit: Einheit; wocheId: string; plan: TrainingsPlan }> => {
    if (!selectedIso) return [];
    const result: Array<{ einheit: Einheit; wocheId: string; plan: TrainingsPlan }> = [];
    plaene.forEach((plan) =>
      plan.wochen.forEach((w) =>
        w.einheiten.forEach((e) => {
          if (e.datum === selectedIso) result.push({ einheit: e, wocheId: w.id, plan });
        }),
      ),
    );
    return result;
  }, [plaene, selectedIso]);

  const handleAddOnDay = () => {
    if (!selectedIso) return;
    if (plaene.length === 0) { Alert.alert('Kein Plan', 'Erstelle zuerst einen Trainingsplan.'); return; }
    const doAdd = (plan: TrainingsPlan) => {
      const [yr, mo, dy] = selectedIso.split('-').map(Number);
      const wocheId = getWocheIdForDate(plan, yr, mo - 1, dy);
      if (!wocheId) {
        Alert.alert(
          'Keine Woche',
          `„${plan.name}" hat noch keine Trainingswochen.`,
          [
            { text: 'Abbrechen', style: 'cancel' },
            { text: 'Woche anlegen', onPress: () => navigation.navigate('PlanWocheForm', { planId: plan.id }) },
          ],
        );
        return;
      }
      navigation.navigate('EinheitDetail', { planId: plan.id, wocheId, datum: selectedIso });
    };
    if (plaene.length === 1) { doAdd(plaene[0]); return; }
    Alert.alert('Zu welchem Plan?', 'Wähle den Plan:', [
      ...plaene.map((p) => ({ text: p.name, onPress: () => doAdd(p) })),
      { text: 'Abbrechen', style: 'cancel' as const },
    ]);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: C.border }]}>
        <View style={styles.headerLeft}>
          {sportler && <GBAvatar name={sportler.name} initials={sportler.initials} size={38} />}
          <View>
            <Text style={[styles.headerSub, { color: C.accent }]}>Mein Training</Text>
            <Text style={[styles.headerName, { color: C.text }]} numberOfLines={1}>
              {sportler?.name ?? '—'}
            </Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={() => navigation.navigate('ImportPlan', { preselectedSportlerId: activeSportlerId ?? undefined })}
            activeOpacity={0.8}
          >
            <GBIcon name="camera" size={17} color={C.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.newPlanBtn, { backgroundColor: C.accent }]}
            onPress={() => navigation.navigate('PlanForm', { preselectedSportlerId: activeSportlerId ?? undefined })}
            activeOpacity={0.8}
          >
            <GBIcon name="plus" size={15} color={C.accentContrast} />
            <Text style={[styles.newPlanBtnText, { color: C.accentContrast }]}>Plan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {/* ── Empty ── */}
        {plaene.length === 0 && (
          <View style={[styles.emptyCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <GBIcon name="dumbbell" size={44} color={C.textDim} />
            <Text style={[styles.emptyTitle, { color: C.textSub }]}>Noch kein Trainingsplan</Text>
            <Text style={[styles.emptySub, { color: C.textDim }]}>
              Dein Trainer weist dir Pläne zu, oder erstelle selbst einen.
            </Text>
            <View style={styles.emptyBtnRow}>
              <TouchableOpacity
                style={[styles.emptyBtn, { backgroundColor: C.accent }]}
                onPress={() => navigation.navigate('PlanForm', { preselectedSportlerId: activeSportlerId ?? undefined })}
                activeOpacity={0.8}
              >
                <GBIcon name="plus" size={16} color={C.accentContrast} />
                <Text style={[styles.emptyBtnText, { color: C.accentContrast }]}>Neuer Plan</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.emptyBtnAlt, { borderColor: C.border }]}
                onPress={() => navigation.navigate('ImportPlan', { preselectedSportlerId: activeSportlerId ?? undefined })}
                activeOpacity={0.8}
              >
                <GBIcon name="camera" size={16} color={C.textMuted} />
                <Text style={[styles.emptyBtnAltText, { color: C.textMuted }]}>Importieren</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* ── Kalender ── */}
        {plaene.length > 0 && coachingView === 'kalender' && (
          <>
            <MonthCalendar
              markedDays={markedDays}
              legendLabel="Einheit geplant"
              onDayPress={(y, m, d) => { const iso = isoDate(y, m, d); setSelectedIso((p) => p === iso ? null : iso); }}
              selectedIso={selectedIso}
              onMonthChange={(y, m) => { setCalYear(y); setCalMonth(m); setSelectedIso(null); }}
            />

            {selectedIso && (
              <View style={[styles.dayPanel, { backgroundColor: C.surface, borderColor: C.border }]}>
                <View style={[styles.dayPanelHeader, { borderBottomColor: C.border }]}>
                  <Text style={[styles.dayPanelTitle, { color: C.text }]}>{formatDay(selectedIso)}</Text>
                  <TouchableOpacity style={[styles.dayAddBtn, { backgroundColor: C.accent }]} onPress={handleAddOnDay} activeOpacity={0.8}>
                    <GBIcon name="plus" size={16} color={C.accentContrast} />
                    <Text style={[styles.dayAddBtnText, { color: C.accentContrast }]}>Einheit</Text>
                  </TouchableOpacity>
                </View>
                {dayEinheiten.length === 0 ? (
                  <View style={styles.dayEmpty}>
                    <Text style={[styles.dayEmptyText, { color: C.textDim }]}>Keine Einheiten an diesem Tag</Text>
                  </View>
                ) : (
                  dayEinheiten.map(({ einheit, wocheId, plan }) => {
                    const override = einheit.sportlerOverrides?.[activeSportlerId ?? ''];
                    const display  = override ? { ...einheit, ...override } : einheit;
                    const log = getLogForEinheit(einheit.id, activeSportlerId ?? '');
                    return (
                      <TouchableOpacity
                        key={einheit.id}
                        style={[styles.einheitRow, { borderBottomColor: C.border }, log?.abgeschlossen && styles.einheitRowDone]}
                        onPress={() => {
                          if (log?.abgeschlossen) {
                            navigation.navigate('EinheitLog', { planId: plan.id, wocheId, einheitId: einheit.id });
                          } else {
                            navigation.navigate('EinheitAusfuehren', { planId: plan.id, wocheId, einheitId: einheit.id });
                          }
                        }}
                        activeOpacity={0.75}
                      >
                        <View style={[styles.einheitDot, { backgroundColor: log?.abgeschlossen ? C.accent : C.border }]} />
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.einheitName, { color: C.text }]}>{display.name}</Text>
                          {buildUebSuffix(display.haupteinheit[0]).length > 0 ? (
                            <Text style={[styles.einheitSub, { color: C.textMuted }]} numberOfLines={1}>
                              {buildUebSuffix(display.haupteinheit[0])}
                            </Text>
                          ) : (
                            <Text style={[styles.einheitSub, { color: C.textMuted }]}>
                              {display.warmup.length + display.haupteinheit.length + display.cooldown.length} Übungen
                            </Text>
                          )}
                        </View>
                        {log?.abgeschlossen
                          ? <View style={styles.donePill}><Text style={[styles.donePillText, { color: C.accent }]}>{log.bewertung}★</Text></View>
                          : <View style={styles.playBadge}><GBIcon name="play" size={11} color={C.accentContrast} /></View>
                        }
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            )}

            {/* Alle Pläne kompakt */}
            {plaene.map((plan) => {
              const sc = SPORTART_COLORS[plan.sportart ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textDim };
              const allE = plan.wochen.flatMap((w) => w.einheiten);
              const done = allE.filter((e) => getLogForEinheit(e.id, activeSportlerId ?? '')?.abgeschlossen).length;
              return (
                <View key={plan.id} style={[styles.planCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                  <View style={[styles.planCardHeader, { borderBottomColor: C.border }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.planCardName, { color: C.text }]}>{plan.name}</Text>
                      {plan.sportart && (
                        <View style={[styles.planChip, { backgroundColor: sc.bg }]}>
                          <View style={[styles.planChipDot, { backgroundColor: sc.dot }]} />
                          <Text style={[styles.planChipText, { color: sc.fg }]}>{plan.sportart}</Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.planProgress, { color: allE.length > 0 && done === allE.length ? C.accent : C.textDim }]}>
                      {done}/{allE.length} ✓
                    </Text>
                    <TouchableOpacity
                      style={[styles.sharePlanBtn, { backgroundColor: C.surfaceAlt }]}
                      onPress={() => exportPlanAsPdf(plan)}
                      activeOpacity={0.7}
                    >
                      <GBIcon name="share" size={14} color={C.textMuted} />
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={[styles.planDetailRow, { borderTopColor: C.border }]}
                    onPress={() => {
                      if (plan.wochen.length > 0) {
                        navigation.navigate('PlanWocheDetail', { planId: plan.id, wocheId: plan.wochen[0].id });
                      } else {
                        navigation.navigate('PlanWocheForm', { planId: plan.id });
                      }
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.planDetailText, { color: C.accent }]}>
                      {plan.wochen.length} Wochen · Details anzeigen
                    </Text>
                    <GBIcon name="chevronRight" size={13} color={C.accent} />
                  </TouchableOpacity>
                </View>
              );
            })}
          </>
        )}

        {/* ── Wochenansicht ── */}
        {plaene.length > 0 && coachingView === 'wochen' && plaene.map((plan) => {
          const sc = SPORTART_COLORS[plan.sportart ?? ''] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textDim };
          return (
            <View key={plan.id} style={[styles.planCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <View style={[styles.planCardHeader, { borderBottomColor: C.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planCardName, { color: C.text }]}>{plan.name}</Text>
                  {plan.sportart && (
                    <View style={[styles.planChip, { backgroundColor: sc.bg }]}>
                      <View style={[styles.planChipDot, { backgroundColor: sc.dot }]} />
                      <Text style={[styles.planChipText, { color: sc.fg }]}>{plan.sportart}</Text>
                    </View>
                  )}
                </View>
                <TouchableOpacity
                  style={[styles.sharePlanBtn, { backgroundColor: C.surfaceAlt }]}
                  onPress={() => exportPlanAsPdf(plan)}
                  activeOpacity={0.7}
                >
                  <GBIcon name="share" size={14} color={C.textMuted} />
                </TouchableOpacity>
              </View>

              {plan.wochen.length === 0 ? (
                <Text style={[styles.emptyWeekText, { color: C.textDim }]}>Noch keine Wochen</Text>
              ) : (
                [...plan.wochen]
                  .sort((a, b) => a.wochennummer - b.wochennummer)
                  .map((woche) => {
                    const dateRange = plan.startdatum ? formatWocheRange(plan.startdatum, woche.wochennummer) : null;
                    return (
                      <View key={woche.id} style={[styles.wocheBlock, { borderBottomColor: C.border }]}>
                        <View style={[styles.wocheBlockHeader, { backgroundColor: C.surfaceAlt }]}>
                          <View style={[styles.wocheNumBadge, { backgroundColor: C.accent }]}>
                            <Text style={[styles.wocheNumText, { color: C.accentContrast }]}>{woche.wochennummer}</Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={[styles.wocheLabel, { color: C.text }]}>Woche {woche.wochennummer}</Text>
                            {dateRange && <Text style={[styles.wocheDateRange, { color: C.textDim }]}>{dateRange}</Text>}
                          </View>
                          <TouchableOpacity
                            style={[styles.wocheAddBtn, { backgroundColor: C.accentLight, borderColor: C.accent }]}
                            onPress={() => navigation.navigate('EinheitDetail', { planId: plan.id, wocheId: woche.id })}
                            activeOpacity={0.7}
                          >
                            <GBIcon name="plus" size={13} color={C.accent} />
                          </TouchableOpacity>
                        </View>

                        {woche.einheiten.length === 0 ? (
                          <Text style={[styles.emptyEinheitText, { color: C.textDim }]}>Keine Einheiten</Text>
                        ) : (
                          [...woche.einheiten]
                            .sort((a, b) => (a.datum ?? '').localeCompare(b.datum ?? ''))
                            .map((einheit) => {
                              const override = einheit.sportlerOverrides?.[activeSportlerId ?? ''];
                              const display  = override ? { ...einheit, ...override } : einheit;
                              const log = getLogForEinheit(einheit.id, activeSportlerId ?? '');
                              const dayLabel = einheit.datum ? (() => {
                                const d = new Date(einheit.datum);
                                return `${['So','Mo','Di','Mi','Do','Fr','Sa'][d.getDay()]} ${d.getDate()}. ${MONATE_KURZ[d.getMonth()]}`;
                              })() : null;
                              return (
                                <TouchableOpacity
                                  key={einheit.id}
                                  style={[styles.einheitRow, { borderBottomColor: C.border }, log?.abgeschlossen && styles.einheitRowDone]}
                                  onPress={() => {
                                    if (log?.abgeschlossen) {
                                      navigation.navigate('EinheitLog', { planId: plan.id, wocheId: woche.id, einheitId: einheit.id });
                                    } else {
                                      navigation.navigate('EinheitAusfuehren', { planId: plan.id, wocheId: woche.id, einheitId: einheit.id });
                                    }
                                  }}
                                  activeOpacity={0.75}
                                >
                                  <View style={[styles.einheitDot, { backgroundColor: log?.abgeschlossen ? C.accent : C.border }]} />
                                  <View style={{ flex: 1 }}>
                                    <Text style={[styles.einheitName, { color: C.text }]}>{display.name}</Text>
                                    {dayLabel && <Text style={[styles.einheitDatum, { color: C.textDim }]}>{dayLabel}</Text>}
                                    {buildUebSuffix(display.haupteinheit[0]).length > 0 && (
                                      <Text style={[styles.einheitSub, { color: C.textMuted }]} numberOfLines={1}>
                                        {buildUebSuffix(display.haupteinheit[0])}
                                      </Text>
                                    )}
                                  </View>
                                  {log?.abgeschlossen
                                    ? <View style={styles.donePill}><Text style={[styles.donePillText, { color: C.accent }]}>{log.bewertung}★</Text></View>
                                    : <View style={styles.playBadge}><GBIcon name="play" size={11} color={C.accentContrast} /></View>
                                  }
                                </TouchableOpacity>
                              );
                            })
                        )}
                      </View>
                    );
                  })
              )}

              <TouchableOpacity
                style={[styles.addWocheRow, { borderTopColor: C.border }]}
                onPress={() => navigation.navigate('PlanWocheForm', { planId: plan.id })}
                activeOpacity={0.7}
              >
                <GBIcon name="plus" size={14} color={C.textMuted} />
                <Text style={[styles.addWocheText, { color: C.textMuted }]}>Woche hinzufügen</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SP.xl, paddingVertical: SP.md, borderBottomWidth: 1 },
  headerLeft:   { flexDirection: 'row', alignItems: 'center', gap: SP.md, flex: 1 },
  headerButtons: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  iconBtn:       { width: 34, height: 34, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  headerSub:   { fontSize: 10, fontWeight: '800', color: C.accent, textTransform: 'uppercase', letterSpacing: 1.2 },
  headerName:  { fontSize: FONT.md, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  newPlanBtn:     { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  newPlanBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.md },

  emptyCard:  { alignItems: 'center', borderRadius: R.xl, borderWidth: 1, padding: SP.xxxl, gap: SP.md },
  emptyTitle: { fontSize: FONT.md, fontWeight: '700', color: C.textSub },
  emptySub:   { fontSize: FONT.sm, color: C.textDim, textAlign: 'center', lineHeight: 20 },
  emptyBtnRow:   { flexDirection: 'row', gap: SP.sm, marginTop: SP.sm },
  emptyBtn:      { flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderRadius: R.full },
  emptyBtnText:  { fontSize: FONT.sm, fontWeight: '700' },
  emptyBtnAlt:   { flexDirection: 'row', alignItems: 'center', gap: SP.sm, paddingHorizontal: SP.lg, paddingVertical: SP.md, borderRadius: R.full, borderWidth: 1 },
  emptyBtnAltText: { fontSize: FONT.sm, fontWeight: '700' },

  dayPanel:        { borderRadius: R.xl, borderWidth: 1, overflow: 'hidden' },
  dayPanelHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SP.md, borderBottomWidth: 1 },
  dayPanelTitle:   { fontSize: FONT.base, fontWeight: '700', color: C.text },
  dayAddBtn:       { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  dayAddBtnText:   { fontSize: FONT.xs, fontWeight: '700' },
  dayEmpty:        { padding: SP.lg, alignItems: 'center' },
  dayEmptyText:    { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic' },

  einheitRow:       { flexDirection: 'row', alignItems: 'center', padding: SP.md, borderBottomWidth: 1, gap: SP.sm },
  einheitRowDone:   { backgroundColor: 'rgba(203,255,62,0.04)' },
  einheitDot:       { width: 8, height: 8, borderRadius: 4, flexShrink: 0, marginTop: 1 },
  einheitName:      { fontSize: FONT.base, fontWeight: '600', color: C.text },
  einheitSub:       { fontFamily: FONT_MONO, fontSize: 11, color: C.textMuted, marginTop: 2 },
  einheitDatum:     { fontSize: 10, color: C.textDim, marginTop: 1 },
  donePill:         { backgroundColor: 'rgba(203,255,62,0.15)', borderRadius: R.full, paddingHorizontal: 8, paddingVertical: 3 },
  donePillText:     { fontSize: FONT.xs, fontWeight: '800', color: C.accent },
  playBadge:        { width: 22, height: 22, borderRadius: 11, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },

  planCard:       { borderRadius: R.xl, borderWidth: 1, overflow: 'hidden' },
  planCardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, padding: SP.md, borderBottomWidth: 1 },
  planCardName:   { fontSize: FONT.base, fontWeight: '700', color: C.text, marginBottom: 4 },
  planChip:       { flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start', paddingHorizontal: 7, paddingVertical: 2, borderRadius: R.full },
  planChipDot:    { width: 4, height: 4, borderRadius: 2 },
  planChipText:   { fontSize: 9, fontWeight: '700', letterSpacing: 0.5, textTransform: 'uppercase' },
  planProgress:   { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '700', marginTop: 2 },
  sharePlanBtn:   { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  planDetailRow:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: SP.md, borderTopWidth: 1 },
  planDetailText: { fontSize: FONT.sm, fontWeight: '600', color: C.accent },

  wocheBlock:       { borderBottomWidth: 1 },
  wocheBlockHeader: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, padding: SP.md },
  wocheNumBadge:    { width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  wocheNumText:     { fontFamily: FONT_MONO, fontSize: 11, fontWeight: '800' },
  wocheLabel:       { fontSize: FONT.sm, fontWeight: '700', color: C.text },
  wocheDateRange:   { fontSize: 11, color: C.textDim, marginTop: 1 },
  wocheAddBtn:      { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  emptyWeekText:    { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic', padding: SP.md },
  emptyEinheitText: { fontSize: FONT.sm, color: C.textDim, fontStyle: 'italic', paddingHorizontal: SP.md, paddingVertical: SP.sm },
  addWocheRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, padding: SP.md, borderTopWidth: 1 },
  addWocheText:     { fontSize: FONT.sm, fontWeight: '600', color: C.textMuted },
});
