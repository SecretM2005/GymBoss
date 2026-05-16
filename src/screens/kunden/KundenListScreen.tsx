import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { KundenStackParamList, Kunde } from '../../types';
import { useKundenStore } from '../../store/kundenStore';

type Props = {
  navigation: StackNavigationProp<KundenStackParamList, 'KundenList'>;
};

type StatusFilter = 'alle' | 'aktiv' | 'inaktiv';

function initials(k: Kunde) {
  return `${k.vorname.charAt(0)}${k.nachname.charAt(0)}`.toUpperCase();
}

function formatDatum(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function KundenListScreen({ navigation }: Props) {
  const { kunden } = useKundenStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<StatusFilter>('alle');

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return kunden.filter((k) => {
      const matchesQuery =
        q === '' ||
        `${k.vorname} ${k.nachname}`.toLowerCase().includes(q) ||
        k.email.toLowerCase().includes(q) ||
        k.telefon.includes(q);
      const matchesFilter = filter === 'alle' || k.status === filter;
      return matchesQuery && matchesFilter;
    });
  }, [kunden, query, filter]);

  const aktiv = kunden.filter((k) => k.status === 'aktiv').length;

  return (
    <View style={styles.container}>
      {/* Suchleiste */}
      <View style={styles.searchBar}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Name, E-Mail oder Telefon suchen..."
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Statusfilter */}
      <View style={styles.filterRow}>
        {(['alle', 'aktiv', 'inaktiv'] as StatusFilter[]).map((f) => (
          <TouchableOpacity
            key={f}
            onPress={() => setFilter(f)}
            style={[styles.filterChip, filter === f && styles.filterChipActive]}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'alle' ? `Alle (${kunden.length})` : f === 'aktiv' ? `Aktiv (${aktiv})` : `Inaktiv (${kunden.length - aktiv})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => navigation.navigate('KundeForm', {})}
          >
            <Text style={styles.addButtonText}>+ Neuen Kunden anlegen</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>Keine Kunden gefunden</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => navigation.navigate('KundenDetail', { kundeId: item.id })}
          >
            <View style={[styles.avatar, item.status === 'inaktiv' && styles.avatarInaktiv]}>
              <Text style={styles.avatarText}>{initials(item)}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.vorname} {item.nachname}</Text>
              <Text style={styles.cardEmail} numberOfLines={1}>{item.email}</Text>
              <Text style={styles.cardDatum}>seit {formatDatum(item.eintrittsdatum)}</Text>
            </View>
            <View style={[styles.statusBadge, item.status === 'aktiv' ? styles.statusAktiv : styles.statusInaktiv]}>
              <Text style={[styles.statusText, item.status === 'aktiv' ? styles.statusTextAktiv : styles.statusTextInaktiv]}>
                {item.status}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9fafb' },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    margin: 12,
    marginBottom: 8,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  searchIcon: { fontSize: 16 },
  searchInput: { flex: 1, fontSize: 15, color: '#111827' },
  clearBtn: { color: '#9ca3af', fontSize: 14, paddingHorizontal: 4 },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  filterChipActive: { backgroundColor: '#6366f1' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#6b7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 12, paddingTop: 4, gap: 10 },
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
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#ede9fe',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInaktiv: { backgroundColor: '#f3f4f6' },
  avatarText: { fontSize: 16, fontWeight: '700', color: '#6366f1' },
  cardInfo: { flex: 1, gap: 1 },
  cardName: { fontWeight: '700', color: '#111827', fontSize: 15 },
  cardEmail: { color: '#6b7280', fontSize: 12 },
  cardDatum: { color: '#9ca3af', fontSize: 11, marginTop: 2 },
  statusBadge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4 },
  statusAktiv: { backgroundColor: '#dcfce7' },
  statusInaktiv: { backgroundColor: '#f3f4f6' },
  statusText: { fontSize: 12, fontWeight: '700' },
  statusTextAktiv: { color: '#16a34a' },
  statusTextInaktiv: { color: '#9ca3af' },
  empty: { alignItems: 'center', paddingTop: 48, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyText: { color: '#9ca3af', fontSize: 15 },
});
