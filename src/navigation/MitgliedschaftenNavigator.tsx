import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MitgliedschaftenStackParamList } from '../types';
import MitgliedschaftenListScreen from '../screens/mitgliedschaften/MitgliedschaftenListScreen';
import MitgliedschaftDetailScreen from '../screens/mitgliedschaften/MitgliedschaftDetailScreen';
import MitgliedschaftFormScreen from '../screens/mitgliedschaften/MitgliedschaftFormScreen';
import { HEADER_OPTIONS } from './headerOptions';

const Stack = createStackNavigator<MitgliedschaftenStackParamList>();

export default function MitgliedschaftenNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTIONS}>
      <Stack.Screen
        name="MitgliedschaftenList"
        component={MitgliedschaftenListScreen}
        options={{ title: 'Mitgliedschaften' }}
      />
      <Stack.Screen
        name="MitgliedschaftDetail"
        component={MitgliedschaftDetailScreen}
        options={{ title: 'Mitgliedschaft' }}
      />
      <Stack.Screen
        name="MitgliedschaftForm"
        component={MitgliedschaftFormScreen}
        options={{ title: 'Neue Mitgliedschaft' }}
      />
    </Stack.Navigator>
  );
}
