import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { MitgliedschaftenStackParamList } from '../../types';

type Props = {
  navigation: StackNavigationProp<MitgliedschaftenStackParamList, 'MitgliedschaftenList'>;
};

const TABS = ['Alle', 'Aktiv', 'Gekündigt'] as const;
type TabFilter = typeof TABS[number];

const PLACEHOLDER = [
  { id: '1', name: 'Anna Müller', typ: 'Premium', status: 'Aktiv', ablauf: '31.12.2025', preis: '89 €/Mo' },
  { id: '2', name: 'Thomas Bauer', typ: 'Basic', status: 'Aktiv', ablauf: '28.02.2025', preis: '39 €/Mo' },
  { id: '3', name: 'Sophie Wagner', typ: 'Premium', status: 'Aktiv', ablauf: '30.06.2025', preis: '89 €/Mo' },
  { id: '4', name: 'Jan Koch', typ: 'Basic', status: 'Gekündigt', ablauf: '31.01.2025', preis: '39 €/Mo' },
];

export default function MitgliedschaftenListScreen({ navigation }: Props) {
  const [filter, setFilter] = useState<TabFilter>('Alle');

  const filtered = PLACEHOLDER.filter((m) => filter === 'Alle' || m.status === filter);

  return (
    <View style={styles.container}>
      <View style={styles.filterRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setFilter(tab)}
            style={[styles.filterTab, filter === tab && styles.filterTabActive]}
          >
            <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>{tab}</Text>
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
            onPress={() => navigation.navigate('MitgliedschaftAnlegen')}
          >
            <Text style={styles.addButtonText}>+ Neue Mitgliedschaft</Text>
          </TouchableOpacity>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('MitgliedschaftDetail', { mitgliedschaftId: item.id })}
          >
            <View style={styles.cardLeft}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardSub}>Läuft bis {item.ablauf}</Text>
            </View>
            <View style={styles.cardRight}>
              <Text style={styles.preis}>{item.preis}</Text>
              <View style={[styles.statusBadge, item.status === 'Aktiv' ? styles.statusAktiv : styles.statusGekuendigt]}>
                <Text style={[styles.statusText, item.status === 'Aktiv' ? styles.statusTextAktiv : styles.statusTextGekuendigt]}>
                  {item.status}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  filterRow: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
  },
  filterTabActive: { backgroundColor: '#6366f1' },
  filterText: { fontWeight: '600', color: '#6b7280', fontSize: 13 },
  filterTextActive: { color: '#fff' },
  list: { padding: 16, gap: 10 },
  addButton: {
    backgroundColor: '#6366f1',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 6,
  },
  addButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardLeft: { gap: 3 },
  cardName: { fontWeight: '600', color: '#111827', fontSize: 15 },
  cardSub: { color: '#9ca3af', fontSize: 12 },
  cardRight: { alignItems: 'flex-end', gap: 6 },
  preis: { fontWeight: '700', color: '#6366f1', fontSize: 14 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  statusAktiv: { backgroundColor: '#dcfce7' },
  statusGekuendigt: { backgroundColor: '#fee2e2' },
  statusText: { fontSize: 12, fontWeight: '600' },
  statusTextAktiv: { color: '#16a34a' },
  statusTextGekuendigt: { color: '#ef4444' },
});
