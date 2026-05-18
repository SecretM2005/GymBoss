import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../types';
import TrainingsplaeneListScreen from '../screens/trainingsplaene/TrainingsplaeneListScreen';
import TrainingsplanDetailScreen from '../screens/trainingsplaene/TrainingsplanDetailScreen';
import TrainingsplanFormScreen from '../screens/trainingsplaene/TrainingsplanFormScreen';
import { HEADER_OPTIONS } from './headerOptions';

const Stack = createStackNavigator<TrainingsplaeneStackParamList>();

export default function TrainingsplaeneNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTIONS}>
      <Stack.Screen name="TrainingsplaeneList" component={TrainingsplaeneListScreen} options={{ title: 'Trainingspläne' }} />
      <Stack.Screen name="TrainingsplanDetail" component={TrainingsplanDetailScreen} options={{ title: 'Trainingsplan' }} />
      <Stack.Screen name="TrainingsplanForm"   component={TrainingsplanFormScreen}   options={{ title: 'Neuer Plan' }} />
    </Stack.Navigator>
  );
}
