import { Platform } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';

// ─── Dark colour system ──────────────────────────────────────────────────────

export const C = {
  // Core backgrounds
  bg:          '#0B0B0D',
  surface:     '#141416',
  surfaceAlt:  '#1C1C20',

  // Borders
  border:       'rgba(255,255,255,0.07)',
  borderStrong: 'rgba(255,255,255,0.14)',

  // Text
  text:      '#F5F5F4',
  textSub:   'rgba(245,245,244,0.55)',
  textMuted: 'rgba(245,245,244,0.55)',
  textDim:   'rgba(245,245,244,0.35)',

  // Accent (electric lime)
  accent:         '#CBFF3E',
  accentDark:     '#7AB300',
  accentContrast: '#0B0B0D',
  accentLight:    'rgba(203,255,62,0.14)',

  // Status colours
  success:   '#7AE582',
  successBg: 'rgba(122,229,130,0.14)',
  good:      '#7AE582',

  warning:   '#FF8A66',
  warningBg: 'rgba(255,138,102,0.16)',
  warn:      '#FF6A3D',

  danger:    '#FF6A3D',
  dangerBg:  'rgba(255,106,61,0.12)',

  // Legacy aliases (keeps existing screens working after theme swap)
  primary:      '#CBFF3E',
  primaryMid:   '#7AB300',
  primaryLight: 'rgba(203,255,62,0.14)',
  card:         '#141416',
  cardAlt:      '#1C1C20',
  white:        '#F5F5F4',
  black:        '#0B0B0D',
} as const;

export const SP = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32 } as const;
export const R  = { sm: 8, md: 14, lg: 18, xl: 22, xxl: 26, full: 999 } as const;
export const FONT = { xs: 11, sm: 13, base: 15, md: 17, lg: 20, xl: 24, xxl: 30 } as const;

export const FONT_MONO = Platform.OS === 'ios' ? 'Menlo' : 'monospace';

export const SHADOW_SM = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.35,
  shadowRadius: 4,
  elevation: 2,
} as const;

export const SHADOW_MD = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 3 },
  shadowOpacity: 0.5,
  shadowRadius: 10,
  elevation: 5,
} as const;

// ─── Training-type chip colours ──────────────────────────────────────────────

export const TYPE_COLORS: Record<string, { bg: string; fg: string; dot: string }> = {
  'Krafttraining I':  { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E', dot: '#CBFF3E' },
  'Krafttraining II': { bg: 'rgba(122,229,130,0.14)', fg: '#7AE582', dot: '#7AE582' },
  'Kampfsport':       { bg: 'rgba(255,106,61,0.16)',  fg: '#FF8A66', dot: '#FF6A3D' },
  'Konditionierung':  { bg: 'rgba(122,191,255,0.14)', fg: '#7ABFFF', dot: '#7ABFFF' },
  'Mobility':         { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF', dot: '#C39CFF' },
  'Krafttraining':    { bg: 'rgba(203,255,62,0.14)',  fg: '#CBFF3E', dot: '#CBFF3E' },
  'Mobilität':        { bg: 'rgba(220,180,255,0.14)', fg: '#D7B5FF', dot: '#C39CFF' },
};

// ─── Light colour system ─────────────────────────────────────────────────────

export const lightC = {
  bg:          '#F4F4F6',
  surface:     '#FFFFFF',
  surfaceAlt:  '#EBEBED',

  border:       'rgba(0,0,0,0.09)',
  borderStrong: 'rgba(0,0,0,0.16)',

  text:      '#0B0B0D',
  textSub:   'rgba(11,11,13,0.60)',
  textMuted: 'rgba(11,11,13,0.50)',
  textDim:   'rgba(11,11,13,0.35)',

  accent:         '#7AB300',
  accentDark:     '#5A8500',
  accentContrast: '#FFFFFF',
  accentLight:    'rgba(122,179,0,0.12)',

  success:   '#3D8B44',
  successBg: 'rgba(61,139,68,0.12)',
  good:      '#3D8B44',

  warning:   '#C0522A',
  warningBg: 'rgba(192,82,42,0.12)',
  warn:      '#C0522A',

  danger:    '#C0522A',
  dangerBg:  'rgba(192,82,42,0.10)',

  primary:      '#7AB300',
  primaryMid:   '#5A8500',
  primaryLight: 'rgba(122,179,0,0.12)',
  card:         '#FFFFFF',
  cardAlt:      '#EBEBED',
  white:        '#FFFFFF',
  black:        '#0B0B0D',
} as const;

export function useColors(): typeof C {
  const theme = useSettingsStore((s) => s.theme);
  return theme === 'light' ? (lightC as unknown as typeof C) : C;
}

export function getTypeColor(typ: string) {
  const key = Object.keys(TYPE_COLORS).find((k) => typ === k || typ.startsWith(k));
  return key ? TYPE_COLORS[key] : { bg: 'rgba(255,255,255,0.08)', fg: C.textMuted, dot: C.textMuted };
}

// ─── Avatar colour palette ───────────────────────────────────────────────────

export const AVATAR_COLORS = ['#CBFF3E', '#FF8A66', '#7ABFFF', '#D7B5FF', '#7AE582', '#FFD166'];

export function avatarColor(name: string): string {
  return AVATAR_COLORS[(name?.charCodeAt(0) ?? 0) % AVATAR_COLORS.length];
}
