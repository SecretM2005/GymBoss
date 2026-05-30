import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PlaeneStackParamList } from '../types';
import PlanListScreen       from '../screens/plaene/PlanListScreen';
import PlanDetailScreen     from '../screens/plaene/PlanDetailScreen';
import PlanFormScreen       from '../screens/plaene/PlanFormScreen';
import PlanWocheFormScreen  from '../screens/plaene/PlanWocheFormScreen';
import PlanWocheDetailScreen from '../screens/plaene/PlanWocheDetailScreen';
import EinheitDetailScreen  from '../screens/plaene/EinheitDetailScreen';
import ImportPlanScreen     from '../screens/plaene/ImportPlanScreen';

const Stack = createStackNavigator<PlaeneStackParamList>();

export default function PlaeneNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="PlanList"        component={PlanListScreen} />
      <Stack.Screen name="PlanDetail"      component={PlanDetailScreen} />
      <Stack.Screen name="PlanForm"        component={PlanFormScreen} />
      <Stack.Screen name="ImportPlan"      component={ImportPlanScreen} />
      <Stack.Screen name="PlanWocheForm"   component={PlanWocheFormScreen} />
      <Stack.Screen name="PlanWocheDetail" component={PlanWocheDetailScreen} />
      <Stack.Screen name="EinheitDetail"   component={EinheitDetailScreen} />
    </Stack.Navigator>
  );
}
