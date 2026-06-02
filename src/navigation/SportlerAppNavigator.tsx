import React from 'react';
import { View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {
  SportlerAppTabParamList,
  MeinTrainingStackParamList,
  MeinProfilStackParamList,
} from '../types';
import { useColors } from '../theme';
import { useNachrichtenStore } from '../store/nachrichtenStore';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useAthletenStore } from '../store/athletenStore';

import SportlerAppPlanScreen      from '../screens/sportler-app/SportlerAppPlanScreen';
import SportlerFortschrittScreen  from '../screens/sportler-app/SportlerFortschrittScreen';
import SportlerNachrichtenScreen  from '../screens/sportler-app/SportlerNachrichtenScreen';
import SportlerAppEinheitLogScreen from '../screens/sportler-app/SportlerAppEinheitLogScreen';
import SportlerAppProfilScreen     from '../screens/sportler-app/SportlerAppProfilScreen';
import PlanFormScreen              from '../screens/plaene/PlanFormScreen';
import PlanWocheFormScreen         from '../screens/plaene/PlanWocheFormScreen';
import PlanWocheDetailScreen       from '../screens/plaene/PlanWocheDetailScreen';
import EinheitDetailScreen         from '../screens/plaene/EinheitDetailScreen';
import EinstellungenScreen         from '../screens/mehr/EinstellungenScreen';
import ImportPlanScreen            from '../screens/plaene/ImportPlanScreen';
import HealthSyncScreen            from '../screens/mehr/HealthSyncScreen';
import BenachrichtigungenScreen    from '../screens/mehr/BenachrichtigungenScreen';

const Tab           = createBottomTabNavigator<SportlerAppTabParamList>();
const TrainingStack = createStackNavigator<MeinTrainingStackParamList>();
const ProfilStack   = createStackNavigator<MeinProfilStackParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function MeinTrainingNavigator() {
  return (
    <TrainingStack.Navigator screenOptions={{ headerShown: false }}>
      <TrainingStack.Screen name="MeinTrainingMain"  component={SportlerAppPlanScreen} />
      <TrainingStack.Screen name="EinheitLog"        component={SportlerAppEinheitLogScreen} />
      <TrainingStack.Screen name="ImportPlan"        component={ImportPlanScreen as any} />
      <TrainingStack.Screen name="PlanForm"          component={PlanFormScreen as any} />
      <TrainingStack.Screen name="PlanWocheForm"     component={PlanWocheFormScreen as any} />
      <TrainingStack.Screen name="PlanWocheDetail"   component={PlanWocheDetailScreen as any} />
      <TrainingStack.Screen name="EinheitDetail"     component={EinheitDetailScreen as any} />
    </TrainingStack.Navigator>
  );
}

function MeinProfilNavigator() {
  return (
    <ProfilStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfilStack.Screen name="MeinProfilMain"    component={SportlerAppProfilScreen} />
      <ProfilStack.Screen name="Einstellungen"     component={EinstellungenScreen as any} />
      <ProfilStack.Screen name="HealthSync"        component={HealthSyncScreen as any} />
      <ProfilStack.Screen name="Benachrichtigungen" component={BenachrichtigungenScreen as any} />
    </ProfilStack.Navigator>
  );
}

function NachrichtenTabIcon({ color, focused }: { color: string; focused: boolean }) {
  const { getUnreadCount } = useNachrichtenStore();
  const { activeSportlerId } = useSettingsStore();
  const { user, profile: authProfile } = useAuthStore();
  const { getSportlerById } = useAthletenStore();
  const C = useColors();

  const isActualSportler = authProfile?.role === 'sportler';
  const myId = isActualSportler
    ? (user?.id ?? '')
    : (getSportlerById(activeSportlerId ?? '')?.profileId ?? '');
  const unread = getUnreadCount(myId);

  return (
    <View>
      <Ionicons
        name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
        size={22}
        color={color}
      />
      {unread > 0 && (
        <View style={{
          position: 'absolute', top: -4, right: -6,
          width: 14, height: 14, borderRadius: 7,
          backgroundColor: C.accent,
          alignItems: 'center', justifyContent: 'center',
        }}>
        </View>
      )}
    </View>
  );
}

export default function SportlerAppNavigator() {
  const C = useColors();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: C.surface,
          borderTopColor: C.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 6,
          height: 62,
        },
        tabBarActiveTintColor:   C.accent,
        tabBarInactiveTintColor: C.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
        tabBarIcon: ({ focused, color }) => {
          const ICONS: Record<string, { on: IoniconsName; off: IoniconsName }> = {
            MeinTraining:    { on: 'barbell',              off: 'barbell-outline' },
            MeinFortschritt: { on: 'bar-chart',            off: 'bar-chart-outline' },
            MeinNachrichten: { on: 'chatbubble-ellipses',  off: 'chatbubble-ellipses-outline' },
            MeinProfil:      { on: 'person-circle',        off: 'person-circle-outline' },
          };
          if (route.name === 'MeinNachrichten') {
            return <NachrichtenTabIcon color={color} focused={focused} />;
          }
          const icon = ICONS[route.name];
          return <Ionicons name={focused ? icon.on : icon.off} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="MeinTraining"    component={MeinTrainingNavigator}      options={{ title: 'Training' }} />
      <Tab.Screen name="MeinFortschritt" component={SportlerFortschrittScreen}  options={{ title: 'Fortschritt' }} />
      <Tab.Screen name="MeinNachrichten" component={SportlerNachrichtenScreen}  options={{ title: 'Nachrichten' }} />
      <Tab.Screen name="MeinProfil"      component={MeinProfilNavigator}        options={{ title: 'Ich' }} />
    </Tab.Navigator>
  );
}
