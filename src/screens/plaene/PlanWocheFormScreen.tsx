import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, KeyboardAvoidingView, Platform,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PlaeneStackParamList } from '../../types';
import { usePlanStore } from '../../store/planStore';
import { GBIcon } from '../../components/GBIcon';
import { C, SP, R, FONT, FONT_MONO } from '../../theme';

type Props = {
  navigation: StackNavigationProp<PlaeneStackParamList, 'PlanWocheForm'>;
  route: RouteProp<PlaeneStackParamList, 'PlanWocheForm'>;
};

export default function PlanWocheFormScreen({ navigation, route }: Props) {
  const { getPlanById, addWoche, updateWoche } = usePlanStore();
  const insets = useSafeAreaInsets();

  const { planId, wocheId } = route.params;
  const plan = getPlanById(planId);
  const existingWoche = wocheId ? plan?.wochen.find((w) => w.id === wocheId) : undefined;
  const isEdit = !!existingWoche;

  const wochennummer = existingWoche?.wochennummer ?? (plan?.wochen.length ?? 0) + 1;
  const [notizen, setNotizen] = useState(existingWoche?.notizen ?? '');

  const handleSave = () => {
    if (isEdit && existingWoche) {
      updateWoche(planId, existingWoche.id, notizen);
    } else {
      addWoche(planId, notizen);
    }
    navigation.goBack();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
            <GBIcon name="chevronLeft" size={22} color={C.text} />
          </TouchableOpacity>
          <View style={styles.topCenter}>
            <Text style={styles.topSub}>{isEdit ? 'Bearbeiten' : 'Neue Woche'}</Text>
            <Text style={styles.topTitle}>Woche {wochennummer}</Text>
          </View>
          <TouchableOpacity onPress={handleSave} style={styles.saveBtn} activeOpacity={0.8}>
            <Text style={styles.saveBtnText}>Speichern</Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Week Number Display */}
          <View style={styles.wocheDisplay}>
            <View style={styles.wocheNumberBadge}>
              <Text style={styles.wocheNumberText}>{wochennummer}</Text>
            </View>
            <View>
              <Text style={styles.wocheLabel}>Woche {wochennummer}</Text>
              <Text style={styles.wocheSub}>
                {plan?.name ?? '—'}
              </Text>
            </View>
          </View>

          {/* Notes */}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Notizen <Text style={styles.optional}>(optional)</Text></Text>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={notizen}
              onChangeText={setNotizen}
              placeholder="z. B. Fokus auf Technik, Volumen anpassen…"
              placeholderTextColor={C.textDim}
              autoCapitalize="sentences"
              multiline
              numberOfLines={4}
              autoFocus={!isEdit}
            />
          </View>

          {/* Info box */}
          <View style={styles.infoBox}>
            <GBIcon name="bolt" size={14} color={C.accent} />
            <Text style={styles.infoText}>
              Einheiten können später in der Wochenübersicht hinzugefügt werden.
            </Text>
          </View>

          <View style={{ height: 60 }} />
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },

  topBar:      { flexDirection: 'row', alignItems: 'center', paddingHorizontal: SP.xl, paddingBottom: SP.md, paddingTop: SP.sm, gap: SP.md },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center' },
  topCenter:   { flex: 1 },
  topSub:      { fontSize: 11, color: C.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  topTitle:    { fontSize: 20, fontWeight: '700', color: C.text, letterSpacing: -0.4 },
  saveBtn:     { backgroundColor: C.accent, paddingHorizontal: SP.md, paddingVertical: SP.sm - 1, borderRadius: R.full },
  saveBtnText: { fontSize: FONT.sm, fontWeight: '700', color: C.accentContrast },

  content: { paddingHorizontal: SP.xl, paddingTop: SP.lg, gap: SP.xl },

  wocheDisplay:     { flexDirection: 'row', alignItems: 'center', gap: SP.lg, backgroundColor: C.surface, borderRadius: R.xl, borderWidth: 1, borderColor: C.border, padding: SP.lg },
  wocheNumberBadge: { width: 56, height: 56, borderRadius: R.lg, backgroundColor: C.accent, alignItems: 'center', justifyContent: 'center' },
  wocheNumberText:  { fontFamily: FONT_MONO, fontSize: 28, fontWeight: '800', color: C.accentContrast, letterSpacing: -1 },
  wocheLabel:       { fontSize: FONT.md, fontWeight: '700', color: C.text, letterSpacing: -0.3 },
  wocheSub:         { fontSize: FONT.sm, color: C.textMuted, marginTop: 3 },

  fieldGroup: { gap: SP.xs + 2 },
  fieldLabel: { fontSize: FONT.xs, fontWeight: '700', color: C.textMuted, textTransform: 'uppercase', letterSpacing: 1.4 },
  optional:   { color: C.textDim, fontWeight: '500', textTransform: 'none' },

  input:      { backgroundColor: C.surface, borderWidth: 1, borderColor: C.border, borderRadius: R.md, paddingHorizontal: SP.lg, paddingVertical: SP.md, fontSize: FONT.base, color: C.text },
  inputMulti: { minHeight: 100, textAlignVertical: 'top' },

  infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, backgroundColor: 'rgba(203,255,62,0.06)', borderRadius: R.lg, borderWidth: 1, borderColor: 'rgba(203,255,62,0.15)', padding: SP.md },
  infoText: { flex: 1, fontSize: FONT.sm, color: C.textSub, lineHeight: 20 },
});
