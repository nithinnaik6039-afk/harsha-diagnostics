export type ThemeMode = 'midnight' | 'ocean' | 'emerald' | 'day';

export interface ThemeColors {
  mode: ThemeMode;
  bg: string;
  cardBg: string;
  cardBorder: string;
  surface: string;
  primary: string;
  primaryGlow: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  headerBg: string;
}

export const themes: Record<ThemeMode, ThemeColors> = {
  midnight: {
    mode: 'midnight',
    bg: '#020617',
    cardBg: '#0f172a',
    cardBorder: '#1e293b',
    surface: '#1e293b',
    primary: '#10b981',
    primaryGlow: '#34d399',
    accent: '#38bdf8',
    textPrimary: '#ffffff',
    textSecondary: '#cbd5e1',
    textMuted: '#64748b',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    headerBg: '#020617',
  },
  ocean: {
    mode: 'ocean',
    bg: '#020e1f',
    cardBg: '#061b36',
    cardBorder: '#0e315e',
    surface: '#0d386b',
    primary: '#0284c7',
    primaryGlow: '#60a5fa',
    accent: '#38bdf8',
    textPrimary: '#ffffff',
    textSecondary: '#bfdbfe',
    textMuted: '#60a5fa',
    success: '#34d399',
    warning: '#fbbf24',
    danger: '#f87171',
    headerBg: '#010914',
  },
  emerald: {
    mode: 'emerald',
    bg: '#02140f',
    cardBg: '#052920',
    cardBorder: '#0b4737',
    surface: '#0f5c47',
    primary: '#059669',
    primaryGlow: '#34d399',
    accent: '#10b981',
    textPrimary: '#ffffff',
    textSecondary: '#a7f3d0',
    textMuted: '#6ee7b7',
    success: '#10b981',
    warning: '#fbbf24',
    danger: '#f87171',
    headerBg: '#010a08',
  },
  day: {
    mode: 'day',
    bg: '#f8fafc',
    cardBg: '#ffffff',
    cardBorder: '#e2e8f0',
    surface: '#f1f5f9',
    primary: '#059669',
    primaryGlow: '#10b981',
    accent: '#0284c7',
    textPrimary: '#0f172a',
    textSecondary: '#334155',
    textMuted: '#64748b',
    success: '#059669',
    warning: '#d97706',
    danger: '#dc2626',
    headerBg: '#ffffff',
  },
};

export const Colors = {
  light: {
    text: '#11181C',
    textSecondary: '#64748b',
    background: '#fff',
    backgroundElement: '#f1f5f9',
    backgroundSelected: '#e2e8f0',
    tint: '#0a7ea4',
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: '#0a7ea4',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#94a3b8',
    background: '#151718',
    backgroundElement: '#1e293b',
    backgroundSelected: '#334155',
    tint: '#fff',
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: '#fff',
  },
};

export type ThemeColor = keyof typeof Colors.light;

export const Spacing = {
  half: 4,
  one: 8,
  two: 16,
  three: 24,
  four: 32,
  five: 40,
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const Fonts = {
  regular: 'System',
  medium: 'System',
  bold: 'System',
  mono: 'Courier',
};

export const MaxContentWidth = 1200;
