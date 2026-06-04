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
import { Sportler, TrainingsPlan, PlanWoche, Einheit, WorkoutFeedback } from './src/types';
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

  // Demo plans and session logs for gamification
  const today = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  const daysAgo = (n: number) => {
    const d = new Date(today.getTime() - n * 86400000);
    return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
  };

  const makeEinheit = (id: string, name: string, datum: string): Einheit => ({
    id, name, datum, warmup: [], cooldown: [],
    haupteinheit: [{ id: `u_${id}`, name: 'Grundübung', parameter: [{ typ: 'serien', wert: '3' }, { typ: 'wiederholungen', wert: '10' }] }],
  });

  // Plan 1: 4-week plan, Anna (demo-s1) at 90% compliance
  const plan1Einheiten: Einheit[] = [
    makeEinheit('e1_1', 'Montag Kraft',      daysAgo(21)),
    makeEinheit('e1_2', 'Mittwoch Ausdauer', daysAgo(19)),
    makeEinheit('e1_3', 'Freitag Kraft',     daysAgo(17)),
    makeEinheit('e1_4', 'Montag Kraft',      daysAgo(14)),
    makeEinheit('e1_5', 'Mittwoch Ausdauer', daysAgo(12)),
    makeEinheit('e1_6', 'Freitag Kraft',     daysAgo(10)),
    makeEinheit('e1_7', 'Montag Kraft',      daysAgo(7)),
    makeEinheit('e1_8', 'Mittwoch Ausdauer', daysAgo(5)),
    makeEinheit('e1_9', 'Freitag Kraft',     daysAgo(3)),
    makeEinheit('e1_10','Montag Kraft',      daysAgo(0)),
  ];
  const plan1Woche: PlanWoche = { id: 'pw1', wochennummer: 1, einheiten: plan1Einheiten };
  const startDate1 = new Date(today.getTime() - 28 * 86400000);
  const plan1: TrainingsPlan = {
    id: 'demo-plan-1', name: 'Kraftaufbau Basis', sportart: 'Kraftsport',
    trainerId: 'demo', sportlerIds: ['demo-s1'],
    startdatum: `${pad(startDate1.getDate())}.${pad(startDate1.getMonth()+1)}.${startDate1.getFullYear()}`,
    wochen: [plan1Woche],
  };

  // Plan 2: Felix (demo-s2) at 60% compliance
  const plan2Einheiten: Einheit[] = [
    makeEinheit('e2_1', 'Oberkörper',  daysAgo(20)),
    makeEinheit('e2_2', 'Beine',       daysAgo(18)),
    makeEinheit('e2_3', 'Cardio',      daysAgo(16)),
    makeEinheit('e2_4', 'Oberkörper',  daysAgo(13)),
    makeEinheit('e2_5', 'Beine',       daysAgo(11)),
    makeEinheit('e2_6', 'Cardio',      daysAgo(9)),
    makeEinheit('e2_7', 'Oberkörper',  daysAgo(6)),
    makeEinheit('e2_8', 'Beine',       daysAgo(4)),
    makeEinheit('e2_9', 'Cardio',      daysAgo(2)),
    makeEinheit('e2_10','Oberkörper',  daysAgo(1)),
  ];
  const plan2Woche: PlanWoche = { id: 'pw2', wochennummer: 1, einheiten: plan2Einheiten };
  const startDate2 = new Date(today.getTime() - 21 * 86400000);
  const plan2: TrainingsPlan = {
    id: 'demo-plan-2', name: 'Ganzkörper Kondition', sportart: 'Konditionierung',
    trainerId: 'demo', sportlerIds: ['demo-s2'],
    startdatum: `${pad(startDate2.getDate())}.${pad(startDate2.getMonth()+1)}.${startDate2.getFullYear()}`,
    wochen: [plan2Woche],
  };

  usePlanStore.setState({ plaene: [plan1, plan2] });

  // Session logs: Anna 90% = 9/10, Felix 60% = 6/10
  const makeLogs = (athleteId: string, einheiten: Einheit[], completedIndices: number[]): WorkoutFeedback[] =>
    completedIndices.map((i) => ({
      id: `log_${athleteId}_${i}`,
      workoutId: einheiten[i].id,
      sportlerId: athleteId,
      datum: einheiten[i].datum ?? daysAgo(0),
      bewertung: 4,
      rpe: 7,
      notiz: i % 3 === 0 ? 'Gute Einheit, Gewicht erhöht und Form verbessert.' : undefined,
      abgeschlossen: true,
    }));

  const annaLogs = makeLogs('demo-s1', plan1Einheiten, [0,1,2,3,4,5,6,7,8]); // 9/10 = 90%
  const felixLogs = makeLogs('demo-s2', plan2Einheiten, [0,1,2,4,5,7]);        // 6/10 = 60%

  useSessionLogStore.setState({ logs: [...annaLogs, ...felixLogs] });
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
