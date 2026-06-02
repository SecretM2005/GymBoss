import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Badge } from '../types';
import { useColors, SP, R, FONT } from '../theme';

type Props = {
  badges: Badge[];
  maxVisible?: number;
  horizontal?: boolean;
};

export function BadgeGrid({ badges, horizontal = true }: Props) {
  const C = useColors();
  if (badges.length === 0) return null;

  const content = badges.map((b) => (
    <View key={b.id} style={[s.badge, { backgroundColor: C.surface, borderColor: C.border }]}>
      <Text style={s.emoji}>{b.emoji}</Text>
      <Text style={[s.name, { color: C.text }]} numberOfLines={1}>{b.name}</Text>
    </View>
  ));

  if (horizontal) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.row}>
        {content}
      </ScrollView>
    );
  }

  return <View style={s.grid}>{content}</View>;
}

const s = StyleSheet.create({
  row:   { flexDirection: 'row', gap: SP.sm, paddingHorizontal: SP.xl },
  grid:  { flexDirection: 'row', flexWrap: 'wrap', gap: SP.sm },
  badge: { alignItems: 'center', gap: 4, borderRadius: R.lg, borderWidth: 1, padding: SP.sm, minWidth: 72 },
  emoji: { fontSize: 22 },
  name:  { fontSize: 10, fontWeight: '700', textAlign: 'center', maxWidth: 68 },
});
