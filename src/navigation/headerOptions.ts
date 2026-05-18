import { StackNavigationOptions } from '@react-navigation/stack';
import { C, FONT } from '../theme';

export const HEADER_OPTIONS: StackNavigationOptions = {
  headerStyle: { backgroundColor: C.surface },
  headerTitleStyle: { color: C.text, fontWeight: '700', fontSize: FONT.base },
  headerTintColor: C.accent,
  headerShadowVisible: false,
  headerBackTitle: '',
};
