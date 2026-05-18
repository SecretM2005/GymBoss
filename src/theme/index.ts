export const C = {
  // Hauptfarben
  primary:    '#1E3A5F',
  primaryMid: '#2C5282',
  primaryLight:'#EBF0F8',
  accent:     '#F97316',
  accentLight:'#FFF0E6',

  // Hintergründe
  bg:         '#F1F5F9',
  card:       '#FFFFFF',
  cardAlt:    '#F8FAFC',

  // Text
  text:       '#0F172A',
  textSub:    '#475569',
  textMuted:  '#94A3B8',

  // Status
  success:    '#16A34A',
  successBg:  '#DCFCE7',
  warning:    '#D97706',
  warningBg:  '#FEF3C7',
  danger:     '#DC2626',
  dangerBg:   '#FEE2E2',

  // Grenzen
  border:     '#E2E8F0',
  borderDark: '#CBD5E1',

  // Weiß/Schwarz
  white:      '#FFFFFF',
  black:      '#000000',
} as const;

export const SP = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  xxl:  24,
  xxxl: 32,
} as const;

export const R = {
  sm:   8,
  md:   12,
  lg:   16,
  xl:   20,
  full: 999,
} as const;

export const FONT = {
  xs:   11,
  sm:   13,
  base: 15,
  md:   17,
  lg:   20,
  xl:   24,
  xxl:  30,
} as const;

export const SHADOW_SM = {
  shadowColor: '#1E3A5F',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.06,
  shadowRadius: 3,
  elevation: 2,
} as const;

export const SHADOW_MD = {
  shadowColor: '#1E3A5F',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.10,
  shadowRadius: 8,
  elevation: 4,
} as const;
