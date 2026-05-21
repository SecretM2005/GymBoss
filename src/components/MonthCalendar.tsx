import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { GBIcon } from './GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../theme';

const MONATE = ['Januar','Februar','März','April','Mai','Juni','Juli','August','September','Oktober','November','Dezember'];
const WOCHENTAGE = ['Mo','Di','Mi','Do','Fr','Sa','So'];

function getFirstWeekday(year: number, month: number): number {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

type Props = {
  markedDays?: Set<number>;
  legendLabel?: string;
};

export default function MonthCalendar({ markedDays = new Set<number>(), legendLabel = 'Training geplant' }: Props) {
  const today = new Date();
  const [year, setYear]   = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const firstWD   = getFirstWeekday(year, month);
  const daysCount = getDaysInMonth(year, month);
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const prevMonth = () => {
    if (month === 0) { setMonth(11); setYear(y => y - 1); } else setMonth(m => m - 1);
  };
  const nextMonth = () => {
    if (month === 11) { setMonth(0); setYear(y => y + 1); } else setMonth(m => m + 1);
  };

  const cells: (number | null)[] = [
    ...Array(firstWD).fill(null),
    ...Array.from({ length: daysCount }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  return (
    <View style={s.wrap}>
      <View style={s.header}>
        <TouchableOpacity onPress={prevMonth} style={s.navBtn} activeOpacity={0.7}>
          <GBIcon name="chevronLeft" size={18} color={C.text} />
        </TouchableOpacity>
        <Text style={s.monthTitle}>{MONATE[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.navBtn} activeOpacity={0.7}>
          <GBIcon name="chevronRight" size={18} color={C.text} />
        </TouchableOpacity>
      </View>

      <View style={s.weekRow}>
        {WOCHENTAGE.map((d) => (
          <Text key={d} style={s.weekDay}>{d}</Text>
        ))}
      </View>

      {Array.from({ length: cells.length / 7 }).map((_, rowIdx) => (
        <View key={rowIdx} style={s.weekRow}>
          {cells.slice(rowIdx * 7, rowIdx * 7 + 7).map((day, colIdx) => {
            const isToday  = isCurrentMonth && day === today.getDate();
            const hasTrain = day !== null && markedDays.has(day);
            const isPast   = day !== null && (
              year < today.getFullYear() ||
              (year === today.getFullYear() && month < today.getMonth()) ||
              (isCurrentMonth && day < today.getDate())
            );
            return (
              <View key={colIdx} style={s.cell}>
                {day !== null && (
                  <>
                    <View style={[s.dayCircle, isToday && s.dayCircleToday]}>
                      <Text style={[s.dayText, isToday && s.dayTextToday, isPast && !isToday && s.dayTextPast]}>
                        {day}
                      </Text>
                    </View>
                    {hasTrain && <View style={[s.dot, isToday && s.dotToday]} />}
                  </>
                )}
              </View>
            );
          })}
        </View>
      ))}

      <View style={s.legend}>
        <View style={s.legendItem}>
          <View style={[s.dot, { position: 'relative', top: 0 }]} />
          <Text style={s.legendText}>{legendLabel}</Text>
        </View>
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap:           { backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.lg },
  header:         { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: SP.md },
  navBtn:         { width: 32, height: 32, borderRadius: 16, backgroundColor: C.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  monthTitle:     { fontSize: FONT.base, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  weekRow:        { flexDirection: 'row' },
  weekDay:        { flex: 1, textAlign: 'center', fontSize: 10, fontWeight: '700', color: C.textDim, letterSpacing: 0.5, paddingBottom: SP.sm },
  cell:           { flex: 1, alignItems: 'center', paddingVertical: 3 },
  dayCircle:      { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  dayCircleToday: { backgroundColor: C.accent },
  dayText:        { fontFamily: FONT_MONO, fontSize: 13, fontWeight: '600', color: C.text },
  dayTextToday:   { color: C.accentContrast, fontWeight: '800' },
  dayTextPast:    { color: C.textDim },
  dot:            { position: 'absolute', bottom: 0, width: 5, height: 5, borderRadius: 3, backgroundColor: C.accent },
  dotToday:       { backgroundColor: C.accentContrast },
  legend:         { flexDirection: 'row', gap: SP.md, marginTop: SP.md, paddingTop: SP.sm, borderTopWidth: 1, borderTopColor: C.border },
  legendItem:     { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendText:     { fontSize: 11, color: C.textDim },
});
