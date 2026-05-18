import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BottomTabParamList } from '../types';
import { C, FONT } from '../theme';
import KundenNavigator from './KundenNavigator';
import KalenderNavigator from './KalenderNavigator';
import MitgliedschaftenNavigator from './MitgliedschaftenNavigator';
import TrainingsplaeneNavigator from './TrainingsplaeneNavigator';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

type TabCfg = { icon: IoniconsName; iconActive: IoniconsName; label: string };

const TABS: Record<keyof BottomTabParamList, TabCfg> = {
  Kunden:           { icon: 'people-outline',    iconActive: 'people',    label: 'Kunden' },
  Kalender:         { icon: 'calendar-outline',  iconActive: 'calendar',  label: 'Kalender' },
  Mitgliedschaften: { icon: 'card-outline',      iconActive: 'card',      label: 'Mitglieder' },
  Trainingsplaene:  { icon: 'barbell-outline',   iconActive: 'barbell',   label: 'Pläne' },
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const cfg = TABS[route.name];
        return {
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <Ionicons
              name={focused ? cfg.iconActive : cfg.icon}
              size={22}
              color={focused ? C.accent : C.textDim}
            />
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.label, focused && styles.labelActive]}>
              {cfg.label}
            </Text>
          ),
          tabBarStyle: styles.tabBar,
        };
      }}
    >
      <Tab.Screen name="Kunden"           component={KundenNavigator} />
      <Tab.Screen name="Kalender"         component={KalenderNavigator} />
      <Tab.Screen name="Mitgliedschaften" component={MitgliedschaftenNavigator} />
      <Tab.Screen name="Trainingsplaene"  component={TrainingsplaeneNavigator} />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: C.surface,
    borderTopColor: C.border,
    borderTopWidth: 1,
    height: 72,
    paddingBottom: 16,
    paddingTop: 8,
  },
  label: { fontSize: FONT.xs, color: C.textDim, fontWeight: '600', marginTop: 2 },
  labelActive: { color: C.accent },
});
