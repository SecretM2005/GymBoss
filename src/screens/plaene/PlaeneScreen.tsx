import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C, FONT, SP } from '../../theme';
import { GBIcon } from '../../components/GBIcon';

export default function PlaeneScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.root, { paddingTop: insets.top + 16 }]}>
      <GBIcon name="dumbbell" size={40} color={C.textDim} />
      <Text style={styles.title}>Trainingspläne</Text>
      <Text style={styles.sub}>Kommt bald</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: SP.sm },
  title: { fontSize: FONT.xl, fontWeight: '700', color: C.text, letterSpacing: -0.5 },
  sub: { fontSize: FONT.base, color: C.textDim },
});
