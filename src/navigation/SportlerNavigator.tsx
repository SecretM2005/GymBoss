import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SportlerStackParamList } from '../types';
import SportlerListScreen from '../screens/sportler/SportlerListScreen';
import SportlerFormScreen from '../screens/sportler/SportlerFormScreen';

const Stack = createStackNavigator<SportlerStackParamList>();

export default function SportlerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SportlerList" component={SportlerListScreen} />
      <Stack.Screen name="SportlerForm" component={SportlerFormScreen} />
    </Stack.Navigator>
  );
}
