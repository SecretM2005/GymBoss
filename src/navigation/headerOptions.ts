import { StackNavigationOptions } from '@react-navigation/stack';
import { C, FONT } from '../theme';

export const HEADER_OPTIONS: StackNavigationOptions = {
  headerStyle: { backgroundColor: C.primary },
  headerTitleStyle: { color: C.white, fontWeight: '700', fontSize: FONT.base },
  headerTintColor: C.white,
  headerShadowVisible: false,
  headerBackTitle: '',
};
