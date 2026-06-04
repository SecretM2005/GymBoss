import { create } from 'zustand';
import { Badge, BadgeAssignment, Challenge, StreakData, SystemBadgeId, WorkoutFeedback, Einheit, TrainingsPlan } from '../types';
import { uid } from '../lib/supabase';
import { isDetailedFeedback, calculateStreak, overallComplianceRate } from '../utils/compliance';

// ── System badge catalogue ────────────────────────────────────────────────────
export const SYSTEM_BADGES: Record<SystemBadgeId, Badge> = {
  first_step:    { id: 'first_step',    name: 'Erster Schritt',    emoji: '🎯', description: 'Erste geplante Einheit absolviert',             type: 'system' },
  perfect_week:  { id: 'perfect_week',  name: 'Perfekte Woche',    emoji: '⚡', description: 'Alle Einheiten einer Woche absolviert',          type: 'system' },
  reliable:      { id: 'reliable',      name: 'Zuverlässig',       emoji: '📅', description: '4 Wochen in Folge Plan erfüllt',                 type: 'system' },
  plan_done:     { id: 'plan_done',     name: 'Plan abgeschlossen', emoji: '🏆', description: 'Einen kompletten Trainingsplan durchgezogen',    type: 'system' },
  communicator:  { id: 'communicator',  name: 'Kommunikator',      emoji: '💬', description: '10× detailliertes Feedback gegeben',             type: 'system' },
  analyst:       { id: 'analyst',       name: 'Analytiker',        emoji: '🔍', description: '30× Feedback mit ausführlicher Notiz gegeben',   type: 'system' },
};

