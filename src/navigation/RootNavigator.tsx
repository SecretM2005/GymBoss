import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import BottomTabNavigator    from './BottomTabNavigator';
import SportlerAppNavigator  from './SportlerAppNavigator';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const activeRole = useSettingsStore((s) => s.activeRole);

  return (
    <SafeAreaProvider>
      <NavigationContainer>
        {activeRole === 'sportler' ? (
          <SportlerAppNavigator />
        ) : (
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Main" component={BottomTabNavigator} />
          </Stack.Navigator>
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
