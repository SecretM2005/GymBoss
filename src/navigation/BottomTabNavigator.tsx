import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabParamList } from '../types';
import { useColors } from '../theme';
import { useT } from '../i18n';

import DashboardScreen   from '../screens/dashboard/DashboardScreen';
import PlaeneNavigator   from './PlaeneNavigator';
import SportlerNavigator from './SportlerNavigator';
import MehrNavigator     from './MehrNavigator';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Dashboard: { active: 'home',                inactive: 'home-outline' },
  Plaene:    { active: 'barbell',             inactive: 'barbell-outline' },
  Sportler:  { active: 'people',              inactive: 'people-outline' },
  Mehr:      { active: 'ellipsis-horizontal', inactive: 'ellipsis-horizontal-outline' },
};

export default function BottomTabNavigator() {
  const C = useColors();
  const t = useT();

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
        tabBarActiveTintColor: C.accent,
        tabBarInactiveTintColor: C.textDim,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600', letterSpacing: 0.1 },
        tabBarIcon: ({ focused, color }) => {
          const icons = TAB_ICONS[route.name];
          return <Ionicons name={focused ? icons.active : icons.inactive} size={22} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen}   options={{ title: t('tab_home') }} />
      <Tab.Screen name="Plaene"    component={PlaeneNavigator}   options={{ title: t('tab_plaene') }} />
      <Tab.Screen name="Sportler"  component={SportlerNavigator} options={{ title: t('tab_sportler') }} />
      <Tab.Screen name="Mehr"      component={MehrNavigator}     options={{ title: t('tab_mehr') }} />
    </Tab.Navigator>
  );
}
