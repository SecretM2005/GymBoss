import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeinTrainingStackParamList, EinheitUebung } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { useSettingsStore } from '../../store/settingsStore';
import { GBIcon } from '../../components/GBIcon';
import { PHASE_CFG, PHASES, buildUebSuffix } from '../plaene/EinheitDetailScreen';
import { useColors, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<MeinTrainingStackParamList, 'EinheitAusfuehren'>;
  route:      RouteProp<MeinTrainingStackParamList, 'EinheitAusfuehren'>;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getParam(ueb: EinheitUebung, typ: string): string | undefined {
  return ueb.parameter.find((p) => p.typ === typ)?.wert;
}

function getPauseSeconds(ueb: EinheitUebung): number | null {
  const sp  = ueb.parameter.find((p) => p.typ === 'serienpause');
  const pau = ueb.parameter.find((p) => p.typ === 'pause');
  const src = sp ?? pau;
  if (!src) return null;
  const val = parseFloat(src.wert);
  if (isNaN(val)) return null;
  const unit = src.einheit ?? 's';
  return unit === 'min' ? val * 60 : val;
}

function getDauerSeconds(ueb: EinheitUebung): number | null {
  const d = ueb.parameter.find((p) => p.typ === 'dauer');
  if (!d) return null;
  const val = parseFloat(d.wert);
  if (isNaN(val)) return null;
  const unit = d.einheit ?? 's';
  return unit === 'min' ? val * 60 : unit === 'h' ? val * 3600 : val;
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────

type SetState = { reps: string; weight: string; done: boolean };

type SetMapKey = string; // `${uebungId}_${setIndex}`

// ─── Component ────────────────────────────────────────────────────────────────

export default function EinheitAusfuehrenScreen({ navigation, route }: Props) {
  const { planId, wocheId, einheitId } = route.params;
  const { getPlanById }       = usePlanStore();
  const { activeSportlerId }  = useSettingsStore();
  const insets                = useSafeAreaInsets();
  const C                     = useColors();

  const plan    = getPlanById(planId);
  const woche   = plan?.wochen.find((w) => w.id === wocheId);
  const einheit = woche?.einheiten.find((e) => e.id === einheitId);

  const override = einheit?.sportlerOverrides?.[activeSportlerId ?? ''];
  const display  = override ? { ...einheit!, ...override } : einheit;

  // Navigate back immediately if data is missing
  useEffect(() => {
    if (!display) navigation.goBack();
  }, [display, navigation]);

  // ── Build flat exercise list ───────────────────────────────────────────────
  const allExercises: Array<{ ueb: EinheitUebung; phase: typeof PHASES[number] }> =
    display
      ? PHASES.flatMap((phase) =>
          display[phase].map((ueb) => ({ ueb, phase }))
        )
      : [];

  // ── Initialise setMap ─────────────────────────────────────────────────────
  const buildInitialSetMap = useCallback((): Record<SetMapKey, SetState> => {
    const map: Record<SetMapKey, SetState> = {};
    allExercises.forEach(({ ueb }) => {
      if (ueb.typ === 'kreis') {
        // Single "done" entry for circuit
        map[`${ueb.id}_0`] = { reps: '', weight: '', done: false };
      } else {
        const serienStr = getParam(ueb, 'serien');
        const sets = serienStr ? Math.max(1, parseInt(serienStr, 10) || 1) : 1;
        const defReps   = getParam(ueb, 'wiederholungen') ?? '';
        const defWeight = getParam(ueb, 'gewicht') ?? '';
        for (let i = 0; i < sets; i++) {
          map[`${ueb.id}_${i}`] = { reps: defReps, weight: defWeight, done: false };
        }
      }
    });
    return map;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const [setMap, setSetMap] = useState<Record<SetMapKey, SetState>>(() =>
    buildInitialSetMap()
  );

  // ── Elapsed timer ─────────────────────────────────────────────────────────
  const [elapsed, setElapsed] = useState(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    elapsedRef.current = setInterval(() => {
      setElapsed((s) => s + 1);
    }, 1000);
    return () => {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
    };
  }, []);

  // ── Rest timer ────────────────────────────────────────────────────────────
  const [restRemaining, setRestRemaining] = useState<number | null>(null);
  const restRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRest = useCallback((seconds: number) => {
    if (restRef.current) clearInterval(restRef.current);
    setRestRemaining(seconds);
    restRef.current = setInterval(() => {
      setRestRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(restRef.current!);
          restRef.current = null;
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const skipRest = useCallback(() => {
    if (restRef.current) clearInterval(restRef.current);
    restRef.current = null;
    setRestRemaining(null);
  }, []);

  useEffect(() => {
    return () => {
      if (restRef.current) clearInterval(restRef.current);
    };
  }, []);

  // ── Progress ──────────────────────────────────────────────────────────────
  const keys       = Object.keys(setMap);
  const totalSets  = keys.length;
  const doneSets   = keys.filter((k) => setMap[k].done).length;
  const allDone    = totalSets > 0 && doneSets === totalSets;
  const progress   = totalSets > 0 ? doneSets / totalSets : 0;

  // ── Handlers ──────────────────────────────────────────────────────────────
  const updateSet = useCallback((key: SetMapKey, field: keyof SetState, value: string | boolean) => {
    setSetMap((prev) => ({
      ...prev,
      [key]: { ...prev[key], [field]: value },
    }));
  }, []);

  const toggleDone = useCallback((key: SetMapKey, ueb: EinheitUebung) => {
    setSetMap((prev) => {
      const current = prev[key];
      const next = !current.done;
      if (next) {
        const pause = getPauseSeconds(ueb);
        if (pause !== null && pause > 0) startRest(pause);
      }
      return { ...prev, [key]: { ...current, done: next } };
    });
  }, [startRest]);

  const handleFinish = useCallback(() => {
    navigation.replace('EinheitLog', { planId, wocheId, einheitId });
  }, [navigation, planId, wocheId, einheitId]);

  if (!display) return null;

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: C.bg }]}>
      {/* ── Top Bar ── */}
      <View style={[styles.topBar, { paddingTop: insets.top + SP.sm, borderBottomColor: C.border }]}>
        <TouchableOpacity
          style={[styles.iconBtn, { backgroundColor: C.surfaceAlt }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <GBIcon name="chevronLeft" size={20} color={C.text} />
        </TouchableOpacity>

        <View style={styles.topCenter}>
          <Text style={[styles.topSub, { color: C.accent }]} numberOfLines={1}>
            {plan?.name}
          </Text>
          <Text style={[styles.topTitle, { color: C.text }]} numberOfLines={1}>
            {display.name || (display.datum ? new Date(display.datum).toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' }) : 'Training')}
          </Text>
        </View>

        <View style={[styles.timerBadge, { backgroundColor: C.surfaceAlt }]}>
          <GBIcon name="stopwatch" size={13} color={C.textMuted} />
          <Text style={[styles.timerText, { color: C.text }]}>{fmtTime(elapsed)}</Text>
        </View>
      </View>

      {/* ── Progress bar ── */}
      <View style={[styles.progressTrack, { backgroundColor: C.surfaceAlt }]}>
        <View
          style={[
            styles.progressFill,
            { backgroundColor: C.accent, width: `${progress * 100}%` as any },
          ]}
        />
      </View>
      <View style={[styles.progressInfo, { borderBottomColor: C.border }]}>
        <Text style={[styles.progressLabel, { color: C.textDim }]}>
          {doneSets} / {totalSets} Sätze erledigt
        </Text>
        {allDone && (
          <View style={[styles.allDonePill, { backgroundColor: C.accentLight }]}>
            <GBIcon name="check" size={11} color={C.accent} />
            <Text style={[styles.allDoneText, { color: C.accent }]}>Alle Sätze ✓</Text>
          </View>
        )}
      </View>

      {/* ── Exercise list ── */}
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 + insets.bottom }]}
        keyboardShouldPersistTaps="handled"
      >
        {PHASES.map((phase) => {
          const exercises = display[phase];
          if (exercises.length === 0) return null;
          const cfg = PHASE_CFG[phase];
          return (
            <View key={phase} style={styles.phaseSection}>
              <View style={[styles.phaseHeader, { borderLeftColor: cfg.color }]}>
                <Text style={[styles.phaseTitle, { color: cfg.color }]}>{cfg.label}</Text>
                <Text style={[styles.phaseCount, { color: C.textDim }]}>{exercises.length}</Text>
              </View>

              {exercises.map((ueb) => (
                <ExerciseCard
                  key={ueb.id}
                  ueb={ueb}
                  phaseColor={cfg.color}
                  setMap={setMap}
                  onToggleDone={toggleDone}
                  onUpdateSet={updateSet}
                  C={C}
                />
              ))}
            </View>
          );
        })}

        {/* ── Finish button ── */}
        <TouchableOpacity
          style={[
            styles.finishBtn,
            allDone
              ? { backgroundColor: C.accent }
              : { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
          ]}
          onPress={handleFinish}
          activeOpacity={0.85}
        >
          <GBIcon name="flag" size={18} color={allDone ? C.accentContrast : C.textMuted} />
          <Text
            style={[
              styles.finishBtnText,
              { color: allDone ? C.accentContrast : C.textMuted },
            ]}
          >
            Training beenden
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ── Rest timer sticky bar ── */}
      {restRemaining !== null && (
        <View
          style={[
            styles.restBar,
            { bottom: insets.bottom, backgroundColor: C.surface, borderTopColor: C.border },
          ]}
        >
          <View style={styles.restLeft}>
            <GBIcon name="timer" size={16} color={C.accent} />
            <Text style={[styles.restLabel, { color: C.textMuted }]}>Pause</Text>
            <Text style={[styles.restTime, { color: C.accent }]}>{fmtTime(restRemaining)}</Text>
          </View>
          <TouchableOpacity
            style={[styles.skipBtn, { backgroundColor: C.surfaceAlt, borderColor: C.border }]}
            onPress={skipRest}
            activeOpacity={0.8}
          >
            <Text style={[styles.skipText, { color: C.textMuted }]}>Überspringen</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ─── DurationSetRow ───────────────────────────────────────────────────────────

type DurRowProps = {
  idx: number;
  keyStr: SetMapKey;
  ueb: EinheitUebung;
  totalSec: number;
  entry: SetState;
  onToggleDone: (key: SetMapKey, ueb: EinheitUebung) => void;
  C: ReturnType<typeof useColors>;
};

function DurationSetRow({ idx, keyStr, ueb, totalSec, entry, onToggleDone, C }: DurRowProps) {
  const [remaining, setRemaining] = useState(totalSec);
  const [ticking, setTicking]     = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!entry.done) setRemaining(totalSec);
  }, [entry.done, totalSec]);

  useEffect(() => {
    if (!ticking) {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
      return;
    }
    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          timerRef.current = null;
          setTicking(false);
          onToggleDone(keyStr, ueb);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [ticking]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[styles.setRow, { borderBottomColor: C.border }, entry.done && { backgroundColor: `${C.accent}10` }]}>
      <Text style={[styles.setNumCell, styles.setNumCol, { color: C.textDim }]}>{idx + 1}</Text>
      <TouchableOpacity
        style={[styles.durCell, styles.setRepsCol, { backgroundColor: ticking ? C.accentLight : C.surfaceAlt, borderColor: ticking ? C.accent : C.border }]}
        onPress={() => { if (!entry.done) setTicking((t) => !t); }}
        activeOpacity={0.7}
      >
        <GBIcon name={ticking ? 'pause' : 'play'} size={11} color={ticking ? C.accent : C.textDim} />
        <Text style={[styles.durText, { color: ticking ? C.accent : C.text }]}>{fmtTime(remaining)}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.doneToggle, styles.setDoneCol,
          entry.done ? { backgroundColor: C.accent } : { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
        ]}
        onPress={() => { setTicking(false); onToggleDone(keyStr, ueb); }}
        activeOpacity={0.8}
      >
        <GBIcon name="check" size={13} color={entry.done ? C.accentContrast : C.textDim} />
      </TouchableOpacity>
    </View>
  );
}

// ─── ExerciseCard ─────────────────────────────────────────────────────────────

type CardProps = {
  ueb: EinheitUebung;
  phaseColor: string;
  setMap: Record<SetMapKey, SetState>;
  onToggleDone: (key: SetMapKey, ueb: EinheitUebung) => void;
  onUpdateSet: (key: SetMapKey, field: keyof SetState, value: string | boolean) => void;
  C: ReturnType<typeof useColors>;
};

function ExerciseCard({ ueb, phaseColor, setMap, onToggleDone, onUpdateSet, C }: CardProps) {
  const suffix = buildUebSuffix(ueb);

  // Circuit exercise — single done button
  if (ueb.typ === 'kreis') {
    const key = `${ueb.id}_0`;
    const entry = setMap[key];
    const done = entry?.done ?? false;
    return (
      <View style={[styles.uebCard, { backgroundColor: C.surface, borderColor: done ? C.accent : C.border }]}>
        <View style={styles.uebCardHeader}>
          <View style={[styles.uebDot, { backgroundColor: phaseColor }]} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.uebName, { color: C.text }]}>{ueb.name}</Text>
            {suffix.length > 0 && <Text style={[styles.uebParams, { color: C.textMuted }]}>{suffix}</Text>}
          </View>
        </View>
        {ueb.kreisUebungen && ueb.kreisUebungen.length > 0 && (
          <View style={[styles.kreisListWrap, { borderTopColor: C.border }]}>
            {ueb.kreisUebungen.map((ku) => (
              <View key={ku.id} style={[styles.kreisItem, { borderBottomColor: C.border }]}>
                <View style={[styles.kreisDot, { backgroundColor: C.textDim }]} />
                <Text style={[styles.kreisItemText, { color: C.textMuted }]}>
                  {ku.name} — {ku.wert} {ku.einheit}
                  {ku.zielzeit ? ` in ${ku.zielzeit}${ku.zeiteinheit ?? 's'}` : ''}
                </Text>
              </View>
            ))}
          </View>
        )}
        <TouchableOpacity
          style={[styles.circuitDoneBtn, { borderTopColor: C.border, backgroundColor: done ? C.accentLight : 'transparent' }]}
          onPress={() => onToggleDone(key, ueb)}
          activeOpacity={0.75}
        >
          <GBIcon name="check" size={15} color={done ? C.accent : C.textDim} />
          <Text style={[styles.circuitDoneTxt, { color: done ? C.accent : C.textMuted }]}>
            {done ? 'Erledigt' : 'Als erledigt markieren'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Normal exercise — per-set rows
  const serienStr = ueb.parameter.find((p) => p.typ === 'serien')?.wert;
  const sets      = serienStr ? Math.max(1, parseInt(serienStr, 10) || 1) : 1;
  const hasWeight = ueb.parameter.some((p) => p.typ === 'gewicht');
  const hasReps   = ueb.parameter.some((p) => p.typ === 'wiederholungen');
  const dauerSec  = getDauerSeconds(ueb);
  const hasDauer  = dauerSec !== null;

  // Middle column label: Dauer > Wdh > nothing
  const midLabel = hasDauer ? 'Dauer' : hasReps ? 'Wdh' : null;

  return (
    <View style={[styles.uebCard, { backgroundColor: C.surface, borderColor: C.border }]}>
      <View style={styles.uebCardHeader}>
        <View style={[styles.uebDot, { backgroundColor: phaseColor }]} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.uebName, { color: C.text }]}>{ueb.name}</Text>
          {suffix.length > 0 && <Text style={[styles.uebParams, { color: C.textMuted }]}>{suffix}</Text>}
        </View>
      </View>

      {/* Column headers */}
      <View style={[styles.setHeaderRow, { borderTopColor: C.border, borderBottomColor: C.border }]}>
        <Text style={[styles.setHeaderCell, styles.setNumCol, { color: C.textDim }]}>#</Text>
        {midLabel && <Text style={[styles.setHeaderCell, styles.setRepsCol, { color: C.textDim }]}>{midLabel}</Text>}
        {hasWeight && <Text style={[styles.setHeaderCell, styles.setWeightCol, { color: C.textDim }]}>Gewicht</Text>}
        <View style={styles.setDoneCol} />
      </View>

      {Array.from({ length: sets }).map((_, i) => {
        const key   = `${ueb.id}_${i}`;
        const entry = setMap[key] ?? { reps: '', weight: '', done: false };

        // Duration row
        if (hasDauer) {
          return (
            <React.Fragment key={key}>
              <DurationSetRow
                idx={i} keyStr={key} ueb={ueb}
                totalSec={dauerSec!}
                entry={entry}
                onToggleDone={onToggleDone}
                C={C}
              />
              {hasWeight && (
                <View style={[styles.setRow, { borderBottomColor: C.border }, entry.done && { backgroundColor: `${C.accent}10` }]}>
                  <View style={styles.setNumCol} />
                  <TextInput
                    style={[styles.setInput, styles.setWeightCol, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
                    value={entry.weight}
                    onChangeText={(v) => onUpdateSet(key, 'weight', v)}
                    keyboardType="numeric"
                    placeholder="kg"
                    placeholderTextColor={C.textDim}
                    editable={!entry.done}
                  />
                  <View style={styles.setDoneCol} />
                </View>
              )}
            </React.Fragment>
          );
        }

        // Reps / no-middle row
        return (
          <View
            key={key}
            style={[styles.setRow, { borderBottomColor: C.border }, entry.done && { backgroundColor: `${C.accent}10` }]}
          >
            <Text style={[styles.setNumCell, styles.setNumCol, { color: C.textDim }]}>{i + 1}</Text>

            {hasReps && (
              <TextInput
                style={[styles.setInput, styles.setRepsCol, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
                value={entry.reps}
                onChangeText={(v) => onUpdateSet(key, 'reps', v)}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={C.textDim}
                editable={!entry.done}
              />
            )}

            {hasWeight && (
              <TextInput
                style={[styles.setInput, styles.setWeightCol, { backgroundColor: C.surfaceAlt, borderColor: C.border, color: C.text }]}
                value={entry.weight}
                onChangeText={(v) => onUpdateSet(key, 'weight', v)}
                keyboardType="numeric"
                placeholder="—"
                placeholderTextColor={C.textDim}
                editable={!entry.done}
              />
            )}

            <TouchableOpacity
              style={[
                styles.doneToggle, styles.setDoneCol,
                entry.done ? { backgroundColor: C.accent } : { backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
              ]}
              onPress={() => onToggleDone(key, ueb)}
              activeOpacity={0.8}
            >
              <GBIcon name="check" size={13} color={entry.done ? C.accentContrast : C.textDim} />
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.xl,
    paddingBottom: SP.md,
    borderBottomWidth: 1,
    gap: SP.sm,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topCenter: { flex: 1, paddingHorizontal: SP.sm },
  topSub: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  topTitle: {
    fontSize: FONT.md,
    fontWeight: '700',
    letterSpacing: -0.3,
    marginTop: 2,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm - 2,
    borderRadius: R.full,
  },
  timerText: {
    fontFamily: FONT_MONO,
    fontSize: FONT.sm,
    fontWeight: '700',
  },

  progressTrack: { height: 4, width: '100%' },
  progressFill:  { height: 4 },
  progressInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SP.xl,
    paddingVertical: SP.sm,
    borderBottomWidth: 1,
  },
  progressLabel: { fontSize: FONT.xs, fontWeight: '600' },
  allDonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: SP.sm,
    paddingVertical: 3,
    borderRadius: R.full,
  },
  allDoneText: { fontSize: FONT.xs, fontWeight: '700' },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.md },

  phaseSection: { gap: SP.sm },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderLeftWidth: 3,
    paddingLeft: SP.sm,
    marginBottom: 2,
  },
  phaseTitle: { fontSize: FONT.sm, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.2 },
  phaseCount: { fontFamily: FONT_MONO, fontSize: FONT.xs, fontWeight: '600' },

  uebCard: {
    borderRadius: R.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  uebCardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SP.md,
    padding: SP.md,
  },
  uebDot: { width: 8, height: 8, borderRadius: 4, marginTop: 5, flexShrink: 0 },
  uebName: { fontSize: FONT.base, fontWeight: '600' },
  uebParams: { fontFamily: FONT_MONO, fontSize: 11, marginTop: 2, lineHeight: 16 },

  setHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    gap: SP.sm,
  },
  setHeaderCell: {
    fontSize: FONT.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },

  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderBottomWidth: 1,
    gap: SP.sm,
  },
  setNumCol:    { width: 20 },
  setRepsCol:   { flex: 1 },
  setWeightCol: { flex: 1 },
  setDoneCol:   { width: 34 },
  setNumCell: {
    fontFamily: FONT_MONO,
    fontSize: FONT.xs,
    textAlign: 'center',
  },
  setInput: {
    borderRadius: R.sm,
    borderWidth: 1,
    paddingHorizontal: SP.sm,
    paddingVertical: Platform.OS === 'ios' ? SP.sm : SP.xs,
    fontSize: FONT.sm,
    fontFamily: FONT_MONO,
    textAlign: 'center',
  },
  durCell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    borderRadius: R.sm,
    borderWidth: 1,
    paddingVertical: Platform.OS === 'ios' ? SP.sm : SP.xs,
    paddingHorizontal: SP.sm,
  },
  durText: {
    fontFamily: FONT_MONO,
    fontSize: FONT.sm,
    fontWeight: '700',
  },
  doneToggle: {
    width: 34,
    height: 34,
    borderRadius: R.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },

  kreisListWrap: { borderTopWidth: 1, paddingVertical: SP.sm },
  kreisItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SP.sm,
    paddingHorizontal: SP.md,
    paddingVertical: SP.xs,
    borderBottomWidth: 1,
  },
  kreisDot: { width: 4, height: 4, borderRadius: 2, flexShrink: 0 },
  kreisItemText: { fontSize: FONT.sm, flex: 1 },
  circuitDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP.sm,
    padding: SP.md,
    borderTopWidth: 1,
  },
  circuitDoneTxt: { fontSize: FONT.sm, fontWeight: '700' },

  finishBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SP.sm,
    paddingVertical: SP.lg,
    borderRadius: R.lg,
    marginTop: SP.md,
  },
  finishBtnText: { fontSize: FONT.base, fontWeight: '800', letterSpacing: -0.2 },

  restBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SP.xl,
    paddingVertical: SP.md,
    borderTopWidth: 1,
  },
  restLeft:  { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  restLabel: { fontSize: FONT.sm, fontWeight: '600' },
  restTime:  { fontFamily: FONT_MONO, fontSize: FONT.md, fontWeight: '800' },
  skipBtn: {
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm,
    borderRadius: R.full,
    borderWidth: 1,
  },
  skipText: { fontSize: FONT.xs, fontWeight: '700' },
});
