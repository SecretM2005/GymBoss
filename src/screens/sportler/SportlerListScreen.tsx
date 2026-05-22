import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TextInput, TouchableOpacity, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SportlerStackParamList } from '../../types';
import { useAthletenStore } from '../../store/athletenStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = { navigation: StackNavigationProp<SportlerStackParamList, 'SportlerList'> };

const SPORTART_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  'Kraftsport':      { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E', dot: '#CBFF3E' },
  'Kampfsport':      { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66', dot: '#FF6A3D' },
  'Leichtathletik':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Konditionierung': { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Mobility':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF', dot: '#C39CFF' },
  'Crossfit':        { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582', dot: '#7AE582' },
};

function ageFromIso(iso?: string): number | null {
  if (!iso) return null;
  const b = new Date(iso);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
}

function SportartChip({ sportart }: { sportart?: string }) {
  if (!sportart) return null;
  const c = SPORTART_COLORS[sportart] ?? { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textDim };
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: c.dot }]} />
      <Text style={[styles.chipText, { color: c.fg }]}>{sportart}</Text>
    </View>
  );
}

export default function SportlerListScreen({ navigation }: Props) {
  const { sportler, deleteSportler } = useAthletenStore();
  const [q, setQ] = useState('');
  const insets = useSafeAreaInsets();

  const filtered = sportler.filter((s) =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    (s.sportart ?? '').toLowerCase().includes(q.toLowerCase())
  );

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Sportler löschen',
      `${name} wirklich entfernen?`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => deleteSportler(id) },
      ]
    );
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Top Bar */}
      <View style={styles.topBar}>
        <View>
          <Text style={styles.topSub}>Trainer · Verwaltung</Text>
          <Text style={styles.topTitle}>Sportler</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statAccent]}>
            <Text style={[styles.statVal, styles.statValAccent]}>{sportler.length}</Text>
            <Text style={[styles.statLabel, styles.statLabelAccent]}>Sportler</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statVal}>{sportler.filter((s) => s.sportart).length}</Text>
            <Text style={styles.statLabel}>Aktiv</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statVal}>
              {[...new Set(sportler.map((s) => s.sportart).filter(Boolean))].length}
            </Text>
            <Text style={styles.statLabel}>Sportarten</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <GBIcon name="search" size={16} color={C.textMuted} />
          <TextInput
            style={styles.searchInput}
            value={q}
            onChangeText={setQ}
            placeholder="Sportler suchen…"
            placeholderTextColor={C.textDim}
            autoCapitalize="none"
          />
          {q.length > 0 && (
            <TouchableOpacity onPress={() => setQ('')} activeOpacity={0.7}>
              <GBIcon name="close" size={16} color={C.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Section header */}
        <View style={styles.sectionHead}>
          <Text style={styles.sectionLabel}>Alle Sportler · {filtered.length}</Text>
        </View>

        {/* Cards */}
        {filtered.map((sp) => (
          <TouchableOpacity
            key={sp.id}
            style={styles.card}
            activeOpacity={0.75}
            onPress={() => navigation.navigate('SportlerDetail', { sportlerId: sp.id })}
          >
            <View style={styles.cardStripe} />
            <View style={styles.cardBody}>
              <View style={styles.cardRow}>
                <GBAvatar name={sp.name} initials={sp.initials} size={52} />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName}>{sp.name}</Text>
                  <View style={styles.cardMeta}>
                    {sp.geburtsdatum != null && (
                      <Text style={styles.cardAge}>{ageFromIso(sp.geburtsdatum)} J.</Text>
                    )}
                    <SportartChip sportart={sp.sportart} />
                  </View>
                </View>
                <TouchableOpacity
                  onPress={() => handleDelete(sp.id, sp.name)}
                  style={styles.deleteBtn}
                  activeOpacity={0.7}
                >
                  <GBIcon name="trash" size={17} color={C.warn} />
                </TouchableOpacity>
              </View>
              {sp.ziel && (
                <View style={styles.zielRow}>
                  <GBIcon name="bolt" size={12} color={C.accent} />
                  <Text style={styles.zielText}>{sp.ziel}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <GBIcon name="users" size={44} color={C.textDim} />
            <Text style={styles.emptyTitle}>
              {q ? 'Kein Treffer' : 'Noch keine Sportler'}
            </Text>
            <Text style={styles.emptySub}>
              {q
                ? `Keine Übereinstimmung für „${q}"`
                : 'Tippe auf + um den ersten Sportler hinzuzufügen.'}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('SportlerForm', {})}
        activeOpacity={0.85}
      >
        <GBIcon name="plus" size={26} color={C.accentContrast} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar: { paddingHorizontal: SP.xl, paddingBottom: SP.md, paddingTop: SP.md },
  topSub: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.4, marginBottom: 4 },
  topTitle: { fontSize: 32, fontWeight: '700', color: C.text, letterSpacing: -0.8, lineHeight: 36 },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.md },

  statsRow: { flexDirection: 'row', gap: SP.sm },
  statTile: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, borderWidth: 1, borderColor: C.border },
  statAccent: { backgroundColor: C.accent },
  statVal: { fontFamily: FONT_MONO, fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -1 },
  statValAccent: { color: C.accentContrast },
  statLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  statLabelAccent: { color: `${C.accentContrast}99` },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: 13, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, fontSize: FONT.base },

  sectionHead: { paddingVertical: 2 },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },

  card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardStripe: { width: 3, backgroundColor: C.accent },
  cardBody: { flex: 1, padding: SP.lg, gap: SP.sm },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  cardInfo: { flex: 1, gap: 6 },
  cardName: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  cardAge: { fontFamily: FONT_MONO, fontSize: FONT.xs, color: C.textMuted, fontWeight: '600' },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },

  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,106,61,0.10)', alignItems: 'center', justifyContent: 'center' },

  zielRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zielText: { fontSize: FONT.sm, color: C.textSub, flex: 1 },

  empty: { alignItems: 'center', paddingVertical: 60, gap: SP.sm },
  emptyTitle: { fontSize: FONT.md, fontWeight: '700', color: C.textSub, marginTop: SP.sm },
  emptySub: { fontSize: FONT.sm, color: C.textDim, textAlign: 'center', lineHeight: 20, paddingHorizontal: SP.xl },

  fab: {
    position: 'absolute', bottom: 24, right: SP.xl,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
});
