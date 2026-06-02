import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import type { AuthChangeEvent, Session } from '@supabase/supabase-js';
import { useSettingsStore } from './src/store/settingsStore';
import { useAuthStore } from './src/store/authStore';
import { useAthletenStore } from './src/store/athletenStore';
import { usePlanStore } from './src/store/planStore';
import { useEinheitStore } from './src/store/einheitStore';
import { useUebungStore } from './src/store/uebungStore';
import { useNachrichtenStore } from './src/store/nachrichtenStore';
import { useSessionLogStore } from './src/store/sessionLogStore';
import { supabase, isSupabaseConfigured } from './src/lib/supabase';
import { Sportler } from './src/types';
import RootNavigator from './src/navigation/RootNavigator';

const DEMO_SPORTLER: Sportler[] = [
  { id: 'demo-s1', name: 'Anna Berger',    initials: 'AB', sportart: 'Leichtathletik', ziel: '10km unter 45 min' },
  { id: 'demo-s2', name: 'Felix Wagner',   initials: 'FW', sportart: 'Kraft',          ziel: 'Bankdrücken 100 kg' },
  { id: 'demo-s3', name: 'Laura Schmidt',  initials: 'LS', sportart: 'Triathlon',      ziel: 'Erster Sprint-Triathlon' },
];

function seedDemoData() {
  useSettingsStore.getState().setTrainerId('demo');
  useSettingsStore.getState().setActiveRole('trainer');
  useAuthStore.getState().setProfile({ id: 'demo', role: 'trainer', name: 'Demo-Trainer', initials: 'DT' });
  useAthletenStore.setState({ sportler: DEMO_SPORTLER });
}

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
    if (!isSupabaseConfigured) {
      seedDemoData();
      setInitializing(false);
      return;
    }

    supabase.auth.getSession().then(({ data }: { data: { session: Session | null } }) => {
      setSession(data.session);
      if (data.session) {
        bootstrapUser(data.session.user.id);
      } else {
        setInitializing(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event: AuthChangeEvent, session: Session | null) => {
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
