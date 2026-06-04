import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Switch } from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, useColors, SP, R, FONT } from '../../theme';
import { GBIcon } from '../../components/GBIcon';
import { requestNotificationPermission, scheduleInstantNotification } from '../../services/notificationService';

type Props = {
  navigation: StackNavigationProp<any>;
};

export default function BenachrichtigungenScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const C = useColors();
  const [granted, setGranted]           = useState(false);
  const [trainingErinnerung, setTrainingErinnerung] = useState(true);
  const [neuerPlan, setNeuerPlan]       = useState(true);
  const [zielErreicht, setZielErreicht] = useState(true);
  const [nachrichtenAlert, setNachrichtenAlert] = useState(true);
  const isWeb = Platform.OS === 'web';

  useEffect(() => {
    if (!isWeb) {
      import('expo-notifications').then((Notifications) => {
        Notifications.getPermissionsAsync().then(({ status }) => setGranted(status === 'granted'));
      });
    }
  }, []);

  const handleRequestPermission = async () => {
    const ok = await requestNotificationPermission();
    setGranted(ok);
    if (ok) {
      await scheduleInstantNotification(
        '✅ Benachrichtigungen aktiviert',
        'Du wirst ab jetzt über Trainings und Nachrichten informiert.',
      );
    }
  };

  const handleTestNotification = async () => {
    await scheduleInstantNotification(
      '💪 Trainings-Erinnerung',
      'Deine nächste Einheit startet in 1 Stunde. Viel Erfolg!',
    );
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
        <View style={[s.tileIcon, { backgroundColor: 'rgba(255,209,102,0.12)' }]}>
          <GBIcon name="bell" size={18} color="#FFD166" />
        </View>
        <Text style={[s.headerTitle, { color: C.text }]}>Benachrichtigungen</Text>
      </View>

      <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>

        {isWeb && (
          <View style={[s.infoBanner, { backgroundColor: 'rgba(255,106,61,0.10)', borderColor: 'rgba(255,106,61,0.25)' }]}>
            <GBIcon name="info" size={14} color={C.warn} />
            <Text style={[s.infoText, { color: C.warn }]}>
              Push-Benachrichtigungen sind nur in der nativen App (iOS/Android) verfügbar, nicht im Browser.
            </Text>
          </View>
        )}

        {!isWeb && !granted && (
          <TouchableOpacity
            style={[s.permissionCard, { backgroundColor: 'rgba(203,255,62,0.08)', borderColor: 'rgba(203,255,62,0.25)' }]}
            onPress={handleRequestPermission}
            activeOpacity={0.8}
          >
            <GBIcon name="bell" size={24} color={C.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[s.permTitle, { color: C.accent }]}>Berechtigung erforderlich</Text>
              <Text style={[s.permSub, { color: C.textMuted }]}>
                Tippe hier, um Push-Benachrichtigungen zu aktivieren.
              </Text>
            </View>
            <GBIcon name="chevronRight" size={16} color={C.accent} />
          </TouchableOpacity>
        )}

        {!isWeb && granted && (
          <View style={[s.grantedBadge, { backgroundColor: 'rgba(122,229,130,0.10)', borderColor: 'rgba(122,229,130,0.25)' }]}>
            <GBIcon name="check" size={14} color={C.success} />
            <Text style={[s.grantedText, { color: C.success }]}>Berechtigung erteilt</Text>
          </View>
        )}

        <Text style={[s.sectionLabel, { color: C.textDim }]}>BENACHRICHTIGUNGSTYPEN</Text>

        <View style={[s.group, { backgroundColor: C.surface, borderColor: C.border }]}>
          <ToggleRow
            label="Training-Erinnerungen"
            sub="1 Stunde vor geplanten Einheiten"
            icon="dumbbell"
            iconColor="#CBFF3E"
            value={trainingErinnerung}
            onToggle={setTrainingErinnerung}
            disabled={isWeb || !granted}
            C={C}
          />
          <ToggleRow
            label="Neue Pläne"
            sub="Wenn dein Trainer einen neuen Plan erstellt"
            icon="layers"
            iconColor="#7ABFFF"
            value={neuerPlan}
            onToggle={setNeuerPlan}
            disabled={isWeb || !granted}
            C={C}
            noBorder
          />
        </View>

        <View style={[s.group, { backgroundColor: C.surface, borderColor: C.border }]}>
          <ToggleRow
            label="Ziel erreicht"
            sub="Wenn du dein Wochenziel erfüllst"
            icon="check"
            iconColor="#7AE582"
            value={zielErreicht}
            onToggle={setZielErreicht}
            disabled={isWeb || !granted}
            C={C}
          />
          <ToggleRow
            label="Nachrichten"
            sub="Bei neuen Trainer-Nachrichten"
            icon="message"
            iconColor="#D7B5FF"
            value={nachrichtenAlert}
            onToggle={setNachrichtenAlert}
            disabled={isWeb || !granted}
            C={C}
            noBorder
          />
        </View>

        {!isWeb && granted && (
          <TouchableOpacity
            style={[s.testBtn, { backgroundColor: C.surface, borderColor: C.border }]}
            onPress={handleTestNotification}
            activeOpacity={0.8}
          >
            <GBIcon name="bell" size={16} color={C.textMuted} />
            <Text style={[s.testBtnText, { color: C.textMuted }]}>Test-Benachrichtigung senden</Text>
          </TouchableOpacity>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

function ToggleRow({
  label, sub, icon, iconColor, value, onToggle, disabled, C, noBorder,
}: {
  label: string; sub: string; icon: string; iconColor: string;
  value: boolean; onToggle: (v: boolean) => void;
  disabled: boolean; C: ReturnType<typeof useColors>; noBorder?: boolean;
}) {
  return (
    <View style={[s.toggleRow, !noBorder && { borderBottomWidth: 1, borderBottomColor: C.border }]}>
      <View style={[s.toggleIcon, { backgroundColor: `${iconColor}18` }]}>
        <GBIcon name={icon as any} size={16} color={iconColor} />
      </View>
      <View style={{ flex: 1, gap: 2 }}>
        <Text style={[s.toggleLabel, { color: disabled ? C.textDim : C.text }]}>{label}</Text>
        <Text style={[s.toggleSub, { color: C.textDim }]}>{sub}</Text>
      </View>
      <Switch
        value={value && !disabled}
        onValueChange={onToggle}
        disabled={disabled}
        trackColor={{ false: C.surfaceAlt, true: C.accent }}
        thumbColor={C.accentContrast}
      />
    </View>
  );
}

const s = StyleSheet.create({
  root:    { flex: 1 },
  topBar:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, paddingHorizontal: SP.xl, paddingVertical: SP.md, borderBottomWidth: 1 },
  iconBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  tileIcon: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FONT.lg, fontWeight: '700', letterSpacing: -0.4 },

  content:  { padding: SP.xl, gap: SP.md },

  infoBanner:   { flexDirection: 'row', alignItems: 'flex-start', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  infoText:     { flex: 1, fontSize: FONT.sm, lineHeight: 20 },

  permissionCard: { flexDirection: 'row', alignItems: 'center', gap: SP.md, borderRadius: R.xl, borderWidth: 1, padding: SP.lg },
  permTitle:  { fontSize: FONT.base, fontWeight: '700' },
  permSub:    { fontSize: FONT.sm, lineHeight: 18, marginTop: 2 },

  grantedBadge: { flexDirection: 'row', alignItems: 'center', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.md },
  grantedText:  { fontSize: FONT.sm, fontWeight: '700' },

  sectionLabel: { fontSize: FONT.xs, fontWeight: '700', letterSpacing: 1.6, paddingHorizontal: 2, marginTop: SP.sm },

  group:      { borderRadius: R.lg, borderWidth: 1, overflow: 'hidden' },
  toggleRow:  { flexDirection: 'row', alignItems: 'center', gap: SP.md, padding: SP.md },
  toggleIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  toggleLabel: { fontSize: FONT.base, fontWeight: '600' },
  toggleSub:   { fontSize: FONT.xs },

  testBtn:     { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SP.sm, borderRadius: R.lg, borderWidth: 1, padding: SP.lg, marginTop: SP.sm },
  testBtnText: { fontSize: FONT.base, fontWeight: '600' },
});
