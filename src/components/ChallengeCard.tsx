import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Challenge } from '../types';
import { useColors, SP, R, FONT } from '../theme';
import { GBIcon } from './GBIcon';

type Props = {
  challenge: Challenge;
  athleteId: string;
  progress?: number; // 0-1
};

export function ChallengeCard({ challenge, athleteId, progress = 0 }: Props) {
  const C = useColors();
  const done = challenge.completedBy.includes(athleteId);
  const today = new Date().toISOString().split('T')[0];
  const expired = challenge.endDate < today && !done;

  return (
    <View style={[s.card, { backgroundColor: C.surface, borderColor: done ? 'rgba(203,255,62,0.4)' : C.border }]}>
      <View style={s.header}>
        <GBIcon name="bolt" size={16} color={done ? C.accent : '#7ABFFF'} />
        <Text style={[s.title, { color: C.text }]} numberOfLines={1}>{challenge.title}</Text>
        {done && <Text style={[s.donePill, { color: C.accent }]}>✓</Text>}
        {expired && !done && <Text style={[s.expiredPill, { color: C.warn }]}>Abgelaufen</Text>}
      </View>
      <Text style={[s.desc, { color: C.textMuted }]} numberOfLines={2}>{challenge.description}</Text>
      <View style={[s.track, { backgroundColor: C.surfaceAlt }]}>
        <View style={[s.fill, { width: `${Math.round(progress * 100)}%` as any, backgroundColor: done ? C.accent : '#7ABFFF' }]} />
      </View>
      <Text style={[s.dates, { color: C.textDim }]}>
        {challenge.startDate} – {challenge.endDate}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  card:     { borderRadius: R.xl, borderWidth: 1, padding: SP.md, gap: SP.sm },
  header:   { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  title:    { flex: 1, fontSize: FONT.sm, fontWeight: '700' },
  desc:     { fontSize: FONT.xs, lineHeight: 18 },
  track:    { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill:     { height: 4, borderRadius: 2 },
  dates:    { fontSize: 10, fontWeight: '600' },
  donePill: { fontSize: FONT.sm, fontWeight: '800' },
  expiredPill: { fontSize: 10, fontWeight: '700' },
});
