import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MitgliedschaftenStackParamList, MitgliedschaftStatus } from '../../types';
import { useMitgliedschaftenStore, getEffectiveStatus } from '../../store/mitgliedschaftenStore';
import { useKundenStore } from '../../store/kundenStore';

type Props = {
  navigation: StackNavigationProp<MitgliedschaftenStackParamList, 'MitgliedschaftenList'>;
};

type Filter = 'alle' | MitgliedschaftStatus;

const TYP_CONFIG = {
  Premium: { bg: '#ede9fe', text: '#6366f1' },
  Basic:   { bg: '#f3f4f6', text: '#6b7280' },
} as const;

const STATUS_CONFIG: Record<MitgliedschaftStatus, { bg: string; text: string; label: string }> = {
  aktiv:      { bg: '#dcfce7', text: '#16a34a', label: 'Aktiv' },
  abgelaufen: { bg: '#fef9c3', text: '#ca8a04', label: 'Abgelaufen' },
  gekuendigt: { bg: '#fee2e2', text: '#ef4444', label: 'Gekündigt' },
};

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function MitgliedschaftenListScreen({ navigation }: Props) {
  const { mitgliedschaften } = useMitgliedschaftenStore();
  const { getKundeById } = useKundenStore();
  const [filter, setFilter] = useState<Filter>('alle');

  const enriched = useMemo(
    () =>
      mitgliedschaften.map((m) => ({
        ...m,
        effectiveStatus: getEffectiveStatus(m),
        kunde: getKundeById(m.kundeId),
      })),
    [mitgliedschaften, getKundeById]
  );

  const counts = useMemo(() => {
    const c = { alle: enriched.length, aktiv: 0, abgelaufen: 0, gekuendigt: 0 };
    enriched.forEach((m) => { c[m.effectiveStatus]++; });
    return c;
  }, [enriched]);

  const filtered = useMemo(
    () => (filter === 'alle' ? enriched : enriched.filter((m) => m.effectiveStatus === filter)),
    [enriched, filter]
  );

  const FILTER_TABS: { key: Filter; label: string }[] = [
    { key: 'alle',      label: `Alle (${counts.alle})` },
    { key: 'aktiv',     label: `Aktiv (${counts.aktiv})` },
    { key: 'abgelaufen',label: `Abgelaufen (${counts.abgelaufen})` },
    { key: 'gekuendigt',label: `Gekündigt (${counts.gekuendigt})` },
  ];

  return (
    <View style={styles.container}>
      {/* Zusammenfassung */}
      <View style={styles.summaryRow}>
        <View style={styles.summaryTile}>
          <Text style={styles.summaryValue}>{counts.aktiv}</Text>
          <Text style={styles.summaryLabel}>Aktiv</Text>
        </View>
        <View style={[styles.summaryTile, styles.summaryDivider]}>
          <Text style={[styles.summaryValue, { color: '#ca8a04' }]}>{counts.abgelaufen}</Text>
          <Text style={styles.summaryLabel}>Abgelaufen</Text>
        </View>
        <View style={[styles.summaryTile, styles.summaryDivider]}>
          <Text style={[styles.summaryValue, { color: '#ef4444' }]}>{counts.gekuendigt}</Text>
          <Text style={styles.summaryLabel}>Gekündigt</Text>
        </View>
      </View>

      {/* Filterleiste (horizontal scrollbar) */}
      <View style={styles.filterBar}>
        {FILTER_TABS.map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setFilter(key)}
            style={[styles.filterChip, filter === key && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === key && styles.filterTextActive]}>
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('MitgliedschaftForm', {})}
          >
            <Text style={styles.addButtonText}>+ Neue Mitgliedschaft</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🏷️</Text>
            <Text style={styles.emptyText}>Keine Einträge in dieser Kategorie</Text>
          </View>
        }
        renderItem={({ item }) => {
          const sc = STATUS_CONFIG[item.effectiveStatus];
          const tc = TYP_CONFIG[item.typ];
          const kundeName = item.kunde
            ? `${item.kunde.vorname} ${item.kunde.nachname}`
            : '– unbekannt –';
          return (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.7}
              onPress={() => navigation.navigate('MitgliedschaftDetail', { mitgliedschaftId: item.id })}
            >
              {/* Linker farbiger Streifen je nach Typ */}
              <View style={[styles.typStripe, { backgroundColor: tc.text }]} />

              <View style={styles.cardBody}>
                <View style={styles.cardTop}>
                  <Text style={styles.kundeName}>{kundeName}</Text>
                  <View style={[styles.badge, { backgroundColor: sc.bg }]}>
                    <Text style={[styles.badgeText, { color: sc.text }]}>{sc.label}</Text>
                  </View>
                </View>

                <View style={styles.cardMid}>
                  <View style={[styles.typBadge, { backgroundColor: tc.bg }]}>
                    <Text style={[styles.typText, { color: tc.text }]}>{item.typ}</Text>
                  </View>
                  <Text style={styles.preis}>{item.preis} €/Monat</Text>
                </View>

                <Text style={styles.daten}>
                  {formatDatum(item.startdatum)} – {formatDatum(item.enddatum)}
                </Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },

  summaryRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  summaryTile: { flex: 1, alignItems: 'center', paddingVertical: 14 },
  summaryDivider: { borderLeftWidth: 1, borderLeftColor: '#e5e7eb' },
  summaryValue: { fontSize: 22, fontWeight: '800', color: '#6366f1' },
  summaryLabel: { fontSize: 11, color: '#9ca3af', marginTop: 2, fontWeight: '500' },

  filterBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
  },
  filterChipActive: { backgroundColor: '#6366f1' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },

  list: { padding: 12, gap: 10 },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 4,
  },
  addButtonText: { color: '#fff', fontWeight: '700', fontSize: 15 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    flexDirection: 'row',
    overflow: 'hidden',
  },
  typStripe: { width: 4 },
  cardBody: { flex: 1, padding: 14, gap: 6 },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  kundeName: { fontWeight: '700', color: '#111827', fontSize: 15, flex: 1, marginRight: 8 },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeText: { fontSize: 12, fontWeight: '700' },
  cardMid: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  typBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typText: { fontSize: 12, fontWeight: '700' },
  preis: { fontSize: 13, color: '#374151', fontWeight: '600' },
  daten: { fontSize: 12, color: '#9ca3af' },

  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: '#9ca3af', fontSize: 15 },
});
