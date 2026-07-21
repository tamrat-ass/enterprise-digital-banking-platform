# Color Theme Guide - Enterprise Digital Banking Platform

## Overview

This document outlines the unified color theme system for the entire application. All pages must use the centralized color constants from `@/lib/colors.ts` to ensure a consistent, seamless experience across the platform.

## Color System Architecture

The color system is organized into the following categories:

### 1. Primary Colors
- **Blue**: Primary brand color for buttons, links, and active states
- Used for: Call-to-action buttons, active navigation, primary links, focus rings

### 2. Background Colors
- **Slate-50**: Standard page background
- **White**: Card, container, and input backgrounds
- **Slate-100**: Disabled or secondary backgrounds

### 3. Text Colors
- **Slate-900**: Primary text (headings, body copy)
- **Slate-600**: Secondary text (descriptions, labels)
- **Slate-500**: Tertiary text (muted, help text)
- **Slate-400**: Placeholders and disabled text

### 4. Border Colors
- **Slate-200**: Standard borders across all components
- All borders should use this color for consistency

### 5. Status & Intent Colors
- **Success**: Emerald (emerald-50, emerald-100, emerald-700)
- **Error**: Red (red-50, red-100, red-700)
- **Warning**: Amber (amber-50, amber-100, amber-700)
- **Info/Pending**: Blue (blue-50, blue-100, blue-700)

### 6. Role-Specific Colors
Each role has a designated color scheme for badges and indicators:
- Super Admin: Blue
- System Admin: Indigo
- Executive: Purple
- Department Head: Emerald
- Compliance Officer: Violet
- Auditor: Rose
- Approver: Cyan
- Document Officer: Orange
- Viewer: Slate
- User/Staff: Green

## Import and Usage

### Step 1: Import the color constants
```typescript
import { COLORS, GRADIENTS, getRoleColor, getStatusColor } from '@/lib/colors'
```

### Step 2: Use color constants in your components
```typescript
// For backgrounds
<div className={COLORS.background.page}>

// For text
<h1 className={COLORS.text.primary}>Heading</h1>

// For status
<div className={COLORS.status.success.bg}>Success message</div>

// For buttons
<button className={COLORS.button.primary}>Click me</button>

// For borders
<div className={`border ${COLORS.border.light}`}>Content</div>
```

### Step 3: Use utility functions
```typescript
// Get role color
const roleColor = getRoleColor('Super Admin')
<span className={roleColor.badge}>Super Admin</span>

// Get status color
const statusColor = getStatusColor('pending')
<div className={statusColor.bg}>Pending</div>
```

## Common Patterns

### Card Styling
```typescript
<div className={`${COLORS.background.card} border ${COLORS.border.light} rounded-lg shadow-sm`}>
  {/* content */}
</div>
```

### Button Styling
```typescript
// Primary Button
<button className={COLORS.button.primary}>Submit</button>

// Secondary Button
<button className={COLORS.button.secondary}>Cancel</button>

// Danger Button
<button className={COLORS.button.danger}>Delete</button>
```

### Status Badge
```typescript
<span className={COLORS.status.success.badge}>Active</span>
<span className={COLORS.status.error.badge}>Error</span>
<span className={COLORS.status.warning.badge}>Warning</span>
```

### Role Badge
```typescript
const color = getRoleColor(roleName)
<span className={color.badge}>{roleName}</span>
```

### Form Inputs
```typescript
<input
  type="text"
  className={`border ${COLORS.border.light} rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500`}
  placeholder="Enter text"
/>
```

### Table Headers
```typescript
<thead>
  <tr className={`${COLORS.border.bottom} bg-slate-50`}>
    <th className={`px-6 py-3 text-xs font-semibold ${COLORS.text.primary}`}>Column</th>
  </tr>
</thead>
```

### Error Messages
```typescript
<div className={`${COLORS.status.error.bg} border ${COLORS.status.error.border} rounded-lg p-4`}>
  <p className={COLORS.status.error.text}>Error message</p>
</div>
```

## Gradient Usage

Gradients should be used sparingly and only for special sections:

### Header Gradient
```typescript
<div className={GRADIENTS.header}>
  {/* Header content */}
</div>
```

### Page Background Gradient (Light)
```typescript
<div className={GRADIENTS.pageLight}>
  {/* Content */}
</div>
```

### Card Accent Gradient
```typescript
<div className={GRADIENTS.cardAccent}>
  {/* Card content */}
</div>
```

## Transitions & Effects

All color transitions should use:
```typescript
className={COLORS.transition} // smooth 200ms color transition
```

## Accessibility Considerations

1. **Color + Icon**: Always pair status colors with icons for accessibility
   ```typescript
   <div className={COLORS.status.success.badge}>
     <CheckCircle className="inline mr-1" /> Approved
   </div>
   ```

2. **Text Contrast**: All color combinations meet WCAG AA standards
   - Primary text (slate-900) on light backgrounds: ✓ Pass
   - Secondary text (slate-600) on light backgrounds: ✓ Pass
   - Status colors with badges: ✓ Pass

3. **Focus States**: Always include focus rings for interactive elements
   ```typescript
   className={`${COLORS.button.focus} ...`}
   ```

## Migration Checklist

When updating existing pages to use the unified theme:

- [ ] Import `COLORS` and `GRADIENTS` from `@/lib/colors`
- [ ] Replace all hardcoded color classes with COLORS constants
- [ ] Update status indicators to use status color helpers
- [ ] Update role badges to use `getRoleColor()`
- [ ] Replace all `border-gray-*` with `COLORS.border.*`
- [ ] Replace all `text-gray-*` with `COLORS.text.*`
- [ ] Replace all `bg-gray-*` with `COLORS.background.*`
- [ ] Test across all breakpoints
- [ ] Verify accessibility with keyboard navigation
- [ ] Check focus states on all interactive elements

## Files Updated

- `app/accept-invitation/page.tsx` - ✓ Converted
- `app/admin/dashboard.tsx` - ✓ Converted

## Files Pending Update

All other pages should follow the same pattern:
- Admin pages
- User management pages
- Document pages
- Analytics pages
- Settings pages

## Adding New Colors

If a new color is needed:

1. Add it to the `COLORS` object in `lib/colors.ts`
2. Document its purpose in this guide
3. Use the getter functions where applicable
4. Update all existing components using similar colors

## Examples

### Complete Page Update Example

**Before:**
```typescript
<div className="min-h-screen bg-gray-50">
  <div className="bg-white rounded-lg border border-gray-200">
    <h1 className="text-2xl font-bold text-gray-900">Title</h1>
    <p className="text-gray-600">Subtitle</p>
  </div>
</div>
```

**After:**
```typescript
import { COLORS } from '@/lib/colors'

<div className={`min-h-screen ${COLORS.background.page}`}>
  <div className={`${COLORS.background.card} rounded-lg border ${COLORS.border.light}`}>
    <h1 className={`text-2xl font-bold ${COLORS.text.primary}`}>Title</h1>
    <p className={COLORS.text.secondary}>Subtitle</p>
  </div>
</div>
```

## Questions & Support

For questions about color usage or to propose new colors, refer to the color constants in `lib/colors.ts` or contact the design team.
