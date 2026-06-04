import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue, useAnimatedStyle,
  withTiming, withDelay, Easing,
} from 'react-native-reanimated';

const { width: W, height: H } = Dimensions.get('window');
const COLORS = ['#CBFF3E','#7ABFFF','#FF8A66','#D7B5FF','#FFD700','#4ADE80','#F87171','#FACC15'];
const N = 30;

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a);
}

const PIECES = Array.from({ length: N }, (_, i) => ({
  id: i,
  x:  randomBetween(0, W - 12),
  size: randomBetween(6, 14),
  color: COLORS[i % COLORS.length],
  delay: randomBetween(0, 600),
  duration: randomBetween(1800, 3200),
  rotation: randomBetween(0, 360),
}));

type Props = {
  visible: boolean;
  onDone?: () => void;
};

function Piece({ x, size, color, delay, duration, rotation, onDone }: typeof PIECES[0] & { onDone?: () => void }) {
  const y    = useSharedValue(-20);
  const rot  = useSharedValue(rotation);
  const opac = useSharedValue(1);

  useEffect(() => {
    y.value    = withDelay(delay, withTiming(H + 20, { duration, easing: Easing.linear }));
    rot.value  = withDelay(delay, withTiming(rotation + 720, { duration }));
    opac.value = withDelay(delay + duration * 0.7, withTiming(0, { duration: duration * 0.3 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }, { rotate: `${rot.value}deg` }],
    opacity: opac.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFillObject, style, {
      left: x, top: 0, width: size, height: size,
      backgroundColor: color, borderRadius: size / 4,
    }]} />
  );
}

export function ConfettiView({ visible, onDone }: Props) {
  if (!visible) return null;
  return (
    <>
      {PIECES.map((p) => <Piece key={p.id} {...p} onDone={p.id === N - 1 ? onDone : undefined} />)}
    </>
  );
}
