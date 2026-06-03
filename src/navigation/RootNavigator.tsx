import 'react-native-gesture-handler';
import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet, ScrollView } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootStackParamList } from '../types';
import { useSettingsStore } from '../store/settingsStore';
import { useAuthStore } from '../store/authStore';
import { useColors, SP, R, FONT } from '../theme';
import { isSupabaseConfigured } from '../lib/supabase';
import BottomTabNavigator   from './BottomTabNavigator';
import SportlerAppNavigator from './SportlerAppNavigator';
import LoginScreen          from '../screens/auth/LoginScreen';

const Stack = createStackNavigator<RootStackParamList>();

function SupabaseSetupScreen() {
  const C = useColors();
  return (
    <View style={[setup.root, { backgroundColor: C.bg }]}>
      <ScrollView contentContainerStyle={setup.content} showsVerticalScrollIndicator={false}>
        <View style={[setup.iconBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={setup.icon}>⚙️</Text>
        </View>
        <Text style={[setup.title, { color: C.text }]}>Supabase konfigurieren</Text>
        <Text style={[setup.body, { color: C.textMuted }]}>
          Das Backend ist noch nicht eingerichtet. Erstelle ein Supabase-Projekt und
          trage die Zugangsdaten in eine{' '}
          <Text style={{ color: C.accent, fontWeight: '700' }}>.env</Text>-Datei im
          Stammverzeichnis ein:
        </Text>

        <View style={[setup.codeBox, { backgroundColor: C.surface, borderColor: C.border }]}>
          <Text style={[setup.code, { color: C.accent }]}>EXPO_PUBLIC_SUPABASE_URL=</Text>
          <Text style={[setup.codeComment, { color: C.textDim }]}>https://xxxx.supabase.co</Text>
          <Text style={[setup.code, { color: C.accent }]}>EXPO_PUBLIC_SUPABASE_ANON_KEY=</Text>
          <Text style={[setup.codeComment, { color: C.textDim }]}>eyJhbG...anon-key</Text>
        </View>

        <Text style={[setup.hint, { color: C.textDim }]}>
          Führe danach{' '}
          <Text style={{ color: C.accent }}>npx expo start</Text>
          {' '}neu aus. Das Schema für die Datenbank befindet sich in{' '}
          <Text style={{ color: C.accent }}>supabase/schema.sql</Text>.
        </Text>
      </ScrollView>
    </View>
  );
}

const setup = StyleSheet.create({
  root:        { flex: 1 },
  content:     { padding: SP.xl, gap: SP.lg, alignItems: 'center', paddingTop: 80 },
  iconBox:     { width: 80, height: 80, borderRadius: R.xl, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  icon:        { fontSize: 36 },
  title:       { fontSize: FONT.xl, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center' },
  body:        { fontSize: FONT.base, lineHeight: 24, textAlign: 'center', maxWidth: 320 },
  codeBox:     { width: '100%', borderRadius: R.lg, borderWidth: 1, padding: SP.lg, gap: 4 },
  code:        { fontSize: FONT.sm, fontWeight: '700', letterSpacing: 0.2 },
  codeComment: { fontSize: FONT.sm, marginBottom: 6 },
  hint:        { fontSize: FONT.sm, lineHeight: 22, textAlign: 'center', maxWidth: 320, color: '#888' },
});

export default function RootNavigator() {
  const activeRole   = useSettingsStore((s) => s.activeRole);
  const session      = useAuthStore((s) => s.session);
  const initializing = useAuthStore((s) => s.initializing);
  const C = useColors();

  if (!isSupabaseConfigured) {
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