// ── Computed badge checks ─────────────────────────────────────────────────────
function checkSystemBadges(
  logs: WorkoutFeedback[],
  einheiten: Einheit[],
  plaene: TrainingsPlan[],
  athleteId: string,
): SystemBadgeId[] {
  const earned: SystemBadgeId[] = [];
  const completed = logs.filter((l) => l.abgeschlossen && einheiten.some((e) => e.id === l.workoutId));

  if (completed.length >= 1) earned.push('first_step');

  const detailed = logs.filter(isDetailedFeedback);
  if (detailed.length >= 10) earned.push('communicator');
  if (detailed.length >= 30) earned.push('analyst');

  // Perfect week: any week where all planned einheiten were completed
  const byWeek = new Map<string, { planned: number; completed: number }>();
  einheiten.forEach((e) => {
    if (!e.datum) return;
    const d = new Date(e.datum);
    const dow = (d.getDay() + 6) % 7;
    const monday = new Date(d.getTime() - dow * 86400000);
    const key = monday.toISOString().split('T')[0];
    const entry = byWeek.get(key) ?? { planned: 0, completed: 0 };
    entry.planned++;
    if (logs.some((l) => l.workoutId === e.id && l.abgeschlossen)) entry.completed++;
    byWeek.set(key, entry);
  });

  const hasPerfectWeek = [...byWeek.values()].some((w) => w.planned > 0 && w.completed === w.planned);
  if (hasPerfectWeek) earned.push('perfect_week');

  // Reliable: 4 consecutive weeks with >= 80% compliance
  const sortedWeeks = [...byWeek.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  let consecutive = 0;
  for (const [, w] of sortedWeeks) {
    if (w.planned > 0 && w.completed / w.planned >= 0.8) {
      consecutive++;
      if (consecutive >= 4) { earned.push('reliable'); break; }
    } else {
      consecutive = 0;
    }
  }

  // Plan done: all einheiten of any plan completed
  const planDone = plaene
    .filter((p) => p.sportlerIds.includes(athleteId))
    .some((p) => {
      const planEinheiten = p.wochen.flatMap((w) => w.einheiten);
      return planEinheiten.length > 0 &&
        planEinheiten.every((e) => logs.some((l) => l.workoutId === e.id && l.abgeschlossen));
    });
  if (planDone) earned.push('plan_done');

  return earned;
}

// ── Store ─────────────────────────────────────────────────────────────────────
type GamificationState = {
  customBadges: Badge[];
  assignments: BadgeAssignment[];
  challenges: Challenge[];
  streaks: Record<string, StreakData>;

  reset: () => void;
  getEarnedBadges: (athleteId: string, logs: WorkoutFeedback[], einheiten: Einheit[], plaene: TrainingsPlan[]) => Badge[];
  getStreak: (athleteId: string, logs: WorkoutFeedback[], einheiten: Einheit[]) => StreakData;
  useFreeze: (athleteId: string) => void;
  addCustomBadge: (badge: Omit<Badge, 'id' | 'type'>) => Badge;
  awardBadge: (athleteId: string, badgeId: string, awardedBy: string) => void;
  revokeBadge: (assignmentId: string) => void;
  addChallenge: (c: Omit<Challenge, 'id' | 'completedBy'>) => Challenge;
  completeChallenge: (challengeId: string, athleteId: string) => void;
  getChallengesForAthlete: (athleteId: string) => Challenge[];
  getTrainerScore: (allAthletes: string[], logsByAthlete: Record<string, WorkoutFeedback[]>, einheitenByAthlete: Record<string, Einheit[]>) => number;
};

const currentMonth = () => new Date().toISOString().slice(0, 7);

export const useGamificationStore = create<GamificationState>((set, get) => ({
  customBadges: [],
  assignments: [],
  challenges: [],
  streaks: {},

  reset: () => set({ customBadges: [], assignments: [], challenges: [], streaks: {} }),

  getEarnedBadges: (athleteId, logs, einheiten, plaene) => {
    const systemIds = checkSystemBadges(logs, einheiten, plaene, athleteId);
    const systemBadges = systemIds.map((id) => SYSTEM_BADGES[id]);
    const customAssigned = get().assignments
      .filter((a) => a.athleteId === athleteId)
      .map((a) => {
        const cb = get().customBadges.find((b) => b.id === a.badgeId);
        const sb = Object.values(SYSTEM_BADGES).find((b) => b.id === a.badgeId);
        return cb ?? sb;
      })
      .filter((b): b is Badge => !!b);
    // merge, deduplicate
    const seen = new Set(systemBadges.map((b) => b.id));
    for (const b of customAssigned) {
      if (!seen.has(b.id)) { seen.add(b.id); systemBadges.push(b); }
    }
    return systemBadges;
  },

  getStreak: (athleteId, logs, einheiten) => {
    const existing = get().streaks[athleteId];
    const current = calculateStreak(logs, einheiten);
    const longest = Math.max(current, existing?.longest ?? 0);
    const lastActivityDate = logs
      .filter((l) => l.abgeschlossen && einheiten.some((e) => e.id === l.workoutId))
      .map((l) => l.datum.split('T')[0])
      .sort()
      .at(-1) ?? null;
    const month = currentMonth();
    return {
      current,
      longest,
      freezeAvailable: existing?.freezeUsedDate !== month,
      freezeUsedDate: existing?.freezeUsedDate ?? null,
      lastActivityDate,
    };
  },

  useFreeze: (athleteId) => {
    set((s) => ({
      streaks: {
        ...s.streaks,
        [athleteId]: {
          ...(s.streaks[athleteId] ?? { current: 0, longest: 0, lastActivityDate: null }),
          freezeAvailable: false,
          freezeUsedDate: currentMonth(),
        },
      },
    }));
  },

  addCustomBadge: (badge) => {
    const newBadge: Badge = { ...badge, id: uid(), type: 'custom' };
    set((s) => ({ customBadges: [...s.customBadges, newBadge] }));
    return newBadge;
  },

  awardBadge: (athleteId, badgeId, awardedBy) => {
    const already = get().assignments.some(
      (a) => a.athleteId === athleteId && a.badgeId === badgeId,
    );
    if (already) return;
    const assignment: BadgeAssignment = {
      id: uid(),
      badgeId,
      athleteId,
      awardedAt: new Date().toISOString().split('T')[0],
      awardedBy,
    };
    set((s) => ({ assignments: [...s.assignments, assignment] }));
  },

  revokeBadge: (assignmentId) => {
    set((s) => ({ assignments: s.assignments.filter((a) => a.id !== assignmentId) }));
  },

  addChallenge: (c) => {
    const challenge: Challenge = { ...c, id: uid(), completedBy: [] };
    set((s) => ({ challenges: [...s.challenges, challenge] }));
    return challenge;
  },

  completeChallenge: (challengeId, athleteId) => {
    set((s) => ({
      challenges: s.challenges.map((c) =>
        c.id === challengeId && !c.completedBy.includes(athleteId)
          ? { ...c, completedBy: [...c.completedBy, athleteId] }
          : c,
      ),
    }));
  },

  getChallengesForAthlete: (athleteId) => {
    return get().challenges.filter(
      (c) => c.athleteIds.length === 0 || c.athleteIds.includes(athleteId),
    );
  },

  getTrainerScore: (allAthletes, logsByAthlete, einheitenByAthlete) => {
    if (allAthletes.length === 0) return 0;
    let totalCompliance = 0;
    let totalRating = 0;
    let totalRatingCount = 0;

    for (const id of allAthletes) {
      const logs = logsByAthlete[id] ?? [];
      const einheiten = einheitenByAthlete[id] ?? [];
      totalCompliance += overallComplianceRate(logs, einheiten);
      const rated = logs.filter((l) => l.bewertung > 0);
      if (rated.length > 0) {
        totalRating += rated.reduce((s, l) => s + l.bewertung, 0) / rated.length;
        totalRatingCount++;
      }
    }

    const avgCompliance = totalCompliance / allAthletes.length;
    const avgRating = totalRatingCount > 0 ? totalRating / totalRatingCount : 0;
    const athleteCount = Math.min(allAthletes.length / 10, 1);

    return Math.round(avgCompliance * 50 + (avgRating / 5) * 30 + athleteCount * 20);
  },
}));
