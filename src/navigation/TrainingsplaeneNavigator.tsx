import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { TrainingsplaeneStackParamList } from '../types';

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
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="TrainingsplaeneHome"   component={TrainingsplaeneHomeScreen} />
      <Stack.Screen name="TrainerPlanList"       component={TrainerPlanListScreen} />
      <Stack.Screen name="TrainerPlanForm"       component={TrainerPlanFormScreen} />
      <Stack.Screen name="TrainerWoche"          component={TrainerWocheScreen} />
      <Stack.Screen name="TrainerWorkout"        component={TrainerWorkoutScreen} />
      <Stack.Screen name="SportlerPlanList"      component={SportlerPlanListScreen} />
      <Stack.Screen name="SportlerWochenansicht" component={SportlerWochenansichtScreen} />
      <Stack.Screen name="SportlerWorkoutDetail" component={SportlerWorkoutDetailScreen} />
      <Stack.Screen name="SportlerFeedback"      component={SportlerFeedbackScreen} />
    </Stack.Navigator>
  );
}
