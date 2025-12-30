/**
 * Application Constants - Dark Mode Theme
 */

export const API_CONFIG = {
  // Update this URL based on your setup:
  // - Android Emulator: http://10.0.2.2:8000/api
  // - iOS Simulator: http://localhost:8000/api  
  // - Physical Device: http://YOUR_LOCAL_IP:8000/api
  BASE_URL: 'http://localhost:8000/api',
  TIMEOUT: 300000,
  POLL_INTERVAL: 2000,
  ENDPOINTS: {
    HEALTH: '/health',
    USERS: '/users',
    NOTES: '/notes',
    SUMMARIES: '/summaries',
  },
};

export const STORAGE_KEYS = {
  GUEST_ID: '@ainotes/guest_id',
  USER_DATA: '@ainotes/user_data',
  NOTES_CACHE: '@ainotes/notes_cache',
  SETTINGS: '@ainotes/settings',
};

// Dark Mode Color Palette
export const COLORS = {
  // Primary brand colors
  primary: '#6366F1',      // Indigo
  primaryDark: '#4F46E5',
  primaryLight: '#818CF8',
  accent: '#22D3EE',       // Cyan accent
  
  // Dark backgrounds
  background: '#0F0F14',   // Deep dark
  surface: '#1A1A24',      // Card background
  surfaceLight: '#252532', // Elevated surface
  surfaceHighlight: '#2D2D3D', // Hover/active states
  
  // Text colors
  text: '#F8FAFC',         // Primary text
  textSecondary: '#94A3B8', // Secondary text
  textMuted: '#64748B',    // Muted text
  textInverse: '#0F0F14',  // Text on light backgrounds
  
  // Borders
  border: '#2D2D3D',
  borderLight: '#3D3D4D',
  borderFocus: '#6366F1',
  
  // Status colors
  success: '#10B981',
  successLight: '#34D399',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  error: '#EF4444',
  errorLight: '#F87171',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  
  // Gradients (as arrays for LinearGradient)
  gradientPrimary: ['#6366F1', '#8B5CF6'],
  gradientAccent: ['#22D3EE', '#06B6D4'],
  gradientSurface: ['#1A1A24', '#252532'],
  
  // Transparency helpers
  overlay: 'rgba(0, 0, 0, 0.6)',
  overlayLight: 'rgba(0, 0, 0, 0.3)',
  shimmer: 'rgba(255, 255, 255, 0.05)',
};

export const TYPOGRAPHY = {
  fontSizes: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    '2xl': 26,
    '3xl': 32,
    '4xl': 40,
  },
  fontWeights: {
    light: '300' as const,
    normal: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 48,
  '3xl': 64,
};

export const BORDER_RADIUS = {
  sm: 6,
  md: 10,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const SHADOWS = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  glow: {
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
};

// Summary configuration
export const SUMMARY_LINE_MIN = 1;
export const SUMMARY_LINE_MAX = 200;

export const SUMMARY_STYLES = [
  { value: 'best_fit', label: 'Best Fit', description: 'AI chooses tone', icon: 'color-wand' },
  { value: 'technical', label: 'Technical', description: 'Formal & precise', icon: 'code-slash' },
  { value: 'casual', label: 'Casual', description: 'Easy to read', icon: 'chatbubble' },
] as const;

export const SUMMARY_TYPES = [
  { value: 'summary', label: 'Summary', description: 'Condensed overview', icon: 'document-text' },
  { value: 'key_points', label: 'Key Points', description: 'Bullet points', icon: 'list' },
  { value: 'flashcards', label: 'Flashcards', description: 'Q&A format', icon: 'albums' },
] as const;

