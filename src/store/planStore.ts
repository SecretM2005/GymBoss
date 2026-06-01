import { create } from 'zustand';
import { TrainingsPlan, Einheit, EinheitTemplate } from '../types';
import { supabase, uid } from '../lib/supabase';
import { useSettingsStore } from './settingsStore';

function rowToPlan(p: any): TrainingsPlan {
  return {
    id: p.id,
    name: p.name,
    beschreibung: p.beschreibung ?? undefined,
    sportart: p.sportart ?? undefined,
    trainerId: p.trainer_id,
    startdatum: p.startdatum ?? undefined,
    sportlerIds: (p.plan_athletes as any[] ?? []).map((pa: any) => pa.athlete_id),
    wochen: ((p.plan_wochen as any[]) ?? [])
      .sort((a: any, b: any) => a.wochennummer - b.wochennummer)
      .map((w: any) => ({
        id: w.id,
        wochennummer: w.wochennummer,
        notizen: w.notizen ?? '',
        einheiten: ((w.einheiten as any[]) ?? []).map(rowToEinheit),
      })),
  };
}

function rowToEinheit(e: any): Einheit {
  return {
    id: e.id,
    name: e.name,
    templateId: e.template_id ?? undefined,
    datum: e.datum ?? undefined,
    warmup: e.warmup ?? [],
    haupteinheit: e.haupteinheit ?? [],
    cooldown: e.cooldown ?? [],
    sportlerOverrides: e.sportler_overrides ?? {},
  };
}

async function syncPlanAthletes(planId: string, sportlerIds: string[]) {
  await supabase.from('plan_athletes').delete().eq('plan_id', planId);
  if (sportlerIds.length > 0) {
    await supabase.from('plan_athletes').insert(
      sportlerIds.map((athleteId) => ({ plan_id: planId, athlete_id: athleteId }))
    );
  }
}

type PlanState = {
  plaene: TrainingsPlan[];
  hydrate:              (trainerId: string) => Promise<void>;
  hydrateForSportler:   (athleteId: string) => Promise<void>;
  reset:                () => void;
  addPlan:              (data: Omit<TrainingsPlan, 'id' | 'wochen'>) => string;
  updatePlan:           (id: string, data: Partial<Omit<TrainingsPlan, 'id' | 'wochen'>>) => void;
  deletePlan:           (id: string) => void;
  duplicatePlan:        (id: string) => string;
  getPlanById:          (id: string) => TrainingsPlan | undefined;
  getPlaeneForSportler: (sportlerId: string) => TrainingsPlan[];
  addWoche:             (planId: string, notizen?: string) => string;
  updateWoche:          (planId: string, wocheId: string, notizen: string) => void;
  deleteWoche:          (planId: string, wocheId: string) => void;
  saveEinheit:          (planId: string, wocheId: string, einheit: Einheit) => void;
  deleteEinheit:        (planId: string, wocheId: string, einheitId: string) => void;
  saveEinheitOverride:  (planId: string, wocheId: string, einheitId: string, sportlerId: string, data: EinheitTemplate) => void;
};

const PLAN_QUERY = `
  *,
  plan_athletes (athlete_id),
  plan_wochen (
    *,
    einheiten (*)
  )
`;

const mapWoche = (planId: string, wocheId: string, fn: (e: Einheit[]) => Einheit[]) =>
  (s: { plaene: TrainingsPlan[] }) => ({
    plaene: s.plaene.map((p) =>
      p.id === planId
        ? { ...p, wochen: p.wochen.map((w) => w.id === wocheId ? { ...w, einheiten: fn(w.einheiten) } : w) }
        : p
    ),
  });

