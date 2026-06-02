import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useColors, SP, R, FONT } from '../theme';
import { getComplianceColor, getComplianceLabel } from '../utils/compliance';

type Props = {
  rate: number;       // 0-1
  label?: string;
  showLabel?: boolean;
  height?: number;
};

export function ComplianceMeter({ rate, label, showLabel = true, height = 8 }: Props) {
  const C = useColors();
  const color = getComplianceColor(rate);
  const pct = Math.round(rate * 100);

  return (
    <View style={s.root}>
      {showLabel && (
        <View style={s.row}>
          <Text style={[s.label, { color: C.textMuted }]}>{label ?? getComplianceLabel(rate)}</Text>
          <Text style={[s.pct, { color }]}>{pct}%</Text>
        </View>
      )}
      <View style={[s.track, { backgroundColor: C.surfaceAlt, height }]}>
        <View style={[s.fill, { width: `${pct}%` as any, backgroundColor: color, height }]} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  root:  { gap: 4 },
  row:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  label: { fontSize: FONT.xs, fontWeight: '600' },
  pct:   { fontSize: FONT.sm, fontWeight: '800' },
  track: { borderRadius: 4, overflow: 'hidden' },
  fill:  { borderRadius: 4 },
});
