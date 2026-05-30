import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { MehrStackParamList } from '../types';
import MehrHubScreen              from '../screens/mehr/MehrScreen';
import EinstellungenScreen        from '../screens/mehr/EinstellungenScreen';
import UebungsBibliothekScreen    from '../screens/mehr/UebungsBibliothekScreen';
import EinheitTemplateDetailScreen from '../screens/mehr/EinheitTemplateDetailScreen';
import UebungTemplateFormScreen   from '../screens/mehr/UebungTemplateFormScreen';

const Stack = createStackNavigator<MehrStackParamList>();

export default function MehrNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MehrHub"               component={MehrHubScreen} />
      <Stack.Screen name="Einstellungen"          component={EinstellungenScreen} />
      <Stack.Screen name="Uebungsbibliothek"      component={UebungsBibliothekScreen} />
      <Stack.Screen name="EinheitTemplateDetail"  component={EinheitTemplateDetailScreen} />
      <Stack.Screen name="UebungTemplateForm"     component={UebungTemplateFormScreen} />
    </Stack.Navigator>
  );
}
