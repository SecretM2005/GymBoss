import React from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingsplaeneStackParamList, Wochentag, PlanWorkout } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import TopBar from '../../../components/TopBar';
import TypeChip from '../../../components/TypeChip';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerWoche'>;
  route: RouteProp<TrainingsplaeneStackParamList, 'TrainerWoche'>;
};

const TAGE: Wochentag[] = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
const TAG_NAMEN: Record<Wochentag, string> = {
  Mo: 'Mo', Di: 'Di', Mi: 'Mi', Do: 'Do', Fr: 'Fr', Sa: 'Sa', So: 'So',
};

export default function TrainerWocheScreen({ navigation, route }: Props) {
  const { planId, wocheId } = route.params;
  const { getPlanById, addWorkout, deleteWorkout } = useTrainingsplanStore();
  const plan = getPlanById(planId);
  const woche = plan?.wochen.find((w) => w.id === wocheId);

  if (!plan || !woche) {
    return (
      <View style={styles.root}>
        <TopBar
          title="Woche"
          leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
        />
        <View style={styles.notFound}>
          <Text style={styles.notFoundText}>Woche nicht gefunden.</Text>
        </View>
      </View>
    );
  }

  const workoutsByTag = TAGE.reduce<Record<Wochentag, PlanWorkout[]>>((acc, tag) => {
    acc[tag] = woche.workouts.filter((wo) => wo.wochentag === tag);
    return acc;
  }, {} as Record<Wochentag, PlanWorkout[]>);

  const handleAddWorkout = (tag: Wochentag) => {
    const workoutId = addWorkout(planId, wocheId, { name: 'Neues Workout', wochentag: tag, typ: 'Krafttraining' });
    navigation.navigate('TrainerWorkout', { planId, wocheId, workoutId });
  };

  const handleDeleteWorkout = (workoutId: string, name: string) => {
    Alert.alert('Workout löschen', `"${name}" wirklich löschen?`, [
      { text: 'Abbrechen', style: 'cancel' },
      { text: 'Löschen', style: 'destructive', onPress: () => deleteWorkout(planId, wocheId, workoutId) },
    ]);
  };

  return (
    <View style={styles.root}>
      <TopBar
        large
        subtitle={plan.name}
        title={`Woche ${woche.wochennummer}`}
        leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={styles.content}>

        {/* Notiz banner */}
        {!!woche.notizen && (
          <View style={styles.notizBanner}>
            <GBIcon name="bolt" size={14} color={C.accent} />
            <Text style={styles.notizText}>{woche.notizen}</Text>
          </View>
        )}

        {/* Day rows */}
        <View style={styles.table}>
          {TAGE.map((tag) => {
            const dayWorkouts = workoutsByTag[tag];
            const hasWorkouts = dayWorkouts.length > 0;
            return (
              <View key={tag} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{TAG_NAMEN[tag]}</Text>
                <View style={styles.daySlots}>
                  {hasWorkouts ? (
                    dayWorkouts.map((wo) => (
                      <TouchableOpacity
                        key={wo.id}
                        style={styles.workoutSlot}
                        activeOpacity={0.75}
                        onPress={() => navigation.navigate('TrainerWorkout', { planId, wocheId, workoutId: wo.id })}
                        onLongPress={() => handleDeleteWorkout(wo.id, wo.name)}
                      >
                        <TypeChip typ={wo.typ} />
                        <View style={styles.slotInfo}>
                          <Text style={styles.slotName} numberOfLines={1}>{wo.name}</Text>
                          <Text style={styles.slotMeta}>{wo.uebungen.length} Übungen</Text>
                        </View>
                        <GBIcon name="chevronRight" size={16} color={C.textDim} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <TouchableOpacity
                      style={styles.emptySlot}
                      onPress={() => handleAddWorkout(tag)}
                      activeOpacity={0.6}
                    >
                      <GBIcon name="plus" size={14} color={C.textDim} />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Add workout button */}
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            const firstFreeTag = TAGE.find((t) => workoutsByTag[t].length === 0) ?? 'Mo';
            handleAddWorkout(firstFreeTag);
          }}
          activeOpacity={0.85}
        >
          <GBIcon name="plus" size={16} color={C.accentContrast} />
          <Text style={styles.addBtnText}>Workout hinzufügen</Text>
        </TouchableOpacity>

        <View style={{ height: SP.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.md, paddingBottom: 80 },
  notFound: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notFoundText: { color: C.textMuted, fontSize: FONT.base },

  notizBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm,
    backgroundColor: C.accentLight, borderRadius: R.md,
    padding: SP.md, borderWidth: 1, borderColor: 'rgba(203,255,62,0.25)',
  },
  notizText: { flex: 1, fontSize: FONT.sm, color: C.accent, fontWeight: '500' },

  table: { gap: SP.sm },
  dayRow: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.md },
  dayLabel: {
    width: 28, paddingTop: SP.md + 2,
    fontSize: FONT.xs, fontWeight: '700', color: C.textMuted,
    letterSpacing: 0.6, textTransform: 'uppercase',
  },
  daySlots: { flex: 1, gap: SP.xs },

  workoutSlot: {
    flexDirection: 'row', alignItems: 'center', gap: SP.sm,
    backgroundColor: C.surface, borderRadius: R.md,
    padding: SP.md, borderWidth: 1, borderColor: C.border,
  },
  slotInfo: { flex: 1 },
  slotName: { fontSize: FONT.sm, fontWeight: '600', color: C.text },
  slotMeta: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },

  emptySlot: {
    borderWidth: 1.5, borderColor: C.border, borderStyle: 'dashed',
    borderRadius: R.md, height: 44,
    alignItems: 'center', justifyContent: 'center',
  },

  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: SP.sm, backgroundColor: C.accent, borderRadius: R.full,
    paddingVertical: SP.md, marginTop: SP.sm,
  },
  addBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },
});
