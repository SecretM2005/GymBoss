import React from 'react';
import { View, Text } from 'react-native';
import { avatarColor, C, useColors } from '../theme';

type Props = { name: string; initials: string; size?: number };

export default function GBAvatar({ name, initials, size = 36 }: Props) {
  const C = useColors();
  const bg = avatarColor(name);
  return (
    <View style={{
      width: size, height: size, borderRadius: size / 2,
      backgroundColor: bg,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Text style={{ fontSize: size * 0.34, fontWeight: '700', color: C.accentContrast, letterSpacing: -0.3 }}>
        {initials}
      </Text>
    </View>
  );
}
