/**
 * Design Tokens and Theme Configuration
 * Centralized color, spacing, and typography system
 */

export const theme = {
  colors: {
    // Primary brand colors
    primary: '#A71D4A',
    primaryDark: '#7D1B35',
    primaryLight: '#E5D4DC',

    // Banking brand colors
    banking: {
      red: '#A71D4A',
      darkRed: '#7D1B35',
      slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
      },
    },

    // Status colors
    status: {
      success: '#10b981',
      error: '#ef4444',
      warning: '#f59e0b',
      info: '#3b82f6',
    },

    // Semantic colors for UI
    ui: {
      background: '#ffffff',
      surface: '#f9fafb',
      border: '#e5e7eb',
      text: {
        primary: '#111827',
        secondary: '#6b7280',
        muted: '#9ca3af',
      },
    },
  },

  // Accessibility
  a11y: {
    // WCAG AA compliant color contrasts
    contrastRatios: {
      high: 7, // AAA standard
      standard: 4.5, // AA standard
      large: 3, // AA large text standard
    },
    // Safe text on gradients
    textOnGradient: {
      safe: '#ffffff', // White text on dark gradients
      safeDark: '#111827', // Dark text on light gradients
    },
  },

  // Spacing scale
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
    '3xl': '4rem',
  },

  // Typography scale
  typography: {
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },

  // Shadows
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },

  // Border radius
  radius: {
    sm: '0.375rem',
    base: '0.5rem',
    md: '0.75rem',
    lg: '1rem',
    xl: '1.5rem',
    full: '9999px',
  },

  // Transitions
  transitions: {
    fast: '150ms',
    base: '250ms',
    slow: '350ms',
  },
} as const

/**
 * Helper function to ensure WCAG AA color contrast
 * Use for dynamic color choices in UI
 */
export function getContrastSafeTextColor(backgroundColor: string): string {
  // Simplified - in production use a proper color contrast algorithm
  // For now, return safe colors based on brightness
  const brightness = parseInt(backgroundColor.slice(1), 16)
  return brightness > 0x7f0000 ? theme.a11y.textOnGradient.safe : theme.a11y.textOnGradient.safeDark
}

/**
 * Get colors by role/type for consistent UI
 */
export const roleColors = {
  'Super Admin': theme.colors.status.error,
  'System Admin': '#8b5cf6',
  'Admin': '#3b82f6',
  'Moderator': '#6366f1',
  'User': '#10b981',
  'Viewer': '#6b7280',
} as const
