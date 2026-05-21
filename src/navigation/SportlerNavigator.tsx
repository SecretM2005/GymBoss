import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { SportlerStackParamList } from '../types';
import SportlerListScreen           from '../screens/sportler/SportlerListScreen';
import SportlerDetailScreen         from '../screens/sportler/SportlerDetailScreen';
import SportlerFormScreen           from '../screens/sportler/SportlerFormScreen';
import SportlerEinheitDetailScreen  from '../screens/sportler/SportlerEinheitDetailScreen';

const Stack = createStackNavigator<SportlerStackParamList>();

export default function SportlerNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="SportlerList"           component={SportlerListScreen} />
      <Stack.Screen name="SportlerDetail"         component={SportlerDetailScreen} />
      <Stack.Screen name="SportlerForm"           component={SportlerFormScreen} />
      <Stack.Screen name="SportlerEinheitDetail"  component={SportlerEinheitDetailScreen} />
    </Stack.Navigator>
  );
}
