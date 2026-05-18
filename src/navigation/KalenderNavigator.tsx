import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { KalenderStackParamList } from '../types';
import KalenderScreen from '../screens/kalender/KalenderScreen';
import TerminDetailScreen from '../screens/kalender/TerminDetailScreen';
import TerminFormScreen from '../screens/kalender/TerminFormScreen';
import { HEADER_OPTIONS } from './headerOptions';

const Stack = createStackNavigator<KalenderStackParamList>();

export default function KalenderNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTIONS}>
      <Stack.Screen name="KalenderOverview" component={KalenderScreen}    options={{ title: 'Kalender' }} />
      <Stack.Screen name="TerminDetail"     component={TerminDetailScreen} options={{ title: 'Termin' }} />
      <Stack.Screen name="TerminForm"       component={TerminFormScreen}   options={{ title: 'Neuer Termin' }} />
    </Stack.Navigator>
  );
}
