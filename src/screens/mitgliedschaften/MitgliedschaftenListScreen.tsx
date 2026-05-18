import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MitgliedschaftenStackParamList, MitgliedschaftStatus } from '../../types';
import { useMitgliedschaftenStore, getEffectiveStatus } from '../../store/mitgliedschaftenStore';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<MitgliedschaftenStackParamList, 'MitgliedschaftenList'>;
};

type Filter = 'alle' | MitgliedschaftStatus;

const STATUS_CFG: Record<MitgliedschaftStatus, { bg: string; text: string; label: string }> = {
  aktiv:      { bg: C.successBg,  text: C.success,  label: 'Aktiv' },
  abgelaufen: { bg: C.warningBg,  text: C.warning,  label: 'Abgelaufen' },
  gekuendigt: { bg: C.dangerBg,   text: C.danger,   label: 'Gekündigt' },
};

const TYP_CFG = {
  Premium: { stripe: C.accent,   badge: C.accentLight, badgeText: C.accent },
  Basic:   { stripe: C.primary,  badge: C.primaryLight, badgeText: C.primary },
};

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MitgliedschaftenListScreen({ navigation }: Props) {
  const { mitgliedschaften } = useMitgliedschaftenStore();
  const { getKundeById } = useKundenStore();
  const [filter, setFilter] = useState<Filter>('alle');

  const enriched = useMemo(() =>
    mitgliedschaften.map((m) => ({ ...m, effectiveStatus: getEffectiveStatus(m), kunde: getKundeById(m.kundeId) })),
    [mitgliedschaften, getKundeById]
  );

  const counts = useMemo(() => {
    const c = { alle: enriched.length, aktiv: 0, abgelaufen: 0, gekuendigt: 0 };
    enriched.forEach((m) => { c[m.effectiveStatus]++; });
    return c;
  }, [enriched]);

  const filtered = filter === 'alle' ? enriched : enriched.filter((m) => m.effectiveStatus === filter);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'alle',       label: `Alle (${counts.alle})` },
    { key: 'aktiv',      label: `Aktiv (${counts.aktiv})` },
    { key: 'abgelaufen', label: `Abgelaufen (${counts.abgelaufen})` },
    { key: 'gekuendigt', label: `Gekündigt (${counts.gekuendigt})` },
  ];

  return (
    <View style={styles.container}>
      {/* Stats */}
      <View style={styles.statsRow}>
        {[
          { label: 'Aktiv',      val: counts.aktiv,      color: C.success },
          { label: 'Abgelaufen', val: counts.abgelaufen, color: C.warning },
          { label: 'Gekündigt',  val: counts.gekuendigt, color: C.danger },
        ].map((s, i) => (
          <View key={s.label} style={[styles.statTile, i > 0 && styles.statDivider]}>
            <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
            <Text style={styles.statLabel}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Filter */}
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
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate('MitgliedschaftForm', {})}>
            <Text style={styles.addBtnText}>+ Neue Mitgliedschaft</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyTitle}>Keine Einträge</Text>
            <Text style={styles.emptySub}>In dieser Kategorie sind keine Mitgliedschaften vorhanden.</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sc = STATUS_CFG[item.effectiveStatus];
          const tc = TYP_CFG[item.typ];
          const kundeName = item.kunde ? `${item.kunde.vorname} ${item.kunde.nachname}` : '–';
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('MitgliedschaftDetail', { mitgliedschaftId: item.id })}
            >
              <View style={[styles.stripe, { backgroundColor: tc.stripe }]} />
              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.kundeName}>{kundeName}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.statusText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </View>
                <View style={styles.cardMid}>
                  <View style={[styles.typBadge, { backgroundColor: tc.badge }]}>
                    <Text style={[styles.typText, { color: tc.badgeText }]}>{item.typ}</Text>
                  </View>
                  <Text style={styles.preis}>{item.preis} €/Monat</Text>
                </View>
                <Text style={styles.daten}>{formatDatum(item.startdatum)} – {formatDatum(item.enddatum)}</Text>
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
  statsRow: { flexDirection: 'row', backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  statTile: { flex: 1, alignItems: 'center', paddingVertical: SP.lg },
  statDivider: { borderLeftWidth: 1, borderLeftColor: C.border },
  statVal: { fontSize: FONT.xl, fontWeight: '800' },
  statLabel: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2, fontWeight: '500' },

  filterBar: { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm, padding: SP.md, backgroundColor: C.card, borderBottomWidth: 1, borderBottomColor: C.border },
  chip: { paddingHorizontal: SP.md, paddingVertical: SP.xs + 2, borderRadius: R.full, backgroundColor: C.bg, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: FONT.sm, fontWeight: '600', color: C.textSub },
  chipTextActive: { color: C.white },

  list: { padding: SP.md, gap: SP.sm },
  addBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', marginBottom: SP.xs, ...SHADOW_SM },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },

  empty: { alignItems: 'center', paddingTop: 48, gap: SP.sm, paddingHorizontal: SP.xxxl },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontWeight: '700', fontSize: FONT.md, color: C.textSub },
  emptySub: { fontSize: FONT.sm, color: C.textMuted, textAlign: 'center' },

  card: { backgroundColor: C.card, borderRadius: R.md, flexDirection: 'row', overflow: 'hidden', ...SHADOW_SM },
  stripe: { width: 4 },
  cardBody: { flex: 1, padding: SP.md, gap: SP.xs },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kundeName: { fontWeight: '700', fontSize: FONT.base, color: C.text, flex: 1, marginRight: SP.sm },
  statusBadge: { borderRadius: R.full, paddingHorizontal: SP.sm, paddingVertical: 3 },
  statusText: { fontSize: FONT.xs, fontWeight: '700' },
  cardMid: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  typBadge: { borderRadius: R.sm, paddingHorizontal: SP.sm, paddingVertical: 3 },
  typText: { fontSize: FONT.xs, fontWeight: '700' },
  preis: { fontSize: FONT.sm, color: C.textSub, fontWeight: '600' },
  daten: { fontSize: FONT.xs, color: C.textMuted },
});
