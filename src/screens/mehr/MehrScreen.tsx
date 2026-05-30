import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MehrStackParamList } from '../../types';
import { C, useColors, SP, R, FONT } from '../../theme';
import { GBIcon } from '../../components/GBIcon';
import { useUebungStore } from '../../store/uebungStore';
import { useEinheitStore } from '../../store/einheitStore';
import { useAthletenStore } from '../../store/athletenStore';
import { useSettingsStore } from '../../store/settingsStore';

type Props = {
  navigation: StackNavigationProp<MehrStackParamList, 'MehrHub'>;
};

export default function MehrHubScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { uebungen } = useUebungStore();
  const { einheiten } = useEinheitStore();
  const { sportler } = useAthletenStore();
  const { setActiveRole, setActiveSportlerId } = useSettingsStore();

  const handleSportlerModus = () => {
    if (sportler.length === 0) {
      Alert.alert('Keine Sportler', 'Lege zuerst Sportler-Profile an, um in die Sportler-Ansicht zu wechseln.');
      return;
    }
    Alert.alert(
      'Als Sportler anmelden',
      'Für wen möchtest du die Trainings-App nutzen?',
      [
        ...sportler.map((s) => ({
          text: s.name,
          onPress: () => { setActiveSportlerId(s.id); setActiveRole('sportler'); },
        })),
        { text: 'Abbrechen', style: 'cancel' as const },
      ],
    );
  };

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <View style={[s.header, { borderBottomColor: C.border }]}>
        <Text style={[s.headerTitle, { color: C.text }]}>Mehr</Text>
      </View>

      <View style={s.content}>

        <TouchableOpacity
          style={[s.tile, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => navigation.navigate('Einstellungen')}
          activeOpacity={0.75}
        >
          <View style={[s.tileIcon, { backgroundColor: 'rgba(122,191,255,0.12)' }]}>
            <GBIcon name="settings" size={24} color="#7ABFFF" />
          </View>
          <View style={s.tileInfo}>
            <Text style={[s.tileTitle, { color: C.text }]}>Einstellungen</Text>
            <Text style={[s.tileSub, { color: C.textMuted }]}>Sprache · Erscheinungsbild · Coaching-Ansicht</Text>
          </View>
          <GBIcon name="chevronRight" size={16} color={C.textDim} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tile, { backgroundColor: C.surface, borderColor: C.border }]}
          onPress={() => navigation.navigate('Uebungsbibliothek')}
          activeOpacity={0.75}
        >
          <View style={[s.tileIcon, { backgroundColor: 'rgba(203,255,62,0.10)' }]}>
            <GBIcon name="book" size={24} color={C.accent} />
          </View>
          <View style={s.tileInfo}>
            <Text style={[s.tileTitle, { color: C.text }]}>Übungsbibliothek</Text>
            <Text style={[s.tileSub, { color: C.textMuted }]}>
              {einheiten.length} {einheiten.length === 1 ? 'Einheit' : 'Einheiten'} · {uebungen.length} {uebungen.length === 1 ? 'Übung' : 'Übungen'}
            </Text>
          </View>
          <GBIcon name="chevronRight" size={16} color={C.textDim} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[s.tile, { backgroundColor: 'rgba(122,229,130,0.08)', borderColor: 'rgba(122,229,130,0.20)' }]}
          onPress={handleSportlerModus}
          activeOpacity={0.75}
        >
          <View style={[s.tileIcon, { backgroundColor: 'rgba(122,229,130,0.15)' }]}>
            <GBIcon name="user" size={24} color="#7AE582" />
          </View>
          <View style={s.tileInfo}>
            <Text style={[s.tileTitle, { color: C.text }]}>Als Sportler anmelden</Text>
            <Text style={[s.tileSub, { color: C.textMuted }]}>
              Athleten-Ansicht · Training absolvieren
            </Text>
          </View>
          <GBIcon name="chevronRight" size={16} color={C.textDim} />
        </TouchableOpacity>

      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  header:  { paddingHorizontal: SP.xl, paddingVertical: SP.lg, borderBottomWidth: 1 },
  headerTitle: { fontSize: FONT.xl, fontWeight: '700', letterSpacing: -0.5, color: C.text },

  content: { padding: SP.xl, gap: SP.md },

  tile:     { flexDirection: 'row', alignItems: 'center', gap: SP.md, borderRadius: R.xl, borderWidth: 1, padding: SP.lg },
  tileIcon: { width: 52, height: 52, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center' },
  tileInfo: { flex: 1, gap: 3 },
  tileTitle: { fontSize: FONT.md, fontWeight: '700', color: C.text },
  tileSub:   { fontSize: FONT.sm, color: C.textMuted, lineHeight: 18 },
});