export const usePlanStore = create<PlanState>((set, get) => ({
  plaene: [],

  hydrate: async (trainerId) => {
    const { data } = await supabase
      .from('training_plans')
      .select(PLAN_QUERY)
      .eq('trainer_id', trainerId)
      .order('created_at', { ascending: true });
    if (data) set({ plaene: data.map(rowToPlan) });
  },

  hydrateForSportler: async (athleteId) => {
    const { data: assignments } = await supabase
      .from('plan_athletes')
      .select('plan_id')
      .eq('athlete_id', athleteId);
    if (!assignments || assignments.length === 0) return;
    const planIds = assignments.map((a: any) => a.plan_id);
    const { data } = await supabase
      .from('training_plans')
      .select(PLAN_QUERY)
      .in('id', planIds);
    if (data) set({ plaene: data.map(rowToPlan) });
  },

  reset: () => set({ plaene: [] }),

  addPlan: (data) => {
    const id = uid();
    const trainerId = useSettingsStore.getState().trainerId || data.trainerId;
    const plan: TrainingsPlan = { ...data, trainerId, id, wochen: [] };
    set((s) => ({ plaene: [...s.plaene, plan] }));
    (async () => {
      await supabase.from('training_plans').insert({
        id,
        trainer_id: trainerId,
        name: data.name,
        beschreibung: data.beschreibung ?? null,
        sportart: data.sportart ?? null,
        startdatum: data.startdatum ?? null,
      });
      await syncPlanAthletes(id, data.sportlerIds);
    })();
    return id;
  },

  updatePlan: (id, data) => {
    set((s) => ({ plaene: s.plaene.map((p) => (p.id === id ? { ...p, ...data } : p)) }));
    (async () => {
      const updates: any = {};
      if (data.name !== undefined)        updates.name = data.name;
      if (data.beschreibung !== undefined) updates.beschreibung = data.beschreibung ?? null;
      if (data.sportart !== undefined)     updates.sportart = data.sportart ?? null;
      if (data.startdatum !== undefined)   updates.startdatum = data.startdatum ?? null;
      if (Object.keys(updates).length > 0) {
        await supabase.from('training_plans').update(updates).eq('id', id);
      }
      if (data.sportlerIds !== undefined) {
        await syncPlanAthletes(id, data.sportlerIds);
      }
    })();
  },

  deletePlan: (id) => {
    set((s) => ({ plaene: s.plaene.filter((p) => p.id !== id) }));
    supabase.from('training_plans').delete().eq('id', id);
  },

  duplicatePlan: (id) => {
    const original = get().plaene.find((p) => p.id === id);
    if (!original) return '';
    const newId = uid();
    const copy: TrainingsPlan = {
      ...original,
      id: newId,
      name: `${original.name} (Kopie)`,
      wochen: original.wochen.map((w) => ({
        ...w,
        id: uid(),
        einheiten: w.einheiten.map((e) => ({ ...e, id: uid() })),
      })),
    };
    set((s) => ({ plaene: [...s.plaene, copy] }));
    (async () => {
      await supabase.from('training_plans').insert({
        id: newId,
        trainer_id: copy.trainerId,
        name: copy.name,
        beschreibung: copy.beschreibung ?? null,
        sportart: copy.sportart ?? null,
        startdatum: copy.startdatum ?? null,
      });
      await syncPlanAthletes(newId, copy.sportlerIds);
      for (const woche of copy.wochen) {
        await supabase.from('plan_wochen').insert({
          id: woche.id,
          plan_id: newId,
          wochennummer: woche.wochennummer,
          notizen: woche.notizen ?? '',
        });
        for (const einheit of woche.einheiten) {
          await supabase.from('einheiten').insert({
            id: einheit.id,
            woche_id: woche.id,
            name: einheit.name,
            template_id: einheit.templateId ?? null,
            datum: einheit.datum ?? null,
            warmup: einheit.warmup,
            haupteinheit: einheit.haupteinheit,
            cooldown: einheit.cooldown,
            sportler_overrides: einheit.sportlerOverrides ?? {},
          });
        }
      }
    })();
    return newId;
  },

  getPlanById: (id) => get().plaene.find((p) => p.id === id),

  getPlaeneForSportler: (sportlerId) =>
    get().plaene.filter((p) => p.sportlerIds.includes(sportlerId)),

  addWoche: (planId, notizen = '') => {
    const plan = get().plaene.find((p) => p.id === planId);
    if (!plan) return '';
    const wochennummer = plan.wochen.length + 1;
    const id = uid();
    set((s) => ({
      plaene: s.plaene.map((p) =>
        p.id === planId
          ? { ...p, wochen: [...p.wochen, { id, wochennummer, notizen, einheiten: [] }] }
          : p
      ),
    }));
    supabase.from('plan_wochen').insert({ id, plan_id: planId, wochennummer, notizen });
    return id;
  },

  updateWoche: (planId, wocheId, notizen) => {
    set((s) => ({
      plaene: s.plaene.map((p) =>
        p.id === planId
          ? { ...p, wochen: p.wochen.map((w) => (w.id === wocheId ? { ...w, notizen } : w)) }
          : p
      ),
    }));
    supabase.from('plan_wochen').update({ notizen }).eq('id', wocheId);
  },

  deleteWoche: (planId, wocheId) => {
    set((s) => ({
      plaene: s.plaene.map((p) =>
        p.id === planId
          ? {
              ...p,
              wochen: p.wochen
                .filter((w) => w.id !== wocheId)
                .map((w, i) => ({ ...w, wochennummer: i + 1 })),
            }
          : p
      ),
    }));
    supabase.from('plan_wochen').delete().eq('id', wocheId);
  },

  saveEinheit: (planId, wocheId, einheit) => {
    set(mapWoche(planId, wocheId, (einheiten) => {
      const exists = einheiten.some((e) => e.id === einheit.id);
      return exists
        ? einheiten.map((e) => (e.id === einheit.id ? einheit : e))
        : [...einheiten, einheit];
    }));
    supabase.from('einheiten').upsert({
      id: einheit.id,
      woche_id: wocheId,
      name: einheit.name,
      template_id: einheit.templateId ?? null,
      datum: einheit.datum ?? null,
      warmup: einheit.warmup,
      haupteinheit: einheit.haupteinheit,
      cooldown: einheit.cooldown,
      sportler_overrides: einheit.sportlerOverrides ?? {},
    });
  },

  deleteEinheit: (planId, wocheId, einheitId) => {
    set(mapWoche(planId, wocheId, (einheiten) =>
      einheiten.filter((e) => e.id !== einheitId)
    ));
    supabase.from('einheiten').delete().eq('id', einheitId);
  },

  saveEinheitOverride: (planId, wocheId, einheitId, sportlerId, data) => {
    set(mapWoche(planId, wocheId, (einheiten) =>
      einheiten.map((e) =>
        e.id !== einheitId ? e : {
          ...e,
          sportlerOverrides: { ...(e.sportlerOverrides ?? {}), [sportlerId]: data },
        }
      )
    ));
    const einheit = get().plaene
      .find((p) => p.id === planId)
      ?.wochen.find((w) => w.id === wocheId)
      ?.einheiten.find((e) => e.id === einheitId);
    if (einheit) {
      supabase.from('einheiten').update({
        sportler_overrides: einheit.sportlerOverrides,
      }).eq('id', einheitId);
    }
  },
}));
