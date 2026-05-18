import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useRoleStore } from '../../../store/roleStore';
import { useFeedbackStore } from '../../../store/feedbackStore';
import { C, SP, R, FONT, SHADOW_SM, SHADOW_MD } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'SportlerPlanList'>;
};

export default function SportlerPlanListScreen({ navigation }: Props) {
  const { currentUser, getUserById } = useRoleStore();
  const { plaene } = useTrainingsplanStore();
  const { getFeedbacksBySpotler } = useFeedbackStore();

  const myPlans = plaene.filter((p) => p.sportlerId === currentUser.id);
  const feedbacks = getFeedbacksBySpotler(currentUser.id);
  const abgeschlossen = feedbacks.filter((f) => f.abgeschlossen).length;

  const totalWorkouts = myPlans.reduce(
    (acc, p) => acc + p.wochen.reduce((a, w) => a + w.workouts.length, 0), 0,
  );

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={myPlans}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.welcomeCard}>
              <View style={styles.welcomeAvatar}>
                <Text style={styles.welcomeAvatarText}>
                  {currentUser.name.split(' ').map((n) => n[0]).join('')}
                </Text>
              </View>
              <View style={styles.welcomeInfo}>
                <Text style={styles.welcomeName}>{currentUser.name}</Text>
                <Text style={styles.welcomeSub}>Deine Trainingspläne</Text>
              </View>
            </View>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statVal}>{myPlans.length}</Text>
                <Text style={styles.statLabel}>Pläne</Text>
              </View>
              <View style={[styles.statTile, styles.statDivider]}>
                <Text style={styles.statVal}>{totalWorkouts}</Text>
                <Text style={styles.statLabel}>Workouts</Text>
              </View>
              <View style={[styles.statTile, styles.statDivider]}>
                <Text style={[styles.statVal, { color: C.success }]}>{abgeschlossen}</Text>
                <Text style={styles.statLabel}>Erledigt</Text>
              </View>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Keine Pläne zugewiesen</Text>
            <Text style={styles.emptySub}>Dein Trainer hat dir noch keinen Trainingsplan zugewiesen.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const trainer = getUserById(item.trainerId);
          const workoutCount = item.wochen.reduce((a, w) => a + w.workouts.length, 0);

          const today = new Date();
          const start = new Date(item.startdatum);
          const daysIn = Math.max(0, Math.floor((today.getTime() - start.getTime()) / 86400000));
          const currentWeek = Math.min(Math.ceil((daysIn + 1) / 7), item.wochen.length);
          const progress = item.wochen.length > 0 ? Math.round((currentWeek / item.wochen.length) * 100) : 0;

          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('SportlerWochenansicht', { planId: item.id })}
            >
              <View style={styles.cardHeader}>
                <Text style={styles.planName}>{item.name}</Text>
                <View style={styles.weekBadge}>
                  <Text style={styles.weekBadgeText}>KW {currentWeek}/{item.wochen.length}</Text>
                </View>
              </View>

              {item.ziel ? <Text style={styles.ziel}>{item.ziel}</Text> : null}

              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${progress}%` as `${number}%` }]} />
              </View>
              <Text style={styles.progressLabel}>{progress}% abgeschlossen</Text>

              <View style={styles.cardMeta}>
                {trainer && <Text style={styles.trainerLabel}>Trainer: {trainer.name}</Text>}
                <View style={styles.metaRight}>
                  <Text style={styles.metaItem}>{item.wochen.length} Wo.</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaItem}>{workoutCount} Workouts</Text>
                  <Text style={styles.metaDot}>·</Text>
                  <Text style={styles.metaItem}>ab {formatDate(item.startdatum)}</Text>
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
  list: { gap: SP.md, padding: SP.md, paddingBottom: SP.xxxl },

  header: { gap: SP.md, marginBottom: SP.xs },
  welcomeCard: { backgroundColor: C.primary, borderRadius: R.lg, padding: SP.lg, flexDirection: 'row', alignItems: 'center', gap: SP.md, ...SHADOW_MD },
  welcomeAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  welcomeAvatarText: { fontSize: FONT.md, fontWeight: '800', color: C.white },
  welcomeInfo: { flex: 1 },
  welcomeName: { fontSize: FONT.md, fontWeight: '800', color: C.white },
  welcomeSub: { fontSize: FONT.sm, color: 'rgba(255,255,255,0.7)', marginTop: 2 },

  statsRow: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.md, ...SHADOW_SM },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: SP.lg },
  statDivider: { borderLeftWidth: 1, borderLeftColor: C.border },
  statVal: { fontSize: FONT.xl, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2, fontWeight: '500' },

  empty: { alignItems: 'center', paddingTop: 48, gap: SP.sm, paddingHorizontal: SP.xxxl },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontWeight: '700', fontSize: FONT.md, color: C.textSub },
  emptySub: { fontSize: FONT.sm, color: C.textMuted, textAlign: 'center' },

  card: { backgroundColor: C.card, borderRadius: R.lg, padding: SP.lg, gap: SP.sm, ...SHADOW_SM },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  planName: { fontWeight: '800', fontSize: FONT.md, color: C.text, flex: 1, marginRight: SP.sm },
  weekBadge: { backgroundColor: C.accentLight, borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 3 },
  weekBadgeText: { fontSize: FONT.xs, fontWeight: '700', color: C.accent },
  ziel: { fontSize: FONT.sm, color: C.textSub },
  progressBar: { height: 6, backgroundColor: C.border, borderRadius: R.full, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: C.accent, borderRadius: R.full },
  progressLabel: { fontSize: FONT.xs, color: C.textMuted },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: SP.xs },
  trainerLabel: { fontSize: FONT.xs, color: C.textSub, fontWeight: '500' },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: SP.xs },
  metaItem: { fontSize: FONT.xs, color: C.textMuted },
  metaDot: { color: C.textMuted, fontSize: FONT.xs },
});
