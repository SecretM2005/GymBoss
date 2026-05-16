import React from 'react';
import { View, StyleSheet, ViewProps } from 'react-native';

type CardProps = ViewProps & {
  children: React.ReactNode;
  padding?: number;
};

export default function Card({ children, padding = 16, style, ...props }: CardProps) {
  return (
    <View style={[styles.card, { padding }, style]} {...props}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
});
