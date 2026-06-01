import 'react-native-gesture-handler';
import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useColors } from '../theme';
import BottomTabNavigator   from './BottomTabNavigator';
import SportlerAppNavigator from './SportlerAppNavigator';
import LoginScreen          from '../screens/auth/LoginScreen';

const Stack = createStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const activeRole    = useSettingsStore((s) => s.activeRole);
  const session       = useAuthStore((s) => s.session);
  const initializing  = useAuthStore((s) => s.initializing);
  const C = useColors();

  if (initializing) {
    return (
      <SafeAreaProvider>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
          <ActivityIndicator color={C.accent} size="large" />
        </View>
      </SafeAreaProvider>
    );
  }

  if (!session) {
    return (
      <SafeAreaProvider>
        <NavigationContainer>
          <LoginScreen />
        </NavigationContainer>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer key={activeRole}>
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
