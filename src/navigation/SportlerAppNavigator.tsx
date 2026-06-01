import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import {
  SportlerAppTabParamList,
  MeinTrainingStackParamList,
  MeinProfilStackParamList,
} from '../types';
import { useColors } from '../theme';

import SportlerAppPlanScreen      from '../screens/sportler-app/SportlerAppPlanScreen';
import SportlerAppEinheitLogScreen from '../screens/sportler-app/SportlerAppEinheitLogScreen';
import SportlerAppProfilScreen     from '../screens/sportler-app/SportlerAppProfilScreen';
import PlanFormScreen              from '../screens/plaene/PlanFormScreen';
import PlanWocheFormScreen         from '../screens/plaene/PlanWocheFormScreen';
import PlanWocheDetailScreen       from '../screens/plaene/PlanWocheDetailScreen';
import EinheitDetailScreen         from '../screens/plaene/EinheitDetailScreen';
import EinstellungenScreen         from '../screens/mehr/EinstellungenScreen';
import ImportPlanScreen            from '../screens/plaene/ImportPlanScreen';
import NachrichtenScreen           from '../screens/mehr/NachrichtenScreen';

const Tab          = createBottomTabNavigator<SportlerAppTabParamList>();
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
      <ProfilStack.Screen name="MeinProfilMain"       component={SportlerAppProfilScreen} />
      <ProfilStack.Screen name="Einstellungen"        component={EinstellungenScreen as any} />
      <ProfilStack.Screen name="NachrichtenSportler"  component={NachrichtenScreen as any} />
    </ProfilStack.Navigator>
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
            MeinTraining: { on: 'barbell',    off: 'barbell-outline' },
            MeinProfil:   { on: 'person-circle', off: 'person-circle-outline' },
          };
          const icon = ICONS[route.name];
          return <Ionicons name={focused ? icon.on : icon.off} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="MeinTraining" component={MeinTrainingNavigator} options={{ title: 'Training' }} />
      <Tab.Screen name="MeinProfil"   component={MeinProfilNavigator}   options={{ title: 'Ich' }} />
    </Tab.Navigator>
  );
}
