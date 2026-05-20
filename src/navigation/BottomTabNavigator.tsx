import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabParamList } from '../types';
import { C } from '../theme';

import DashboardScreen   from '../screens/dashboard/DashboardScreen';
import PlaeneScreen      from '../screens/plaene/PlaeneScreen';
import SportlerNavigator from './SportlerNavigator';
import MehrScreen        from '../screens/mehr/MehrScreen';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconsName; inactive: IoniconsName }> = {
  Dashboard: { active: 'home',                inactive: 'home-outline' },
  Plaene:    { active: 'barbell',             inactive: 'barbell-outline' },
  Sportler:  { active: 'people',              inactive: 'people-outline' },
  Mehr:      { active: 'ellipsis-horizontal', inactive: 'ellipsis-horizontal-outline' },
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0F0F11',
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
      <Tab.Screen name="Dashboard" component={DashboardScreen}   options={{ title: 'Home' }} />
      <Tab.Screen name="Plaene"    component={PlaeneScreen}      options={{ title: 'Pläne' }} />
      <Tab.Screen name="Sportler"  component={SportlerNavigator} options={{ title: 'Sportler' }} />
      <Tab.Screen name="Mehr"      component={MehrScreen}        options={{ title: 'Mehr' }} />
    </Tab.Navigator>
  );
}
