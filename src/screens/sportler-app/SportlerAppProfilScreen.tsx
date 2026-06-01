import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, Pressable,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MeinProfilStackParamList } from '../../types';
import { useSettingsStore } from '../../store/settingsStore';
import { useAthletenStore } from '../../store/athletenStore';
import { usePlanStore } from '../../store/planStore';
import { useSessionLogStore } from '../../store/sessionLogStore';
import { useNachrichtenStore } from '../../store/nachrichtenStore';
import GBAvatar from '../../components/GBAvatar';
import { GBIcon } from '../../components/GBIcon';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';

const TRAINER_ID = 't1';

type Props = {
  navigation: StackNavigationProp<MeinProfilStackParamList, 'MeinProfilMain'>;
};

function ageFromIso(iso?: string | null): number | null {
  if (!iso) return null;
  const b = new Date(iso);
  const t = new Date();
  let age = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) age--;
  return age;
}

export default function SportlerAppProfilScreen({ navigation }: Props) {
  const { activeSportlerId, setActiveRole, setActiveSportlerId } = useSettingsStore();
  const { sportler: allSportler, getSportlerById } = useAthletenStore();
  const { getPlaeneForSportler } = usePlanStore();
  const { getLogsForSportler }   = useSessionLogStore();
  const { getUnreadCount }       = useNachrichtenStore();
  const insets = useSafeAreaInsets();
  const C = useColors();
  const unreadCount = getUnreadCount(activeSportlerId ?? '');

  const sportler = getSportlerById(activeSportlerId ?? '');
  const plaene   = getPlaeneForSportler(activeSportlerId ?? '');
  const logs     = getLogsForSportler(activeSportlerId ?? '');
  const done     = logs.filter((l) => l.abgeschlossen).length;
  const totalE   = plaene.reduce((s, p) => s + p.wochen.reduce((ws, w) => ws + w.einheiten.length, 0), 0);

  const avgBewertung = done > 0
    ? (logs.filter((l) => l.abgeschlossen && l.bewertung > 0).reduce((s, l) => s + l.bewertung, 0)
       / logs.filter((l) => l.abgeschlossen && l.bewertung > 0).length)
    : null;

  const [pickerVisible, setPickerVisible] = useState(false);

  return (
    <View style={[styles.root, { paddingTop: insets.top, backgroundColor: C.bg }]}>
      <View style={[styles.topBar, { borderBottomColor: C.border }]}>
        <Text style={[styles.topTitle, { color: C.text }]}>Mein Profil</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>

        {sportler ? (
          <>
            {/* Profile card */}
            <View style={[styles.profileCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              <GBAvatar name={sportler.name} initials={sportler.initials} size={80} />
              <Text style={[styles.profileName, { color: C.text }]}>{sportler.name}</Text>
              <View style={styles.profileMetaRow}>
                {ageFromIso(sportler.geburtsdatum) !== null && (
                  <View style={[styles.metaChip, { backgroundColor: C.surfaceAlt }]}>
                    <Text style={[styles.metaChipText, { color: C.textMuted }]}>{ageFromIso(sportler.geburtsdatum)} Jahre</Text>
                  </View>
                )}
                {sportler.sportart && (
                  <View style={[styles.metaChip, { backgroundColor: 'rgba(203,255,62,0.12)' }]}>
                    <Text style={[styles.metaChipText, { color: C.accent }]}>{sportler.sportart}</Text>
                  </View>
                )}
              </View>
              {sportler.ziel && (
                <Text style={[styles.profileZiel, { color: C.textSub }]}>{sportler.ziel}</Text>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.statValue, { color: C.accent }]}>{done}</Text>
                <Text style={[styles.statLabel, { color: C.textDim }]}>Absolviert</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.statValue, { color: C.text }]}>{totalE}</Text>
                <Text style={[styles.statLabel, { color: C.textDim }]}>Einheiten</Text>
              </View>
              <View style={[styles.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
                <Text style={[styles.statValue, { color: avgBewertung ? '#FFD166' : C.textDim }]}>
                  {avgBewertung ? avgBewertung.toFixed(1) + '★' : '—'}
                </Text>
                <Text style={[styles.statLabel, { color: C.textDim }]}>Ø Bewertung</Text>
              </View>
            </View>
          </>
        ) : (
          <View style={[styles.noProfileCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <GBIcon name="user" size={36} color={C.textDim} />
            <Text style={[styles.noProfileTitle, { color: C.textSub }]}>Kein Profil gewählt</Text>
            <Text style={[styles.noProfileSub, { color: C.textDim }]}>Wähle ein Sportler-Profil, um dein Training zu verfolgen.</Text>
          </View>
        )}

        <View style={[styles.sectionCard, { backgroundColor: C.surface, borderColor: C.border }]}>
          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: C.border }]}
            onPress={() => navigation.navigate('NachrichtenSportler', { chatPartnerId: TRAINER_ID, chatPartnerName: 'Trainer' })}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(122,191,255,0.12)' }]}>
              <GBIcon name="message" size={17} color="#7ABFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: C.text }]}>Nachrichten</Text>
              <Text style={[styles.actionSub, { color: C.textDim }]}>Chat mit deinem Trainer</Text>
            </View>
            {unreadCount > 0 && (
              <View style={[styles.unreadBadge, { backgroundColor: C.accent }]}>
                <Text style={[styles.unreadText, { color: C.accentContrast }]}>{unreadCount}</Text>
              </View>
            )}
            <GBIcon name="chevronRight" size={16} color={C.textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: C.border }]}
            onPress={() => setPickerVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: C.surfaceAlt }]}>
              <GBIcon name="user" size={17} color={C.textMuted} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: C.text }]}>Sportler wechseln</Text>
              <Text style={[styles.actionSub, { color: C.textDim }]}>
                {sportler ? sportler.name : 'Kein Profil ausgewählt'}
              </Text>
            </View>
            <GBIcon name="chevronRight" size={16} color={C.textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionRow, { borderBottomColor: C.border }]}
            onPress={() => navigation.navigate('Einstellungen')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(122,191,255,0.12)' }]}>
              <GBIcon name="settings" size={17} color="#7ABFFF" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: C.text }]}>Einstellungen</Text>
              <Text style={[styles.actionSub, { color: C.textDim }]}>Sprache · Erscheinungsbild</Text>
            </View>
            <GBIcon name="chevronRight" size={16} color={C.textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionRow}
            onPress={() => { setActiveRole('trainer'); setActiveSportlerId(null); }}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIcon, { backgroundColor: 'rgba(122,229,130,0.12)' }]}>
              <GBIcon name="user" size={17} color="#7AE582" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.actionTitle, { color: C.text }]}>Trainer-Ansicht</Text>
              <Text style={[styles.actionSub, { color: C.textDim }]}>Pläne und Sportler verwalten</Text>
            </View>
            <GBIcon name="chevronRight" size={16} color={C.textDim} />
          </TouchableOpacity>
        </View>

        {/* Sportler picker modal */}
        <Modal visible={pickerVisible} transparent animationType="fade" onRequestClose={() => setPickerVisible(false)}>
          <Pressable style={styles.overlay} onPress={() => setPickerVisible(false)}>
            <Pressable style={[styles.sheet, { backgroundColor: C.surface }]} onPress={() => {}}>
              <View style={[styles.handle, { backgroundColor: C.border }]} />
              <Text style={[styles.sheetTitle, { color: C.text }]}>Sportler wechseln</Text>
              {allSportler.map((sp, i) => (
                <TouchableOpacity
                  key={sp.id}
                  style={[styles.sportlerRow, { borderTopColor: C.border }, i === 0 && { borderTopWidth: 0 }]}
                  onPress={() => { setActiveSportlerId(sp.id); setPickerVisible(false); }}
                  activeOpacity={0.7}
                >
                  <GBAvatar name={sp.name} initials={sp.initials} size={38} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sportlerName, { color: C.text }]}>{sp.name}</Text>
                    {sp.sportart && <Text style={[styles.sportlerSub, { color: C.textMuted }]}>{sp.sportart}</Text>}
                  </View>
                  {sp.id === activeSportlerId && <GBIcon name="check" size={16} color={C.accent} />}
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[styles.cancelRow, { borderTopColor: C.border }]}
                onPress={() => setPickerVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelText, { color: C.textMuted }]}>Abbrechen</Text>
              </TouchableOpacity>
            </Pressable>
          </Pressable>
        </Modal>

        {/* Letzte Logs */}
        {logs.length > 0 && (
          <>
            <Text style={[styles.sectionLabel, { color: C.textMuted }]}>LETZTE AKTIVITÄT</Text>
            <View style={[styles.sectionCard, { backgroundColor: C.surface, borderColor: C.border }]}>
              {[...logs].reverse().slice(0, 5).map((log, i, arr) => (
                <View key={log.id} style={[styles.logRow, { borderBottomColor: C.border }, i === arr.length - 1 && { borderBottomWidth: 0 }]}>
                  <View style={[styles.logDot, { backgroundColor: log.abgeschlossen ? C.accent : C.textDim }]} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.logDatum, { color: C.textMuted }]}>
                      {new Date(log.datum).toLocaleDateString('de-DE')}
                    </Text>
                  </View>
                  <View style={styles.logRight}>
                    {log.bewertung > 0 && (
                      <Text style={[styles.logStar, { color: '#FFD166' }]}>{log.bewertung}★</Text>
                    )}
                    <View style={[styles.logRpe, { backgroundColor: C.surfaceAlt }]}>
                      <Text style={[styles.logRpeText, { color: C.textMuted }]}>RPE {log.rpe}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}

        <View style={{ height: 80 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: C.bg },
  topBar: { paddingHorizontal: SP.xl, paddingVertical: SP.lg, borderBottomWidth: 1 },
  topTitle: { fontSize: FONT.xl, fontWeight: '800', color: C.text, letterSpacing: -0.5 },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.lg },

  profileCard:    { alignItems: 'center', borderRadius: R.xl, borderWidth: 1, padding: SP.xl, gap: SP.md },
  profileName:    { fontSize: FONT.xl, fontWeight: '800', color: C.text, letterSpacing: -0.4, textAlign: 'center' },
  profileMetaRow: { flexDirection: 'row', gap: SP.sm, flexWrap: 'wrap', justifyContent: 'center' },
  metaChip:       { paddingHorizontal: SP.md, paddingVertical: 4, borderRadius: R.full },
  metaChipText:   { fontSize: FONT.sm, fontWeight: '600' },
  profileZiel:    { fontSize: FONT.sm, color: C.textSub, textAlign: 'center', lineHeight: 20 },

  statsRow: { flexDirection: 'row', gap: SP.sm },
  statCard: { flex: 1, alignItems: 'center', borderRadius: R.xl, borderWidth: 1, paddingVertical: SP.lg, gap: 4 },
  statValue: { fontSize: FONT.xl, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 10, fontWeight: '700', color: C.textDim, textTransform: 'uppercase', letterSpacing: 0.8 },

  unreadBadge: { minWidth: 20, height: 20, borderRadius: 10, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 5 },
  unreadText:  { fontSize: 10, fontWeight: '800' },
  noProfileCard:  { alignItems: 'center', borderRadius: R.xl, borderWidth: 1, padding: SP.xxxl, gap: SP.md },
  noProfileTitle: { fontSize: FONT.md, fontWeight: '700', color: C.textSub },
  noProfileSub:   { fontSize: FONT.sm, color: C.textDim, textAlign: 'center', lineHeight: 20 },

  sectionCard:  { borderRadius: R.xl, borderWidth: 1, overflow: 'hidden' },
  actionRow:    { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, borderBottomWidth: 1 },
  actionIcon:   { width: 40, height: 40, borderRadius: R.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  actionTitle:  { fontSize: FONT.base, fontWeight: '600', color: C.text },
  actionSub:    { fontSize: FONT.xs, color: C.textDim, marginTop: 2 },

  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: -SP.xs },

  logRow:     { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md, borderBottomWidth: 1 },
  logDot:     { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },
  logDatum:   { fontSize: FONT.sm, fontWeight: '600' },
  logRight:   { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  logStar:    { fontSize: FONT.sm, fontWeight: '700', color: '#FFD166' },
  logRpe:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: R.full },
  logRpeText: { fontFamily: FONT_MONO, fontSize: 11, fontWeight: '700' },

  overlay:     { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet:       { borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, paddingBottom: 32, overflow: 'hidden' },
  handle:      { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: SP.md, marginBottom: SP.md },
  sheetTitle:  { fontSize: FONT.lg, fontWeight: '800', color: C.text, paddingHorizontal: SP.xl, marginBottom: SP.md, letterSpacing: -0.4 },
  sportlerRow: { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderTopWidth: 1 },
  sportlerName: { fontSize: FONT.base, fontWeight: '700', color: C.text },
  sportlerSub:  { fontSize: FONT.sm, color: C.textMuted, marginTop: 2 },
  cancelRow:   { borderTopWidth: 1, paddingVertical: SP.lg, alignItems: 'center', marginTop: SP.sm },
  cancelText:  { fontSize: FONT.base, fontWeight: '600', color: C.textMuted },
});
