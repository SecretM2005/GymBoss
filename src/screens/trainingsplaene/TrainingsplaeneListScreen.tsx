import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList, Schwierigkeitsgrad } from '../../types';
import { useTrainingsplanStore } from '../../store/trainingsplanStore';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainingsplaeneList'>;
};

type Filter = 'alle' | 'mitKunde' | 'template';

const LEVEL_COLOR: Record<Schwierigkeitsgrad, { bg: string; text: string }> = {
  Anfänger:       { bg: C.successBg,  text: C.success },
  Fortgeschritten:{ bg: C.warningBg,  text: C.warning },
  Profi:          { bg: C.dangerBg,   text: C.danger },
};

export default function TrainingsplaeneListScreen({ navigation }: Props) {
  const { plaene } = useTrainingsplanStore();
  const { getKundeById } = useKundenStore();
  const [filter, setFilter] = useState<Filter>('alle');

  const filtered = useMemo(() => {
    if (filter === 'mitKunde') return plaene.filter((p) => !!p.kundeId);
    if (filter === 'template') return plaene.filter((p) => !p.kundeId);
    return plaene;
  }, [plaene, filter]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'alle',      label: `Alle (${plaene.length})` },
    { key: 'mitKunde',  label: `Mit Kunde (${plaene.filter((p) => !!p.kundeId).length})` },
    { key: 'template',  label: `Templates (${plaene.filter((p) => !p.kundeId).length})` },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.filterBar}>
        {FILTERS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.chip, filter === key && styles.chipActive]}
          >
            <Text style={[styles.chipText, filter === key && styles.chipTextActive]}>{label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('TrainingsplanForm', {})}
          >
            <Text style={styles.addBtnText}>+ Neuen Trainingsplan erstellen</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Keine Pläne vorhanden</Text>
            <Text style={styles.emptySub}>Erstelle deinen ersten Trainingsplan.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const kunde = item.kundeId ? getKundeById(item.kundeId) : undefined;
          const lc = LEVEL_COLOR[item.schwierigkeitsgrad];
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('TrainingsplanDetail', { planId: item.id })}
            >
              <View style={styles.cardLeft}>
                <View style={[styles.levelDot, { backgroundColor: lc.text }]} />
              </View>
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <View style={[styles.levelBadge, { backgroundColor: lc.bg }]}>
                    <Text style={[styles.levelText, { color: lc.text }]}>{item.schwierigkeitsgrad}</Text>
                  </View>
                </View>
                <View style={styles.cardMeta}>
                  {kunde ? (
                    <Text style={styles.metaText}>👤 {kunde.vorname} {kunde.nachname}</Text>
                  ) : (
                    <Text style={styles.metaTemplate}>📄 Template</Text>
                  )}
                  <Text style={styles.metaText}>🏋️ {item.uebungen.length} Übungen</Text>
                </View>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  filterBar: { flexDirection: 'row', gap: SP.sm, padding: SP.md, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  chip: { paddingHorizontal: SP.md, paddingVertical: SP.xs + 2, borderRadius: R.full, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: FONT.sm, color: C.textSub, fontWeight: '600' },
  chipTextActive: { color: C.white },

  list: { padding: SP.lg, gap: SP.md },
  addBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', marginBottom: SP.xs, ...SHADOW_SM },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },

  empty: { alignItems: 'center', paddingTop: 48, gap: SP.sm },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontWeight: '700', fontSize: FONT.md, color: C.textSub },
  emptySub: { fontSize: FONT.sm, color: C.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: C.card, borderRadius: R.md,
    flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.lg, ...SHADOW_SM,
  },
  cardLeft: { alignItems: 'center' },
  levelDot: { width: 10, height: 10, borderRadius: 5 },
  cardBody: { flex: 1, gap: SP.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: SP.sm },
  cardName: { fontWeight: '700', fontSize: FONT.base, color: C.text, flex: 1 },
  levelBadge: { borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 3 },
  levelText: { fontSize: FONT.xs, fontWeight: '700' },
  cardMeta: { flexDirection: 'row', gap: SP.md },
  metaText: { fontSize: FONT.sm, color: C.textSub },
  metaTemplate: { fontSize: FONT.sm, color: C.accent, fontWeight: '600' },
  chevron: { fontSize: 22, color: C.textMuted, fontWeight: '300' },
});
