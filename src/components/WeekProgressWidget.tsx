import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withSpring,
} from 'react-native-reanimated';
import { useColors, SP, R, FONT } from '../theme';

type Props = {
  completed: number;
  total: number;
  weekLabel?: string;
  planProgress?: { currentWeek: number; totalWeeks: number };
};

export function WeekProgressWidget({ completed, total, weekLabel, planProgress }: Props) {
  const C = useColors();
  const allDone = total > 0 && completed >= total;
  const pct = total > 0 ? completed / total : 0;
  const width = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    width.value = withTiming(pct, { duration: 600 });
    opacity.value = withTiming(1, { duration: 400 });
  }, [pct]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${width.value * 100}%` as any,
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[containerStyle, styles.root, { backgroundColor: C.surface, borderColor: allDone ? 'rgba(203,255,62,0.4)' : C.border }]}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.title, { color: C.text }]}>
            {allDone ? '🎉 Woche abgeschlossen!' : `${completed} von ${total} Einheiten`}
            {weekLabel ? ` – ${weekLabel}` : ''}
          </Text>
          {planProgress && (
            <Text style={[styles.sub, { color: C.textMuted }]}>
              Woche {planProgress.currentWeek} von {planProgress.totalWeeks} · {Math.round((planProgress.currentWeek / planProgress.totalWeeks) * 100)}% des Plans
            </Text>
          )}
        </View>
        <Text style={[styles.fraction, { color: allDone ? C.accent : C.textMuted }]}>
          {completed}/{total}
        </Text>
      </View>
      <View style={[styles.track, { backgroundColor: C.surfaceAlt }]}>
        <Animated.View style={[styles.fill, barStyle, { backgroundColor: allDone ? C.accent : '#7ABFFF' }]} />
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root:     { borderRadius: R.xl, borderWidth: 1, padding: SP.md, gap: SP.sm },
  header:   { flexDirection: 'row', alignItems: 'center', gap: SP.sm },
  title:    { fontSize: FONT.sm, fontWeight: '700' },
  sub:      { fontSize: FONT.xs, marginTop: 2 },
  fraction: { fontSize: FONT.md, fontWeight: '800' },
  track:    { height: 6, borderRadius: 3, overflow: 'hidden' },
  fill:     { height: 6, borderRadius: 3 },
});
