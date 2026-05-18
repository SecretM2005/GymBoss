import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import { StackNavigationProp } from '@react-navigation/stack';
import { KalenderStackParamList } from '../../types';
import { useTerminStore } from '../../store/terminStore';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<KalenderStackParamList, 'KalenderOverview'>;
};

function today() {
  return new Date().toISOString().split('T')[0];
}

export default function KalenderScreen({ navigation }: Props) {
  const [selectedDate, setSelectedDate] = useState(today());
  const { termine } = useTerminStore();
  const { getKundeById } = useKundenStore();

  // Tage mit Terminen → für markedDates
  const markedDates = useMemo(() => {
    const marks: Record<string, object> = {};
    termine.forEach((t) => {
      marks[t.datum] = {
        marked: true,
        dotColor: t.datum === selectedDate ? C.white : C.accent,
        selectedColor: t.datum === selectedDate ? C.primary : undefined,
        selected: t.datum === selectedDate,
      };
    });
    // Ausgewählter Tag ohne Termine
    if (!marks[selectedDate]) {
      marks[selectedDate] = { selected: true, selectedColor: C.primary };
    } else {
      marks[selectedDate] = {
        ...(marks[selectedDate] as object),
        selected: true,
        selectedColor: C.primary,
        dotColor: C.white,
      };
    }
    return marks;
  }, [termine, selectedDate]);

  const tagesTermine = useMemo(
    () =>
      termine
        .filter((t) => t.datum === selectedDate)
        .sort((a, b) => a.uhrzeit.localeCompare(b.uhrzeit)),
    [termine, selectedDate]
  );

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <View style={styles.container}>
      <Calendar
        current={selectedDate}
        onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
        markedDates={markedDates}
        markingType="dot"
        theme={{
          backgroundColor: C.primary,
          calendarBackground: C.primary,
          selectedDayBackgroundColor: C.accent,
          selectedDayTextColor: C.white,
          todayTextColor: C.accent,
          dayTextColor: C.white,
          textDisabledColor: 'rgba(255,255,255,0.25)',
          dotColor: C.accent,
          selectedDotColor: C.white,
          arrowColor: C.white,
          monthTextColor: C.white,
          textDayFontWeight: '500',
          textMonthFontWeight: '700',
          textDayHeaderFontWeight: '600',
          textDayFontSize: FONT.base,
          textMonthFontSize: FONT.md,
        }}
      />

      {/* Tagesheader */}
      <View style={styles.dayHeader}>
        <Text style={styles.dayTitle}>{formatDate(selectedDate)}</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => navigation.navigate('TerminForm', { datum: selectedDate })}
        >
          <Text style={styles.addBtnText}>+ Termin</Text>
        </TouchableOpacity>
      </View>

      {/* Terminliste */}
      <FlatList
        data={tagesTermine}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Keine Termine</Text>
            <Text style={styles.emptySub}>Für diesen Tag sind keine Termine geplant.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const kunde = getKundeById(item.kundeId);
          const endMin = parseInt(item.uhrzeit.split(':')[0]) * 60
            + parseInt(item.uhrzeit.split(':')[1]) + item.dauer;
          const endStr = `${String(Math.floor(endMin / 60)).padStart(2, '0')}:${String(endMin % 60).padStart(2, '0')}`;

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('TerminDetail', { terminId: item.id })}
            >
              <View style={styles.timeCol}>
                <Text style={styles.timeStart}>{item.uhrzeit}</Text>
                <View style={styles.timeLine} />
                <Text style={styles.timeEnd}>{endStr}</Text>
              </View>
              <View style={styles.cardStripe} />
              <View style={styles.cardBody}>
                <Text style={styles.cardTitle}>{item.titel}</Text>
                {kunde && (
                  <Text style={styles.cardKunde}>
                    {kunde.vorname} {kunde.nachname}
                  </Text>
                )}
                <View style={styles.cardMeta}>
                  <View style={styles.metaChip}>
                    <Text style={styles.metaChipText}>⏱ {item.dauer} min</Text>
                  </View>
                  {item.notizen && (
                    <View style={styles.metaChip}>
                      <Text style={styles.metaChipText}>📝 Notiz</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SP.lg,
    paddingVertical: SP.md,
    backgroundColor: C.white,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  dayTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  addBtn: {
    backgroundColor: C.accent,
    borderRadius: R.sm,
    paddingHorizontal: SP.md,
    paddingVertical: SP.sm - 2,
  },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.sm },

  list: { padding: SP.lg, gap: SP.md },
  empty: { alignItems: 'center', paddingTop: 48, gap: SP.sm },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontWeight: '700', fontSize: FONT.md, color: C.textSub },
  emptySub: { fontSize: FONT.sm, color: C.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: C.card,
    borderRadius: R.md,
    flexDirection: 'row',
    alignItems: 'stretch',
    ...SHADOW_SM,
  },
  timeCol: {
    width: 52,
    alignItems: 'center',
    paddingVertical: SP.md,
    gap: SP.xs,
  },
  timeStart: { fontSize: FONT.xs, fontWeight: '700', color: C.primary },
  timeLine: { flex: 1, width: 2, backgroundColor: C.border, minHeight: 12 },
  timeEnd: { fontSize: FONT.xs, color: C.textMuted },
  cardStripe: { width: 3, backgroundColor: C.accent, borderRadius: 2, marginVertical: SP.xs },
  cardBody: { flex: 1, padding: SP.md, gap: SP.xs },
  cardTitle: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  cardKunde: { fontSize: FONT.sm, color: C.textSub },
  cardMeta: { flexDirection: 'row', gap: SP.sm, marginTop: SP.xs },
  metaChip: {
    backgroundColor: C.primaryLight,
    borderRadius: R.full,
    paddingHorizontal: SP.sm,
    paddingVertical: 3,
  },
  metaChipText: { fontSize: FONT.xs, color: C.primary, fontWeight: '600' },
});
