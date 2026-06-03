import { WorkoutFeedback, Einheit, TrainingsPlan, ComplianceWeek } from '../types';

/** Returns the ISO week number of a date */
function isoWeekNumber(d: Date): number {
  const date = new Date(d);
  date.setHours(0,0,0,0);
  date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7));
  const week1 = new Date(date.getFullYear(), 0, 4);
  return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/** Returns Monday date of the week containing d */
function getMondayOf(d: Date): Date {
  const result = new Date(d);
  result.setHours(0,0,0,0);
  result.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return result;
}

/** Collect all planned einheiten from all plans for an athlete */
export function getPlannedEinheiten(
  plaene: TrainingsPlan[],
  athleteId: string,
): Einheit[] {
  return plaene
    .filter((p) => p.sportlerIds.includes(athleteId))
    .flatMap((p) => p.wochen.flatMap((w) => w.einheiten));
}

/** Compliance rate (0–1) for a set of weeks back from today */
export function calculateWeeklyCompliance(
  logs: WorkoutFeedback[],
  einheiten: Einheit[],
  weeksBack: number = 4,
): ComplianceWeek[] {
  const now = new Date();
  const result: ComplianceWeek[] = [];

  for (let w = weeksBack - 1; w >= 0; w--) {
    const monday = getMondayOf(new Date(now.getTime() - w * 7 * 86400000));
    const sunday = new Date(monday.getTime() + 6 * 86400000);
    sunday.setHours(23,59,59,999);

    const planned = einheiten.filter((e) => {
      if (!e.datum) return false;
      const d = new Date(e.datum);
      return d >= monday && d <= sunday;
    });

    const completed = planned.filter((e) =>
      logs.some((l) => l.workoutId === e.id && l.abgeschlossen),
    );

    const kw = isoWeekNumber(monday);
    result.push({
      label: `KW ${kw}`,
      planned: planned.length,
      completed: completed.length,
      rate: planned.length > 0 ? completed.length / planned.length : 0,
    });
  }

  return result;
}

export function overallComplianceRate(
  logs: WorkoutFeedback[],
  einheiten: Einheit[],
): number {
  if (einheiten.length === 0) return 0;
  const done = einheiten.filter((e) =>
    logs.some((l) => l.workoutId === e.id && l.abgeschlossen),
  ).length;
  return done / einheiten.length;
}

export function getComplianceColor(rate: number): string {
  if (rate >= 0.8) return '#4ADE80';
  if (rate >= 0.5) return '#FACC15';
  return '#F87171';
}

export function getComplianceLabel(rate: number): string {
  if (rate >= 0.8) return 'Sehr gut';
  if (rate >= 0.5) return 'Okay';
  return 'Verbesserungsbedarf';
}

/** Returns current streak in consecutive days with completed planned sessions */
export function calculateStreak(
  logs: WorkoutFeedback[],
  einheiten: Einheit[],
): number {
  const completedDates = new Set(
    logs
      .filter((l) => l.abgeschlossen && einheiten.some((e) => e.id === l.workoutId))
      .map((l) => l.datum.split('T')[0]),
  );

  let streak = 0;
  const today = new Date();
  for (let i = 0; i <= 365; i++) {
    const d = new Date(today.getTime() - i * 86400000);
    const iso = d.toISOString().split('T')[0];
    if (completedDates.has(iso)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

/** Feedback is "detailed" when RPE > 0 and note >= 20 chars */
export function isDetailedFeedback(log: WorkoutFeedback): boolean {
  return log.rpe > 0 && (log.notiz?.trim().length ?? 0) >= 20;
}
