import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { C } from '../theme';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// Design icon name → Ionicons name
const MAP: Record<string, IoniconsName> = {
  plus:         'add-outline',
  check:        'checkmark-outline',
  chevronLeft:  'chevron-back-outline',
  chevronRight: 'chevron-forward-outline',
  chevronDown:  'chevron-down-outline',
  dumbbell:     'barbell-outline',
  user:         'person-outline',
  users:        'people-outline',
  calendar:     'calendar-outline',
  clock:        'time-outline',
  edit:         'pencil-outline',
  trash:        'trash-outline',
  drag:         'reorder-three-outline',
  star:         'star-outline',
  starFill:     'star',
  fire:         'flame-outline',
  timer:        'timer-outline',
  settings:     'settings-outline',
  home:         'home-outline',
  search:       'search-outline',
  arrowRight:   'arrow-forward-outline',
  arrowLeft:    'arrow-back-outline',
  close:        'close-outline',
  play:         'play',
  bolt:         'flash-outline',
  list:         'list-outline',
  layers:       'layers-outline',
  repeat:       'repeat-outline',
  flag:         'flag-outline',
  stopwatch:    'stopwatch-outline',
  book:         'book-outline',
  globe:        'globe-outline',
  moon:         'moon-outline',
  sun:          'sunny-outline',
  camera:       'camera-outline',
  image:        'image-outline',
  document:     'document-outline',
  upload:       'cloud-upload-outline',
  barChart:     'bar-chart-outline',
  message:      'chatbubble-ellipses-outline',
  bell:         'notifications-outline',
  heart:        'heart-outline',
  info:         'information-circle-outline',
  filter:       'funnel-outline',
  body:         'body-outline',
  copy:         'copy-outline',
  share:        'share-outline',
  logOut:       'log-out-outline',
};

type Props = {
  name: keyof typeof MAP;
  size?: number;
  color?: string;
};

export function GBIcon({ name, size = 22, color = C.text }: Props) {
  return <Ionicons name={MAP[name] ?? 'help-outline'} size={size} color={color} />;
}

type IconBtnProps = {
  name: keyof typeof MAP;
  size?: number;
  active?: boolean;
  color?: string;
  onPress?: () => void;
};

export function IconBtn({ name, size = 36, active = false, color, onPress }: IconBtnProps) {
  const iconColor = color ?? (active ? C.accentContrast : C.text);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: active ? C.accent : 'rgba(255,255,255,0.06)',
        alignItems: 'center', justifyContent: 'center',
      }}
    >
      <Ionicons name={MAP[name] ?? 'help-outline'} size={size * 0.48} color={iconColor} />
    </TouchableOpacity>
  );
}
