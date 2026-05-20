import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../../../types';
import { useRoleStore } from '../../../store/roleStore';
import { useTrainingsplanStore } from '../../../store/trainingsplanStore';
import TopBar from '../../../components/TopBar';
import GBAvatar from '../../../components/GBAvatar';
import { IconBtn, GBIcon } from '../../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../../theme';

type Props = { navigation: StackNavigationProp<TrainingsplaeneStackParamList, 'TrainerSportlerList'> };

const SPORTART_COLORS: Record<string, { bg: string; fg: string }> = {
  'Kraftsport':      { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E' },
  'Kampfsport':      { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66' },
  'Leichtathletik':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF' },
  'Konditionierung': { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF' },
  'Mobility':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF' },
  'Crossfit':        { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582' },
  'Andere':          { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted },
};

function SportartChip({ sportart }: { sportart?: string }) {
  if (!sportart) return null;
  const c = SPORTART_COLORS[sportart] ?? SPORTART_COLORS['Andere'];
  return (
    <View style={[styles.chip, { backgroundColor: c.bg }]}>
      <View style={[styles.chipDot, { backgroundColor: c.fg }]} />
      <Text style={[styles.chipText, { color: c.fg }]}>{sportart}</Text>
    </View>
  );
}

export default function TrainerSportlerListScreen({ navigation }: Props) {
  const { getSportler, deleteSportler } = useRoleStore();
  const { plaene } = useTrainingsplanStore();
  const [q, setQ] = useState('');

  const sportler = getSportler();
  const filtered = sportler.filter((s) =>
    s.name.toLowerCase().includes(q.toLowerCase()) ||
    (s.sportart ?? '').toLowerCase().includes(q.toLowerCase())
  );

  const planCountFor = (sportlerId: string) =>
    plaene.filter((p) => p.sportlerId === sportlerId).length;

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Sportler löschen',
      `${name} wirklich entfernen? Zugewiesene Pläne bleiben erhalten.`,
      [
        { text: 'Abbrechen', style: 'cancel' },
        { text: 'Löschen', style: 'destructive', onPress: () => deleteSportler(id) },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <TopBar
        large
        subtitle="Trainer · Verwaltung"
        title="Sportler"
        leading={<IconBtn name="chevronLeft" onPress={() => navigation.goBack()} />}
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statTile, styles.statTileAccent]}>
            <Text style={[styles.statVal, styles.statValAccent]}>{sportler.length}</Text>
            <Text style={[styles.statLabel, styles.statLabelAccent]}>Sportler</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statVal}>{plaene.length}</Text>
            <Text style={styles.statLabel}>Pläne</Text>
          </View>
          <View style={styles.statTile}>
            <Text style={styles.statVal}>
              {sportler.filter((s) => planCountFor(s.id) > 0).length}
            </Text>
            <Text style={styles.statLabel}>Aktiv</Text>
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
            placeholderTextColor={C.textMuted}
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

        {/* Athlete cards */}
        {filtered.map((sp) => {
          const pCount = planCountFor(sp.id);
          return (
            <TouchableOpacity
              key={sp.id}
              style={styles.card}
              activeOpacity={0.75}
              onPress={() => navigation.navigate('TrainerSportlerForm', { sportlerId: sp.id })}
            >
              <View style={styles.cardStripe} />
              <View style={styles.cardInner}>
                <View style={styles.cardTop}>
                  <GBAvatar name={sp.name} initials={sp.initials} size={48} />
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardName}>{sp.name}</Text>
                    <View style={styles.cardMeta}>
                      {sp.alter != null && (
                        <Text style={styles.cardAge}>{sp.alter} J.</Text>
                      )}
                      <SportartChip sportart={sp.sportart} />
                    </View>
                  </View>
                  <TouchableOpacity
                    onPress={() => handleDelete(sp.id, sp.name)}
                    activeOpacity={0.7}
                    style={styles.deleteBtn}
                  >
                    <GBIcon name="trash" size={18} color={C.warn} />
                  </TouchableOpacity>
                </View>

                {sp.ziel && (
                  <View style={styles.zielRow}>
                    <GBIcon name="bolt" size={13} color={C.accent} />
                    <Text style={styles.zielText}>{sp.ziel}</Text>
                    {pCount > 0 && (
                      <View style={styles.planBadge}>
                        <Text style={styles.planBadgeText}>{pCount} Plan{pCount !== 1 ? 'ständige' : ''}</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        {filtered.length === 0 && (
          <View style={styles.empty}>
            <GBIcon name="users" size={40} color={C.textDim} />
            <Text style={styles.emptyTitle}>
              {q ? 'Kein Sportler gefunden' : 'Noch keine Sportler'}
            </Text>
            <Text style={styles.emptySub}>
              {q ? `Keine Übereinstimmung für „${q}"` : 'Tippe auf + um den ersten Sportler hinzuzufügen.'}
            </Text>
          </View>
        )}

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('TrainerSportlerForm', {})}
        activeOpacity={0.85}
      >
        <GBIcon name="plus" size={26} color={C.accentContrast} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: SP.xl, paddingTop: SP.sm, gap: SP.md },

  statsRow: { flexDirection: 'row', gap: SP.sm },
  statTile: { flex: 1, backgroundColor: C.surface, borderRadius: R.lg, padding: SP.md, borderWidth: 1, borderColor: C.border },
  statTileAccent: { backgroundColor: C.accent },
  statVal: { fontFamily: FONT_MONO, fontSize: 28, fontWeight: '700', color: C.text, letterSpacing: -1 },
  statValAccent: { color: C.accentContrast },
  statLabel: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.6, marginTop: 4 },
  statLabelAccent: { color: `${C.accentContrast}99` },

  searchBox: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, backgroundColor: C.surface, borderRadius: R.md, paddingHorizontal: SP.md, paddingVertical: SP.sm + 2, borderWidth: 1, borderColor: C.border },
  searchInput: { flex: 1, color: C.text, fontSize: FONT.base },

  sectionHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, letterSpacing: 1.6, textTransform: 'uppercase' },

  card: { flexDirection: 'row', backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, overflow: 'hidden' },
  cardStripe: { width: 3, backgroundColor: C.accent },
  cardInner: { flex: 1, padding: SP.lg, gap: SP.sm },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: SP.md },
  cardInfo: { flex: 1, gap: 6 },
  cardName: { fontSize: 17, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  cardAge: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '600', fontFamily: FONT_MONO },

  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: SP.sm, paddingVertical: 3, borderRadius: R.full },
  chipDot: { width: 5, height: 5, borderRadius: 3 },
  chipText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.4, textTransform: 'uppercase' },

  deleteBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,106,61,0.1)', alignItems: 'center', justifyContent: 'center' },

  zielRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zielText: { flex: 1, fontSize: FONT.sm, color: C.textSub },
  planBadge: { backgroundColor: C.accentLight, paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.full },
  planBadgeText: { fontSize: 10, fontWeight: '700', color: C.accent, letterSpacing: 0.3 },

  empty: { alignItems: 'center', paddingVertical: 56, gap: SP.sm },
  emptyTitle: { fontSize: FONT.base, fontWeight: '700', color: C.textSub, marginTop: SP.sm },
  emptySub: { fontSize: FONT.sm, color: C.textDim, textAlign: 'center', lineHeight: 20, paddingHorizontal: SP.xl },

  fab: {
    position: 'absolute', bottom: 100, right: SP.xl,
    width: 58, height: 58, borderRadius: 29,
    backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center',
    shadowColor: C.accent, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 18, elevation: 10,
  },
});
