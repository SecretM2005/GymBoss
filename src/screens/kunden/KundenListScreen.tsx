import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { KundenStackParamList, Kunde } from '../../types';
import { useKundenStore } from '../../store/kundenStore';
import { C, SP, R, FONT, SHADOW_SM } from '../../theme';

type Props = {
  navigation: StackNavigationProp<KundenStackParamList, 'KundenList'>;
};

type Filter = 'alle' | 'aktiv' | 'inaktiv';

function initials(k: Kunde) {
  return `${k.vorname.charAt(0)}${k.nachname.charAt(0)}`.toUpperCase();
}

function formatDatum(iso: string) {
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function KundenListScreen({ navigation }: Props) {
  const { kunden } = useKundenStore();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('alle');

  const aktiv = kunden.filter((k) => k.status === 'aktiv').length;

  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    return kunden.filter((k) => {
      const matchQ = q === '' || `${k.vorname} ${k.nachname}`.toLowerCase().includes(q) || k.email.toLowerCase().includes(q) || k.telefon.includes(q);
      const matchF = filter === 'alle' || k.status === filter;
      return matchQ && matchF;
    });
  }, [kunden, query, filter]);

  const FILTERS: { key: Filter; label: string }[] = [
    { key: 'alle',    label: `Alle (${kunden.length})` },
    { key: 'aktiv',   label: `Aktiv (${aktiv})` },
    { key: 'inaktiv', label: `Inaktiv (${kunden.length - aktiv})` },
  ];

  return (
    <View style={styles.container}>
      {/* Suche */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Name, E-Mail oder Telefon..."
          placeholderTextColor={C.textMuted}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery('')}>
            <Text style={styles.clearBtn}>✕</Text>
          </TouchableOpacity>
        )}
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
        keyExtractor={(k) => k.id}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate('KundeForm', {})}
          >
            <Text style={styles.addBtnText}>+ Neuen Kunden anlegen</Text>
          </TouchableOpacity>
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>👥</Text>
            <Text style={styles.emptyTitle}>Keine Kunden gefunden</Text>
            <Text style={styles.emptySub}>Ändere die Suchkriterien oder lege einen neuen Kunden an.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('KundenDetail', { kundeId: item.id })}
          >
            <View style={[styles.avatar, item.status === 'inaktiv' && styles.avatarInaktiv]}>
              <Text style={[styles.avatarText, item.status === 'inaktiv' && styles.avatarTextInaktiv]}>
                {initials(item)}
              </Text>
            </View>
            <View style={styles.info}>
              <Text style={styles.name}>{item.vorname} {item.nachname}</Text>
              <Text style={styles.email} numberOfLines={1}>{item.email}</Text>
              <Text style={styles.datum}>seit {formatDatum(item.eintrittsdatum)}</Text>
            </View>
            <View style={[styles.badge, item.status === 'aktiv' ? styles.badgeAktiv : styles.badgeInaktiv]}>
              <Text style={[styles.badgeText, item.status === 'aktiv' ? styles.badgeTextAktiv : styles.badgeTextInaktiv]}>
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
  container: { flex: 1, backgroundColor: C.bg },

  searchWrap: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: C.card, margin: SP.md, borderRadius: R.md,
    paddingHorizontal: SP.md, paddingVertical: SP.sm,
    borderWidth: 1, borderColor: C.border, gap: SP.sm, ...SHADOW_SM,
  },
  searchIcon: { fontSize: 15 },
  searchInput: { flex: 1, fontSize: FONT.base, color: C.text },
  clearBtn: { color: C.textMuted, fontSize: 13, paddingHorizontal: SP.xs },

  filterBar: {
    flexDirection: 'row', gap: SP.sm,
    paddingHorizontal: SP.md, paddingBottom: SP.sm,
  },
  chip: { paddingHorizontal: SP.md, paddingVertical: SP.xs + 2, borderRadius: R.full, backgroundColor: C.card, borderWidth: 1, borderColor: C.border },
  chipActive: { backgroundColor: C.primary, borderColor: C.primary },
  chipText: { fontSize: FONT.sm, fontWeight: '600', color: C.textSub },
  chipTextActive: { color: C.white },

  list: { paddingHorizontal: SP.md, paddingBottom: SP.lg, gap: SP.sm },
  addBtn: { backgroundColor: C.accent, borderRadius: R.md, paddingVertical: SP.lg - 2, alignItems: 'center', marginBottom: SP.sm, ...SHADOW_SM },
  addBtnText: { color: C.white, fontWeight: '700', fontSize: FONT.base },

  empty: { alignItems: 'center', paddingTop: 48, gap: SP.sm, paddingHorizontal: SP.xxxl },
  emptyIcon: { fontSize: 40 },
  emptyTitle: { fontWeight: '700', fontSize: FONT.md, color: C.textSub },
  emptySub: { fontSize: FONT.sm, color: C.textMuted, textAlign: 'center' },

  card: {
    backgroundColor: C.card, borderRadius: R.md,
    flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, ...SHADOW_SM,
  },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' },
  avatarInaktiv: { backgroundColor: C.bg },
  avatarText: { fontSize: FONT.base, fontWeight: '800', color: C.primary },
  avatarTextInaktiv: { color: C.textMuted },
  info: { flex: 1, gap: 1 },
  name: { fontWeight: '700', fontSize: FONT.base, color: C.text },
  email: { fontSize: FONT.xs, color: C.textSub },
  datum: { fontSize: FONT.xs, color: C.textMuted, marginTop: 2 },
  badge: { borderRadius: R.full, paddingHorizontal: SP.md, paddingVertical: SP.xs },
  badgeAktiv: { backgroundColor: C.successBg },
  badgeInaktiv: { backgroundColor: C.bg },
  badgeText: { fontSize: FONT.xs, fontWeight: '700' },
  badgeTextAktiv: { color: C.success },
  badgeTextInaktiv: { color: C.textMuted },
});
