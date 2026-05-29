import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, useColors, FONT, SP } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

export default function PlaeneScreen() {
  const insets = useSafeAreaInsets();
  const C = useColors();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, backgroundColor: C.bg }]}>
      <GBIcon name="dumbbell" size={40} color={C.textDim} />
      <Text style={[styles.title, { color: C.text }]}>Trainingspläne</Text>
      <Text style={[styles.sub, { color: C.textDim }]}>Kommt bald</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, alignItems: 'center', justifyContent: 'center', gap: SP.sm },
  title: { fontSize: FONT.xl, fontWeight: '700', letterSpacing: -0.5 },
  sub:   { fontSize: FONT.base },
});
