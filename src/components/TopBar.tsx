import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, useColors, FONT, SP } from '../theme';

type Props = {
  title: string;
  subtitle?: string;
  large?: boolean;
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export default function TopBar({ title, subtitle, large = false, leading, trailing }: Props) {
  const C = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 20);

  return (
    <View style={[styles.container, { paddingTop: topPad, backgroundColor: C.bg }]}>
      <View style={styles.row}>
        <View style={styles.side}>{leading}</View>
        {!large && (
          <Text style={[styles.centerTitle, { color: C.text }]} numberOfLines={1}>{title}</Text>
        )}
        <View style={[styles.side, styles.trailingSide]}>{trailing}</View>
      </View>
      {large && (
        <View style={styles.largeBlock}>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: C.textMuted }]}>{subtitle}</Text>
          ) : null}
          <Text style={[styles.bigTitle, { color: C.text }]}>{title}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: C.bg,
    paddingHorizontal: SP.xl,
    paddingBottom: SP.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 44,
  },
  side: { minWidth: 44, alignItems: 'flex-start' },
  trailingSide: { alignItems: 'flex-end' },
  centerTitle: {
    position: 'absolute',
    left: 0, right: 0,
    textAlign: 'center',
    fontSize: FONT.base,
    fontWeight: '600',
    color: C.text,
  },
  largeBlock: { marginTop: SP.md, gap: 4 },
  subtitle: {
    fontSize: FONT.xs,
    fontWeight: '700',
    color: C.textMuted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  bigTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: C.text,
    letterSpacing: -0.8,
    lineHeight: 36,
  },
});
