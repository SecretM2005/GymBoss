import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GBIcon } from './GBIcon';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../theme';

const MONATE = [
  'Januar','Februar','März','April','Mai','Juni',
  'Juli','August','September','Oktober','November','Dezember',
];
const WOCHENTAGE = ['Mo','Di','Mi','Do','Fr','Sa','So'];
const YEAR_PAGE = 20;

function getFirstWeekday(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}
function isoOf(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function ageFromIso(iso: string): number {
  const b = new Date(iso);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
}
function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}. ${MONATE[d.getMonth()]} ${d.getFullYear()}`;
}

type Props = {
  value?: string | null;
  onChange: (iso: string) => void;
  error?: string;
};

type Mode = 'day' | 'year';

export default function DatePickerField({ value, onChange, error }: Props) {
  const C = useColors();
  const today = new Date();
  const maxYear = today.getFullYear();
  const minYear = maxYear - 100;

  const parsed = value ? new Date(value) : null;
  const defaultYear = maxYear - 22;

  const [open, setOpen]           = useState(false);
  const [mode, setMode]           = useState<Mode>('day');
  const [viewYear, setViewYear]   = useState(parsed?.getFullYear() ?? defaultYear);
  const [viewMonth, setViewMonth] = useState(parsed?.getMonth() ?? 0);
  const [yearPage, setYearPage]   = useState(Math.floor((parsed?.getFullYear() ?? defaultYear) / YEAR_PAGE) * YEAR_PAGE);

  const selYear  = parsed?.getFullYear();
  const selMonth = parsed?.getMonth();
  const selDay   = parsed?.getDate();

  // ── month navigation ─────────────────────────────────────────────────────
  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear((y) => y - 1); }
    else setViewMonth((m) => m - 1);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear((y) => y + 1); }
    else setViewMonth((m) => m + 1);
  };

  // ── year mode ────────────────────────────────────────────────────────────
  const openYearMode = () => {
    setYearPage(Math.floor(viewYear / YEAR_PAGE) * YEAR_PAGE);
    setMode('year');
  };
  const selectYear = (year: number) => {
    setViewYear(year);
    setMode('day');
  };

  // ── day selection ─────────────────────────────────────────────────────────
  const selectDay = (day: number) => {
    onChange(isoOf(viewYear, viewMonth, day));
    setOpen(false);
    setMode('day');
  };

  // ── calendar cells ────────────────────────────────────────────────────────
  const firstWD   = getFirstWeekday(viewYear, viewMonth);
  const daysCount = getDaysInMonth(viewYear, viewMonth);
  const cells: (number | null)[] = [
    ...Array(firstWD).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const age = value ? ageFromIso(value) : null;

  return (
    <View>
      {/* ── Trigger button ─────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[s.field, { backgroundColor: C.surface, borderColor: C.border }, open && s.fieldOpen, open && { borderColor: C.accent }, error ? s.fieldError : null]}
        onPress={() => { setOpen((v) => !v); setMode('day'); }}
        activeOpacity={0.8}
      >
        <GBIcon name="calendar" size={18} color={value ? C.accent : C.textDim} />
        <View style={{ flex: 1 }}>
          {value ? (
            <>
              <Text style={[s.fieldValue, { color: C.text }]}>{formatDate(value)}</Text>
              {age !== null && age >= 0 && (
                <Text style={[s.fieldAge, { color: C.accent }]}>{age} Jahre</Text>
              )}
            </>
          ) : (
            <Text style={[s.fieldPlaceholder, { color: C.textDim }]}>Geburtsdatum wählen</Text>
          )}
        </View>
        <GBIcon name={open ? 'chevronDown' : 'chevronRight'} size={15} color={C.textDim} />
      </TouchableOpacity>

      {/* ── Picker ─────────────────────────────────────────────────────── */}
      {open && (
        <View style={[s.picker, { backgroundColor: C.surface, borderColor: C.border }]}>

          {mode === 'day' ? (
            <>
              {/* Day-mode header */}
              <View style={s.header}>
                <TouchableOpacity onPress={prevMonth} style={[s.navBtn, { backgroundColor: C.surfaceAlt }]} activeOpacity={0.7}>
                  <GBIcon name="chevronLeft" size={18} color={C.text} />
                </TouchableOpacity>

                <TouchableOpacity onPress={openYearMode} style={s.monthYearBtn} activeOpacity={0.75}>
                  <Text style={[s.monthText, { color: C.text }]}>{MONATE[viewMonth]}</Text>
                  <View style={s.yearBadge}>
                    <Text style={[s.yearBadgeText, { color: C.accent }]}>{viewYear}</Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity onPress={nextMonth} style={[s.navBtn, { backgroundColor: C.surfaceAlt }]} activeOpacity={0.7}>
                  <GBIcon name="chevronRight" size={18} color={C.text} />
                </TouchableOpacity>
              </View>

              {/* Weekday labels */}
              <View style={s.weekRow}>
                {WOCHENTAGE.map((d) => (
                  <Text key={d} style={[s.weekLabel, { color: C.textDim }]}>{d}</Text>
                ))}
              </View>

              {/* Day grid */}
              {Array.from({ length: cells.length / 7 }).map((_, row) => (
                <View key={row} style={s.weekRow}>
                  {cells.slice(row * 7, row * 7 + 7).map((day, col) => {
                    const isSel = day === selDay && viewMonth === selMonth && viewYear === selYear;
                    const isFuture = day !== null &&
                      new Date(viewYear, viewMonth, day) > today;
                    return (
                      <TouchableOpacity
                        key={col}
                        style={s.dayCell}
                        onPress={() => day && !isFuture && selectDay(day)}
                        activeOpacity={0.7}
                        disabled={!day || isFuture}
                      >
                        {day !== null && (
                          <View style={[s.dayCircle, isSel && s.dayCircleSel]}>
                            <Text style={[
                              s.dayText,
                              { color: C.text },
                              isSel && s.dayTextSel,
                              isFuture && s.dayTextDim,
                              isFuture && { color: C.textDim },
                            ]}>
                              {day}
                            </Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ))}

              {/* Year jump hint */}
              <TouchableOpacity onPress={openYearMode} style={[s.yearHint, { borderTopColor: C.border }]} activeOpacity={0.7}>
                <GBIcon name="calendar" size={12} color={C.textDim} />
                <Text style={[s.yearHintText, { color: C.textDim }]}>Anderes Jahr wählen</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              {/* Year-mode header */}
              <View style={s.header}>
                <TouchableOpacity
                  onPress={() => setYearPage((p) => Math.max(minYear, p - YEAR_PAGE))}
                  style={[s.navBtn, { backgroundColor: C.surfaceAlt }]}
                  activeOpacity={0.7}
                  disabled={yearPage <= minYear}
                >
                  <GBIcon name="chevronLeft" size={18} color={yearPage <= minYear ? C.textDim : C.text} />
                </TouchableOpacity>
                <Text style={[s.rangeText, { color: C.text }]}>{yearPage} – {Math.min(yearPage + YEAR_PAGE - 1, maxYear)}</Text>
                <TouchableOpacity
                  onPress={() => setYearPage((p) => Math.min(Math.floor(maxYear / YEAR_PAGE) * YEAR_PAGE, p + YEAR_PAGE))}
                  style={[s.navBtn, { backgroundColor: C.surfaceAlt }]}
                  activeOpacity={0.7}
                  disabled={yearPage + YEAR_PAGE > maxYear}
                >
                  <GBIcon name="chevronRight" size={18} color={yearPage + YEAR_PAGE > maxYear ? C.textDim : C.text} />
                </TouchableOpacity>
              </View>

              {/* Year grid: 5 columns */}
              <View style={s.yearGrid}>
                {Array.from({ length: YEAR_PAGE }, (_, i) => yearPage + i)
                  .filter((y) => y >= minYear && y <= maxYear)
                  .map((year) => {
                    const isSel = year === selYear;
                    const isCur = year === viewYear;
                    return (
                      <TouchableOpacity
                        key={year}
                        style={[s.yearBtn, { backgroundColor: C.surfaceAlt, borderColor: C.border }, isSel && s.yearBtnSel, !isSel && isCur && s.yearBtnCur]}
                        onPress={() => selectYear(year)}
                        activeOpacity={0.75}
                      >
                        <Text style={[s.yearBtnText, { color: C.textSub }, isSel && s.yearBtnTextSel, !isSel && isCur && s.yearBtnTextCur]}>
                          {year}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
              </View>

              <TouchableOpacity onPress={() => setMode('day')} style={[s.yearHint, { borderTopColor: C.border }]} activeOpacity={0.7}>
                <GBIcon name="chevronLeft" size={12} color={C.textDim} />
                <Text style={[s.yearHintText, { color: C.textDim }]}>Zurück zum Kalender</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  // Trigger
  field:            { flexDirection: 'row', alignItems: 'center', gap: SP.md, backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md },
  fieldOpen:        { borderColor: C.accent },
  fieldError:       { borderColor: C.warn },
  fieldValue:       { fontSize: FONT.base, fontWeight: '600', color: C.text },
  fieldAge:         { fontSize: FONT.xs, color: C.accent, fontWeight: '700', marginTop: 1 },
  fieldPlaceholder: { fontSize: FONT.base, color: C.textDim },

  // Picker container
  picker: { marginTop: SP.sm, backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.lg, gap: SP.sm },

  // Header
  header:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.xs },
  navBtn:       { width: 34, height: 34, borderRadius: 17, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  monthYearBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm },
  monthText:    { fontSize: FONT.md, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  yearBadge:    { backgroundColor: C.accentLight, borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 2 },
  yearBadgeText:{ fontSize: FONT.sm, fontWeight: '800', color: C.accent },
  rangeText:    { fontSize: FONT.base, fontWeight: '700', color: C.text },

  // Weekday labels
  weekRow:  { flexDirection: 'row' },
  weekLabel:{ flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: C.textDim, letterSpacing: 0.5, paddingBottom: SP.xs },

  // Day cells
  dayCell:       { flex: 1, alignItems: 'center', paddingVertical: 2 },
  dayCircle:     { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  dayCircleSel:  { backgroundColor: C.accent },
  dayText:       { fontFamily: FONT_MONO, fontSize: 13, fontWeight: '600', color: C.text },
  dayTextSel:    { color: C.accentContrast, fontWeight: '800' },
  dayTextDim:    { color: C.textDim },

  // Year hint
  yearHint:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: SP.sm, borderTopWidth: 1, borderTopColor: C.border, marginTop: SP.xs },
  yearHintText: { fontSize: FONT.xs, color: C.textDim, fontWeight: '600' },

  // Year grid
  yearGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: SP.xs },
  yearBtn:         { width: '18%', flexGrow: 1, paddingVertical: SP.sm, alignItems: 'center', borderRadius: R.md, backgroundColor: C.surfaceAlt, borderWidth: 1, borderColor: C.border },
  yearBtnSel:      { backgroundColor: C.accent, borderColor: C.accent },
  yearBtnCur:      { borderColor: 'rgba(203,255,62,0.40)', backgroundColor: C.accentLight },
  yearBtnText:     { fontFamily: FONT_MONO, fontSize: FONT.sm, fontWeight: '600', color: C.textSub },
  yearBtnTextSel:  { color: C.accentContrast, fontWeight: '800' },
  yearBtnTextCur:  { color: C.accent },
});
