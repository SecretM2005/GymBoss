import React from 'react';
import { View, Text } from 'react-native';
import { getTypeColor } from '../theme';

type Props = { typ: string; size?: 'sm' | 'md' };

export default function TypeChip({ typ, size = 'sm' }: Props) {
  const c = getTypeColor(typ);
  const pad = size === 'sm' ? { paddingHorizontal: 8, paddingVertical: 3 } : { paddingHorizontal: 11, paddingVertical: 5 };
  const fs = size === 'sm' ? 10 : 11.5;
  return (
    <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: c.bg }, pad]}>
      <View style={{ width: 5, height: 5, borderRadius: 999, backgroundColor: c.dot }} />
      <Text style={{ fontSize: fs, fontWeight: '600', color: c.fg, letterSpacing: 0.2, textTransform: 'uppercase' }}>
        {typ}
      </Text>
    </View>
  );
}
