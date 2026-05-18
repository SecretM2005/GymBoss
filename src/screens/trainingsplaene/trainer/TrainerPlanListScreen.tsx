import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import { useRoleStore } from '../../../store/roleStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerPlanList'>;
};

export default function TrainerPlanListScreen({ navigation }: Props) {
  const { plaene, deletePlan } = useTrainingsplanStore();
  const { currentUser, getUserById } = useRoleStore();

  const myPlans = plaene.filter((p) => p.trainerId === currentUser.id);

  const totalWorkouts = (planId: string) => {
    const plan = plaene.find((p) => p.id === planId);
    if (!plan) return 0;
    return plan.wochen.reduce((acc, w) => acc + w.workouts.length, 0);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={myPlans}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={styles.statsRow}>
              <View style={styles.statTile}>
                <Text style={styles.statVal}>{myPlans.length}</Text>
                <Text style={styles.statLabel}>Pläne</Text>
              </View>
              <View style={[styles.statTile, styles.statDivider]}>
                <Text style={styles.statVal}>
                  {[...new Set(myPlans.map((p) => p.sportlerId))].length}
                </Text>
                <Text style={styles.statLabel}>Sportler</Text>
              </View>
              <View style={[styles.statTile, styles.statDivider]}>
                <Text style={styles.statVal}>
                  {myPlans.reduce((acc, p) => acc + p.wochen.length, 0)}
                </Text>
                <Text style={styles.statLabel}>Wochen</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('TrainerPlanForm', {})}>
              <Text style={styles.addBtnText}>+ Neuen Plan erstellen</Text>
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Noch keine Pläne</Text>
            <Text style={styles.emptySub}>Erstelle deinen ersten Trainingsplan.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sportler = getUserById(item.sportlerId);
          const wdCount = totalWorkouts(item.id);
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('TrainerPlanForm', { planId: item.id })}
            >
              <View style={styles.stripe} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.planName} numberOfLines={1}>{item.name}</Text>
                  <TouchableOpacity
                    onPress={() =>
                      navigation.navigate('TrainerPlanForm', { planId: item.id })
                    }
                    style={styles.editBtn}
                  >
                    <Text style={styles.editBtnText}>Bearbeiten</Text>
                  </TouchableOpacity>
                </View>
                {item.ziel ? (
                  <Text style={styles.ziel} numberOfLines={1}>{item.ziel}</Text>
                ) : null}
                <View style={styles.cardMeta}>
                  {sportler && (
                    <View style={styles.sportlerBadge}>
                      <View style={styles.sportlerAvatar}>
                        <Text style={styles.sportlerAvatarText}>
                          {sportler.name.split(' ').map((n) => n[0]).join('')}
                        </Text>
                      </View>
                      <Text style={styles.sportlerName}>{sportler.name}</Text>
                    </View>
                  )}
                  <View style={styles.metaRight}>
                    <Text style={styles.metaItem}>{item.wochen.length} Wo.</Text>
                    <Text style={styles.metaDot}>·</Text>
                    <Text style={styles.metaItem}>{wdCount} Workouts</Text>
                  </View>
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
  list: { gap: SP.sm, padding: SP.md, paddingBottom: SP.xxxl },

  header: { gap: SP.md, marginBottom: SP.xs },
  statsRow: { flexDirection: 'row', backgroundColor: C.card, borderRadius: R.md, ...SHADOW_SM },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: SP.lg },
  statDivider: { borderLeftWidth: 1, borderLeftColor: C.border },
  statVal: { fontSize: FONT.xl, fontWeight: '800', color: C.primary },
  statLabel: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2, fontWeight: '500' },

  addBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', ...SHADOW_SM },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },

  empty: { alignItems: 'center', paddingTop: 48, gap: SP.sm, paddingHorizontal: SP.xxxl },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontWeight: '700', fontSize: FONT.md, color: C.textSub },
  emptySub: { fontSize: FONT.sm, color: C.textMuted, textAlign: 'center' },

  card: { backgroundColor: C.card, borderRadius: R.md, flexDirection: 'row', overflow: 'hidden', ...SHADOW_SM },
  stripe: { width: 4, backgroundColor: C.accent },
  cardBody: { flex: 1, padding: SP.md, gap: SP.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planName: { fontWeight: '700', fontSize: FONT.base, color: C.text, flex: 1, marginRight: SP.sm },
  editBtn: { backgroundColor: C.primaryLight, borderRadius: R.sm, paddingHorizontal: SP.sm, paddingVertical: 3 },
  editBtnText: { color: C.primary, fontSize: FONT.xs, fontWeight: '700' },
  ziel: { fontSize: FONT.sm, color: C.textSub },
  cardMeta: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: SP.xs },
  sportlerBadge: { flexDirection: 'row', alignItems: 'center', gap: SP.xs },
  sportlerAvatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  sportlerAvatarText: { fontSize: 9, fontWeight: '800', color: C.primary },
  sportlerName: { fontSize: FONT.sm, color: C.textSub, fontWeight: '600' },
  metaRight: { flexDirection: 'row', alignItems: 'center', gap: SP.xs },
  metaItem: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '500' },
  metaDot: { color: C.textMuted, fontSize: FONT.xs },
});
