import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { BottomTabParamList } from '../types';
import { C, FONT, SP } from '../theme';
import KundenNavigator from './KundenNavigator';
import KalenderNavigator from './KalenderNavigator';
import MitgliedschaftenNavigator from './MitgliedschaftenNavigator';
import TrainingsplaeneNavigator from './TrainingsplaeneNavigator';

const Tab = createBottomTabNavigator<BottomTabParamList>();

type TabConfig = {
  icon: string;
  label: string;
};

const TABS: Record<keyof BottomTabParamList, TabConfig> = {
  Kunden:          { icon: '👥', label: 'Kunden' },
  Kalender:        { icon: '📅', label: 'Kalender' },
  Mitgliedschaften:{ icon: '🏷️', label: 'Mitglieder' },
  Trainingsplaene: { icon: '📋', label: 'Pläne' },
};

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const { icon, label } = TABS[route.name];
        return {
          headerShown: false,
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
              <Text style={[styles.icon, !focused && styles.iconInactive]}>{icon}</Text>
            </View>
          ),
          tabBarLabel: ({ focused }) => (
            <Text style={[styles.label, focused && styles.labelActive]}>
              {label}
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
    backgroundColor: C.white,
    borderTopColor: C.border,
    borderTopWidth: 1,
    height: 64,
    paddingBottom: SP.sm,
    paddingTop: SP.xs,
  },
  iconWrap: {
    width: 36,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  iconWrapActive: {
    backgroundColor: C.primaryLight,
  },
  icon: { fontSize: 20 },
  iconInactive: { opacity: 0.45 },
  label: { fontSize: FONT.xs, color: C.textMuted, fontWeight: '500', marginTop: 2 },
  labelActive: { color: C.primary, fontWeight: '700' },
});
