import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withRepeat, withSequence, withTiming, Easing,
} from 'react-native-reanimated';
import { useColors, SP, R, FONT } from '../theme';

type Props = {
  streak: number;
  freezeAvailable: boolean;
  onFreeze?: () => void;
  compact?: boolean;
};

export function StreakWidget({ streak, freezeAvailable, onFreeze, compact = false }: Props) {
  const C = useColors();
  const scale = useSharedValue(1);

  const isHot = streak >= 7;
  const isLegendary = streak >= 30;
  const flameColor = isLegendary ? '#FFD700' : isHot ? '#FF8C00' : C.textMuted;

  useEffect(() => {
    if (isHot) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.15, { duration: 600, easing: Easing.ease }),
          withTiming(1.0,  { duration: 600, easing: Easing.ease }),
        ),
        -1,
        false,
      );
    } else {
      scale.value = 1;
    }
  }, [isHot]);

  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (compact) {
    return (
      <View style={s.compact}>
        <Animated.View style={animStyle}>
          <Text style={[s.compactFlame, { color: flameColor }]}>🔥</Text>
        </Animated.View>
        <Text style={[s.compactCount, { color: streak > 0 ? C.text : C.textDim }]}>{streak}</Text>
      </View>
    );
  }

  return (
    <View style={[s.card, { backgroundColor: C.surface, borderColor: isHot ? flameColor + '40' : C.border }]}>
      <Animated.View style={[s.flameBox, animStyle]}>
        <Text style={[s.flame, { color: flameColor }]}>🔥</Text>
      </Animated.View>
      <View style={{ flex: 1 }}>
        <Text style={[s.count, { color: streak > 0 ? C.text : C.textDim }]}>
          {streak} {streak === 1 ? 'Tag' : 'Tage'} Streak
        </Text>
        <Text style={[s.sub, { color: C.textDim }]}>
          {isLegendary ? '🏅 Legendär!' : isHot ? '🔥 Auf Feuer!' : streak > 0 ? 'Weiter so!' : 'Noch kein Streak'}
        </Text>
      </View>
      {freezeAvailable && streak > 0 && onFreeze && (
        <TouchableOpacity style={[s.freezeBtn, { borderColor: C.border }]} onPress={onFreeze} activeOpacity={0.7}>
          <Text style={[s.freezeText, { color: C.textMuted }]}>❄️ Freeze</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: SP.md, borderRadius: R.xl, borderWidth: 1, padding: SP.md },
  flameBox:  { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  flame:     { fontSize: 28 },
  count:     { fontSize: FONT.md, fontWeight: '700' },
  sub:       { fontSize: FONT.xs, marginTop: 2 },
  freezeBtn: { paddingHorizontal: SP.sm, paddingVertical: SP.xs, borderRadius: R.full, borderWidth: 1 },
  freezeText:{ fontSize: FONT.xs, fontWeight: '600' },
  compact:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactFlame: { fontSize: 16 },
  compactCount: { fontSize: FONT.sm, fontWeight: '700' },
});
