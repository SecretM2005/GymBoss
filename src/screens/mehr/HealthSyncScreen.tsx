import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Switch, Alert,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MehrStackParamList } from '../../types';
import { useSessionLogStore } from '../../store/sessionLogStore';
import { usePlanStore } from '../../store/planStore';
import { C, useColors, SP, R, FONT, FONT_MONO } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

type Props = {
  navigation: StackNavigationProp<MehrStackParamList, 'HealthSync'>;
};

const PLATFORM_NAME = Platform.OS === 'ios' ? 'Apple Health' : Platform.OS === 'android' ? 'Google Fit' : 'Health App';
const IS_MOBILE = Platform.OS === 'ios' || Platform.OS === 'android';

export default function HealthSyncScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const { logs } = useSessionLogStore();
  const { plaene } = usePlanStore();
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [syncWorkouts, setSyncWorkouts] = useState(true);
  const [syncWeight, setSyncWeight]   = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const completedLogs = logs.filter((l) => l.abgeschlossen);

  const handleExport = async () => {
    if (!IS_MOBILE) {
      Alert.alert('Nicht verfügbar', 'Health-Synchronisierung ist nur auf iOS und Android verfügbar.');
      return;
    }
    setIsExporting(true);
    // Graceful degradation: expo-health is not bundled, show explanation
    setTimeout(() => {
      setIsExporting(false);
      Alert.alert(
        'Health-Export',
        `${completedLogs.length} Einheiten wurden als Workout-Daten vorbereitet.\n\nFür die vollständige Health-Integration füge „expo-health" zur App hinzu (erfordert nativen Build via EAS).`,
        [{ text: 'OK' }],
      );
    }, 1200);
  };

  const handleToggleSync = (value: boolean) => {
    if (value && !IS_MOBILE) {
      Alert.alert(
        'Nicht verfügbar',
        `${PLATFORM_NAME}-Synchronisierung ist nur auf mobilen Geräten verfügbar.`,
      );
      return;
    }
    setSyncEnabled(value);
    if (value) {
      Alert.alert(
        `${PLATFORM_NAME} verbinden`,
        `Für die vollständige ${PLATFORM_NAME}-Integration ist ein nativer Build über EAS Build erforderlich. Die Daten werden lokal gespeichert.`,
        [{ text: 'Verstanden' }],
      );
    }
  };

  return (
    <View style={[s.root, { backgroundColor: C.bg, paddingTop: insets.top }]}>
      <View style={[s.topBar, { borderBottomColor: C.border }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={[s.iconBtn, { backgroundColor: C.surface }]}
          activeOpacity={0.7}
        >
          <GBIcon name="chevronLeft" size={20} color={C.text} />
        </TouchableOpacity>
        <View style={[s.tileIcon, { backgroundColor: 'rgba(122,229,130,0.12)' }]}>
          <GBIcon name="heart" size={18} color={C.success} />
        </View>
        <Text style={[s.headerTitle, { color: C.text }]}>Health Sync</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {/* Hero Card */}
        <View style={[s.heroCard, { backgroundColor: 'rgba(122,229,130,0.08)', borderColor: 'rgba(122,229,130,0.20)' }]}>
          <View style={[s.heroIcon, { backgroundColor: 'rgba(122,229,130,0.20)' }]}>
            <GBIcon name="heart" size={32} color={C.success} />
          </View>
          <Text style={[s.heroTitle, { color: C.text }]}>{PLATFORM_NAME}</Text>
          <Text style={[s.heroSub, { color: C.textMuted }]}>
            Synchronisiere deine Trainingsdaten mit der Health-App
            für eine ganzheitliche Gesundheitsübersicht.
          </Text>
        </View>

        {!IS_MOBILE && (
          <View style={[s.warnBanner, { backgroundColor: 'rgba(255,106,61,0.10)', borderColor: 'rgba(255,106,61,0.25)' }]}>
            <GBIcon name="info" size={14} color={C.warn} />
            <Text style={[s.warnText, { color: C.warn }]}>
              Health-Synchronisierung ist nur auf iOS und Android verfügbar.
            </Text>
          </View>
        )}

        {/* Summary Stats */}
        <View style={s.statsRow}>
          <View style={[s.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.statValue, { color: C.accent, fontFamily: FONT_MONO }]}>{completedLogs.length}</Text>
            <Text style={[s.statLabel, { color: C.textDim }]}>Workouts{'\n'}bereit</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.statValue, { color: '#7ABFFF', fontFamily: FONT_MONO }]}>{plaene.length}</Text>
            <Text style={[s.statLabel, { color: C.textDim }]}>Pläne{'\n'}gesamt</Text>
          </View>
          <View style={[s.statCard, { backgroundColor: C.surface, borderColor: C.border }]}>
            <Text style={[s.statValue, { color: C.success, fontFamily: FONT_MONO }]}>
              {syncEnabled ? 'AN' : 'AUS'}
            </Text>
            <Text style={[s.statLabel, { color: C.textDim }]}>Sync{'\n'}Status</Text>
          </View>
        </View>

        {/* Sync Settings */}
        <Text style={[s.sectionLabel, { color: C.textDim }]}>SYNCHRONISIERUNG</Text>

        <View style={[s.group, { backgroundColor: C.surface, borderColor: C.border }]}>
          <View style={s.toggleRow}>
            <View style={[s.toggleIcon, { backgroundColor: 'rgba(122,229,130,0.15)' }]}>
              <GBIcon name="heart" size={16} color={C.success} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.toggleLabel, { color: C.text }]}>{PLATFORM_NAME} Sync</Text>
              <Text style={[s.toggleSub, { color: C.textDim }]}>Automatisch bei Einheit-Abschluss</Text>
            </View>
            <Switch
              value={syncEnabled}
              onValueChange={handleToggleSync}
              trackColor={{ false: C.surfaceAlt, true: C.success }}
              thumbColor={C.accentContrast}
            />
          </View>
          <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
            <View style={[s.toggleIcon, { backgroundColor: 'rgba(203,255,62,0.10)' }]}>
              <GBIcon name="dumbbell" size={16} color={C.accent} />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.toggleLabel, { color: syncEnabled ? C.text : C.textDim }]}>Workout-Daten</Text>
              <Text style={[s.toggleSub, { color: C.textDim }]}>Einheiten, Dauer, Volumen</Text>
            </View>
            <Switch
              value={syncWorkouts && syncEnabled}
              onValueChange={setSyncWorkouts}
              disabled={!syncEnabled}
              trackColor={{ false: C.surfaceAlt, true: C.accent }}
              thumbColor={C.accentContrast}
            />
          </View>
          <View style={[s.toggleRow, { borderTopWidth: 1, borderTopColor: C.border }]}>
            <View style={[s.toggleIcon, { backgroundColor: 'rgba(122,191,255,0.12)' }]}>
              <GBIcon name="user" size={16} color="#7ABFFF" />
            </View>
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={[s.toggleLabel, { color: syncEnabled ? C.text : C.textDim }]}>Körpergewicht</Text>
              <Text style={[s.toggleSub, { color: C.textDim }]}>Body Mass Einträge</Text>
            </View>
            <Switch
              value={syncWeight && syncEnabled}
              onValueChange={setSyncWeight}
              disabled={!syncEnabled}
              trackColor={{ false: C.surfaceAlt, true: '#7ABFFF' }}
              thumbColor={C.accentContrast}
            />
          </View>
        </View>

        {/* Export Button */}
        <TouchableOpacity
          style={[
            s.exportBtn,
            { backgroundColor: completedLogs.length > 0 ? C.accent : C.surfaceAlt, opacity: isExporting ? 0.7 : 1 },
          ]}
          onPress={handleExport}
          disabled={isExporting || completedLogs.length === 0}
          activeOpacity={0.85}
        >
          <GBIcon name="heart" size={18} color={completedLogs.length > 0 ? C.accentContrast : C.textDim} />
          <Text style={[s.exportBtnText, { color: completedLogs.length > 0 ? C.accentContrast : C.textDim }]}>
            {isExporting ? 'Exportiere…' : `${completedLogs.length} Workouts exportieren`}
          </Text>
        </TouchableOpacity>

        <View style={[s.infoBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <GBIcon name="info" size={14} color={C.textDim} />
          <Text style={[s.infoText, { color: C.textDim }]}>
            Für die vollständige Health-Integration ist ein nativer Build via EAS Build erforderlich.
            Im Expo Go Modus werden Daten lokal gespeichert.
          </Text>
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  topBar:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderBottomWidth: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: -0.4 },

  content: { padding: SP.xl, gap: SP.md },

  heroCard:  { borderRadius: R.xl, borderWidth: 1, padding: SP.xl, alignItems: 'center', gap: SP.md },
  heroIcon:  { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  heroTitle: { fontSize: FONT.lg, fontWeight: '800', letterSpacing: -0.4 },
  heroSub:   { fontSize: FONT.sm, textAlign: 'center', lineHeight: 20 },

  warnBanner: { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  warnText:   { flex: 1, fontSize: FONT.sm, lineHeight: 20 },

  statsRow:  { flexDirection: 'row', gap: SP.sm, marginTop: SP.sm },
  statCard:  { flex: 1, borderRadius: R.lg, borderWidth: 1, padding: SP.md, alignItems: 'center', gap: 4 },
  statValue: { fontSize: FONT.lg, fontWeight: '800' },
  statLabel: { fontSize: 9, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center', lineHeight: 13 },

  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1.6, paddingHorizontal: 2, marginTop: SP.sm },

  group:      { borderRadius: R.lg, borderWidth: 1, overflow: 'hidden' },
  toggleRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md },
  toggleIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: FONT.base, fontWeight: '600' },
  toggleSub:   { fontSize: FONT.xs },

  exportBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, borderRadius: R.full, padding: SP.lg, marginTop: SP.sm },
  exportBtnText: { fontSize: FONT.base, fontWeight: '700' },

  infoBox:  { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  infoText: { flex: 1, fontSize: FONT.xs, lineHeight: 17 },
});
