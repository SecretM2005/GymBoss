import 'react-native-gesture-handler';
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from './src/store/settingsStore';
import RootNavigator from './src/navigation/RootNavigator';

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  return (
    <>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <RootNavigator />
    </>
  );
}
