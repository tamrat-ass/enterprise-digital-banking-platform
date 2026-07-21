/**
 * Unified Color Theme System
 * Ensures consistent color usage across the entire application
 */

export const COLORS = {
  // Primary Actions & Branding
  primary: {
    50: 'bg-blue-50',
    100: 'bg-blue-100',
    200: 'bg-blue-200',
    500: 'bg-blue-500',
    600: 'bg-blue-600',
    700: 'bg-blue-700',
    900: 'bg-blue-900',
    text: 'text-blue-600',
    textDark: 'text-blue-700',
  },

  // Backgrounds - Light Mode (Standard)
  background: {
    page: 'bg-slate-50', // Page backgrounds
    card: 'bg-white', // Card containers
    input: 'bg-white', // Input fields
    hover: 'hover:bg-slate-50', // Hover state
    disabled: 'bg-slate-100', // Disabled state
    section: 'bg-white', // Section containers
  },

  // Text - Consistent across all pages
  text: {
    primary: 'text-slate-900', // Main text
    secondary: 'text-slate-600', // Secondary text
    tertiary: 'text-slate-500', // Tertiary/muted text
    muted: 'text-slate-400', // Placeholder text
    light: 'text-slate-700', // Label text (semi-bold)
  },

  // Borders - Unified across pages
  border: {
    light: 'border-slate-200', // Standard borders
    standard: 'border border-slate-200',
    dashed: 'border-2 border-dashed border-slate-200',
    bottom: 'border-b border-slate-200',
  },

  // Status & Intent Colors
  status: {
    success: {
      bg: 'bg-emerald-50',
      border: 'border-emerald-200',
      text: 'text-emerald-700',
      badge: 'bg-emerald-100 text-emerald-700',
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-700',
      badge: 'bg-red-100 text-red-700',
    },
    warning: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
    },
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-700',
      badge: 'bg-blue-100 text-blue-700',
    },
    pending: {
      bg: 'bg-amber-50',
      border: 'border-amber-200',
      text: 'text-amber-700',
      badge: 'bg-amber-100 text-amber-700',
    },
  },

  // Role Color Assignments (Standardized)
  roles: {
    superAdmin: { bg: 'bg-blue-100', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-700' },
    systemAdmin: { bg: 'bg-indigo-100', text: 'text-indigo-700', badge: 'bg-indigo-100 text-indigo-700' },
    executive: { bg: 'bg-purple-100', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-700' },
    departmentHead: { bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-100 text-emerald-700' },
    complianceOfficer: { bg: 'bg-violet-100', text: 'text-violet-700', badge: 'bg-violet-100 text-violet-700' },
    auditor: { bg: 'bg-rose-100', text: 'text-rose-700', badge: 'bg-rose-100 text-rose-700' },
    approver: { bg: 'bg-cyan-100', text: 'text-cyan-700', badge: 'bg-cyan-100 text-cyan-700' },
    documentOfficer: { bg: 'bg-orange-100', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-700' },
    viewer: { bg: 'bg-slate-100', text: 'text-slate-700', badge: 'bg-slate-100 text-slate-700' },
    user: { bg: 'bg-green-100', text: 'text-green-700', badge: 'bg-green-100 text-green-700' },
  },

  // Buttons - Standardized styles
  button: {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'border border-slate-200 text-slate-700 hover:bg-slate-50',
    danger: 'text-red-600 hover:bg-red-50',
    disabled: 'disabled:opacity-50 disabled:cursor-not-allowed',
    focus: 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
  },

  // Shadows - Consistent depth
  shadow: {
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  },

  // Radius - Consistent corner rounding
  radius: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  },

  // Transitions
  transition: 'transition-colors duration-200',

  // Icons
  icons: {
    primary: 'text-blue-600',
    secondary: 'text-slate-400',
    success: 'text-emerald-600',
    error: 'text-red-600',
    warning: 'text-amber-600',
  },
} as const

// Gradient system (Minimal use - only for special sections)
export const GRADIENTS = {
  // Light page gradient (subtle)
  pageLight: 'bg-gradient-to-br from-slate-50 to-white',
  
  // Header/Hero gradient (primary only)
  header: 'bg-gradient-to-r from-blue-600 to-blue-700',
  
  // Card accent gradient (minimal use)
  cardAccent: 'bg-gradient-to-br from-blue-50 to-white',
} as const

// Get role color by role name
export const getRoleColor = (roleName: string | null | undefined) => {
  if (!roleName) return COLORS.roles.user

  const normalized = roleName.toLowerCase().trim()

  // Role name mappings
  if (normalized.includes('super admin')) return COLORS.roles.superAdmin
  if (normalized.includes('system admin')) return COLORS.roles.systemAdmin
  if (normalized.includes('executive')) return COLORS.roles.executive
  if (normalized.includes('department') || normalized.includes('head') || normalized.includes('manager'))
    return COLORS.roles.departmentHead
  if (normalized.includes('compliance')) return COLORS.roles.complianceOfficer
  if (normalized.includes('auditor') || normalized.includes('audit')) return COLORS.roles.auditor
  if (normalized.includes('approver')) return COLORS.roles.approver
  if (normalized.includes('document')) return COLORS.roles.documentOfficer
  if (normalized.includes('viewer') || normalized.includes('staff')) return COLORS.roles.viewer

  return COLORS.roles.user
}

// Get status color by status string
export const getStatusColor = (status: string | null | undefined) => {
  if (!status) return COLORS.status.info

  const normalized = status.toLowerCase().trim()

  if (normalized.includes('success') || normalized.includes('completed') || normalized.includes('approved'))
    return COLORS.status.success
  if (normalized.includes('error') || normalized.includes('failed') || normalized.includes('rejected') || normalized.includes('denied'))
    return COLORS.status.error
  if (normalized.includes('warning') || normalized.includes('caution')) return COLORS.status.warning
  if (normalized.includes('pending') || normalized.includes('waiting') || normalized.includes('in progress'))
    return COLORS.status.pending
  if (normalized.includes('info') || normalized.includes('invited') || normalized.includes('active')) return COLORS.status.info

  return COLORS.status.info
}
