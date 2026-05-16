import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text } from 'react-native';
import { BottomTabParamList } from '../types';
import KundenNavigator from './KundenNavigator';
import KalenderNavigator from './KalenderNavigator';
import MitgliedschaftenNavigator from './MitgliedschaftenNavigator';
import TrainingsplaeneNavigator from './TrainingsplaeneNavigator';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const TAB_ICONS: Record<keyof BottomTabParamList, string> = {
  Kunden: '👥',
  Kalender: '📅',
  Mitgliedschaften: '🏷️',
  Trainingsplaene: '📋',
};

const TAB_LABELS: Record<keyof BottomTabParamList, string> = {
  Kunden: 'Kunden',
  Kalender: 'Kalender',
  Mitgliedschaften: 'Mitglieder',
  Trainingsplaene: 'Pläne',
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarIcon: ({ focused }) => (
          <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.45 }}>
            {TAB_ICONS[route.name]}
          </Text>
        ),
        tabBarLabel: TAB_LABELS[route.name],
        tabBarActiveTintColor: '#6366f1',
        tabBarInactiveTintColor: '#9ca3af',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor: '#e5e7eb',
          borderTopWidth: 1,
          paddingBottom: 6,
          paddingTop: 4,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      })}
    >
      <Tab.Screen name="Kunden" component={KundenNavigator} />
      <Tab.Screen name="Kalender" component={KalenderNavigator} />
      <Tab.Screen name="Mitgliedschaften" component={MitgliedschaftenNavigator} />
      <Tab.Screen name="Trainingsplaene" component={TrainingsplaeneNavigator} />
    </Tab.Navigator>
  );
}
