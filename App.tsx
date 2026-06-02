import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { useSettingsStore } from './src/store/settingsStore';
import { useAuthStore } from './src/store/authStore';
import { useAthletenStore } from './src/store/athletenStore';
import { usePlanStore } from './src/store/planStore';
import { useEinheitStore } from './src/store/einheitStore';
import { useUebungStore } from './src/store/uebungStore';
import { useNachrichtenStore } from './src/store/nachrichtenStore';
import { useSessionLogStore } from './src/store/sessionLogStore';
import { supabase } from './src/lib/supabase';
import RootNavigator from './src/navigation/RootNavigator';

async function bootstrapUser(userId: string) {
  const { setProfile, setInitializing } = useAuthStore.getState();
  const { setActiveRole, setActiveSportlerId, setTrainerId } = useSettingsStore.getState();

  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (!profile) return;

    setProfile(profile);
    setActiveRole(profile.role);

    if (profile.role === 'trainer') {
      setTrainerId(userId);
      await Promise.all([
        useAthletenStore.getState().hydrate(userId),
        usePlanStore.getState().hydrate(userId),
        useEinheitStore.getState().hydrate(userId),
        useUebungStore.getState().hydrate(userId),
        useNachrichtenStore.getState().hydrate(userId),
      ]);
    } else {
      const { data: athlete } = await supabase
        .from('athletes')
        .select('id, trainer_id')
        .eq('profile_id', userId)
        .single();

      if (athlete) {
        setActiveSportlerId(athlete.id);
        setTrainerId(athlete.trainer_id);
        await Promise.all([
          usePlanStore.getState().hydrateForSportler(athlete.id),
          useSessionLogStore.getState().hydrate(athlete.id),
          useNachrichtenStore.getState().hydrate(userId),
        ]);
      }
    }
  } finally {
    setInitializing(false);
  }
}

function resetAllStores() {
  const { setProfile, setInitializing } = useAuthStore.getState();
  const { setActiveRole, setActiveSportlerId, setTrainerId } = useSettingsStore.getState();
  useAthletenStore.getState().reset();
  usePlanStore.getState().reset();
  useEinheitStore.getState().reset();
  useUebungStore.getState().reset();
  useNachrichtenStore.getState().reset();
  useSessionLogStore.getState().reset();
  setProfile(null);
  setActiveRole('trainer');
  setActiveSportlerId(null);
  setTrainerId('');
  setInitializing(false);
}

export default function App() {
  const theme = useSettingsStore((s) => s.theme);
  const { setSession, setInitializing } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        bootstrapUser(session.user.id);
      } else {
        setInitializing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'SIGNED_IN' && session) {
        bootstrapUser(session.user.id);
      } else if (event === 'SIGNED_OUT') {
        resetAllStores();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <>
      <StatusBar style={theme === 'light' ? 'dark' : 'light'} />
      <RootNavigator />
    </>
  );
}
