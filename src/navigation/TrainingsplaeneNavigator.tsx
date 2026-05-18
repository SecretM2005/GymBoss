import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../types';
import { HEADER_OPTIONS } from './headerOptions';

import TrainingsplaeneHomeScreen        from '../screens/trainingsplaene/TrainingsplaeneHomeScreen';
import TrainerPlanListScreen            from '../screens/trainingsplaene/trainer/TrainerPlanListScreen';
import TrainerPlanFormScreen            from '../screens/trainingsplaene/trainer/TrainerPlanFormScreen';
import TrainerWocheScreen               from '../screens/trainingsplaene/trainer/TrainerWocheScreen';
import TrainerWorkoutScreen             from '../screens/trainingsplaene/trainer/TrainerWorkoutScreen';
import SportlerPlanListScreen           from '../screens/trainingsplaene/sportler/SportlerPlanListScreen';
import SportlerWochenansichtScreen      from '../screens/trainingsplaene/sportler/SportlerWochenansichtScreen';
import SportlerWorkoutDetailScreen      from '../screens/trainingsplaene/sportler/SportlerWorkoutDetailScreen';
import SportlerFeedbackScreen           from '../screens/trainingsplaene/sportler/SportlerFeedbackScreen';

const Stack = createStackNavigator<TrainingsplaeneStackParamList>();

export default function TrainingsplaeneNavigator() {
  return (
    <Stack.Navigator screenOptions={HEADER_OPTIONS}>
      <Stack.Screen name="TrainingsplaeneHome"   component={TrainingsplaeneHomeScreen}   options={{ title: 'Trainingspläne' }} />
      <Stack.Screen name="TrainerPlanList"       component={TrainerPlanListScreen}       options={{ title: 'Trainer – Pläne' }} />
      <Stack.Screen name="TrainerPlanForm"       component={TrainerPlanFormScreen}       options={{ title: 'Plan' }} />
      <Stack.Screen name="TrainerWoche"          component={TrainerWocheScreen}          options={{ title: 'Woche' }} />
      <Stack.Screen name="TrainerWorkout"        component={TrainerWorkoutScreen}        options={{ title: 'Workout' }} />
      <Stack.Screen name="SportlerPlanList"      component={SportlerPlanListScreen}      options={{ title: 'Meine Pläne' }} />
      <Stack.Screen name="SportlerWochenansicht" component={SportlerWochenansichtScreen} options={{ title: 'Wochenplan' }} />
      <Stack.Screen name="SportlerWorkoutDetail" component={SportlerWorkoutDetailScreen} options={{ title: 'Workout' }} />
      <Stack.Screen name="SportlerFeedback"      component={SportlerFeedbackScreen}      options={{ title: 'Feedback' }} />
    </Stack.Navigator>
  );
}
