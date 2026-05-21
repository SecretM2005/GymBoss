import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PlaeneStackParamList } from '../types';
import PlanListScreen     from '../screens/plaene/PlanListScreen';
import PlanDetailScreen   from '../screens/plaene/PlanDetailScreen';
import PlanFormScreen     from '../screens/plaene/PlanFormScreen';
import PlanWocheFormScreen from '../screens/plaene/PlanWocheFormScreen';

const Stack = createStackNavigator<PlaeneStackParamList>();

export default function PlaeneNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlanList"      component={PlanListScreen} />
      <Stack.Screen name="PlanDetail"    component={PlanDetailScreen} />
      <Stack.Screen name="PlanForm"      component={PlanFormScreen} />
      <Stack.Screen name="PlanWocheForm" component={PlanWocheFormScreen} />
    </Stack.Navigator>
  );
}
