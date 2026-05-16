import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { KundenStackParamList } from '../types';
import KundenListScreen from '../screens/kunden/KundenListScreen';
import KundenDetailScreen from '../screens/kunden/KundenDetailScreen';
import KundeAnlegenScreen from '../screens/kunden/KundeAnlegenScreen';
import { HEADER_OPTIONS } from './headerOptions';

const Stack = createStackNavigator<KundenStackParamList>();

export default function KundenNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTIONS}>
      <Stack.Screen name="KundenList" component={KundenListScreen} options={{ title: 'Kunden' }} />
      <Stack.Screen name="KundenDetail" component={KundenDetailScreen} options={{ title: 'Kundenprofil' }} />
      <Stack.Screen name="KundeAnlegen" component={KundeAnlegenScreen} options={{ title: 'Neuer Kunde' }} />
    </Stack.Navigator>
  );
}
