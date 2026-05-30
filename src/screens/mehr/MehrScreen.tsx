import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MehrStackParamList } from '../../types';
import { C, useColors, SP, R, FONT } from '../../theme';
import { GBIcon } from '../../components/GBIcon';
import { useUebungStore } from '../../store/uebungStore';
import { useEinheitStore } from '../../store/einheitStore';
import { useAthletenStore } from '../../store/athletenStore';
import { useSettingsStore } from '../../store/settingsStore';
import GBAvatar from '../../components/GBAvatar';

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
  const [pickerVisible, setPickerVisible] = useState(false);

  const handleSelect = (sportlerId: string) => {
    setPickerVisible(false);
    setActiveSportlerId(sportlerId);
    setActiveRole('sportler');
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
          onPress={() => setPickerVisible(true)}
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

      {/* Sportler picker modal */}
      <Modal
        visible={pickerVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setPickerVisible(false)}
      >
        <Pressable style={s.modalOverlay} onPress={() => setPickerVisible(false)}>
          <Pressable style={[s.modalSheet, { backgroundColor: C.surface }]} onPress={() => {}}>
            <View style={[s.modalHandle, { backgroundColor: C.border }]} />
            <Text style={[s.modalTitle, { color: C.text }]}>Als Sportler anmelden</Text>
            <Text style={[s.modalSub, { color: C.textMuted }]}>Für wen möchtest du trainieren?</Text>

            {sportler.length === 0 ? (
              <View style={s.emptyPicker}>
                <GBIcon name="user" size={28} color={C.textDim} />
                <Text style={[s.emptyPickerText, { color: C.textDim }]}>
                  Noch keine Sportler angelegt
                </Text>
              </View>
            ) : (
              sportler.map((sp, i) => (
                <TouchableOpacity
                  key={sp.id}
                  style={[
                    s.sportlerRow,
                    { borderTopColor: C.border },
                    i === 0 && { borderTopWidth: 0 },
                  ]}
                  onPress={() => handleSelect(sp.id)}
                  activeOpacity={0.7}
                >
                  <GBAvatar name={sp.name} initials={sp.initials} size={40} />
                  <View style={{ flex: 1 }}>
                    <Text style={[s.sportlerName, { color: C.text }]}>{sp.name}</Text>
                    {sp.sportart && (
                      <Text style={[s.sportlerSub, { color: C.textMuted }]}>{sp.sportart}</Text>
                    )}
                  </View>
                  <GBIcon name="chevronRight" size={16} color={C.accent} />
                </TouchableOpacity>
              ))
            )}

            <TouchableOpacity
              style={[s.cancelBtn, { borderTopColor: C.border }]}
              onPress={() => setPickerVisible(false)}
              activeOpacity={0.7}
            >
              <Text style={[s.cancelBtnText, { color: C.textMuted }]}>Abbrechen</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
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

  // Picker modal
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalSheet:   { borderTopLeftRadius: R.xxl, borderTopRightRadius: R.xxl, paddingBottom: 32, overflow: 'hidden' },
  modalHandle:  { width: 36, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: SP.md, marginBottom: SP.md },
  modalTitle:   { fontSize: FONT.lg, fontWeight: '800', color: C.text, paddingHorizontal: SP.xl, letterSpacing: -0.4 },
  modalSub:     { fontSize: FONT.sm, color: C.textMuted, paddingHorizontal: SP.xl, marginTop: 4, marginBottom: SP.md },

  sportlerRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderTopWidth: 1 },
  sportlerName: { fontSize: FONT.base, fontWeight: '700', color: C.text },
  sportlerSub:  { fontSize: FONT.sm, color: C.textMuted, marginTop: 2 },

  emptyPicker:     { alignItems: 'center', gap: SP.sm, paddingVertical: SP.xl, paddingHorizontal: SP.xl },
  emptyPickerText: { fontSize: FONT.sm, color: C.textDim, textAlign: 'center' },

  cancelBtn:     { borderTopWidth: 1, paddingVertical: SP.lg, alignItems: 'center', marginTop: SP.sm },
  cancelBtnText: { fontSize: FONT.base, fontWeight: '600', color: C.textMuted },
});
