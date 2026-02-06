# Pay Lobster Design System

## Color Palette

### Core Colors
```css
/* Background */
--bg-primary: #030712;     /* gray-950 */
--bg-surface: #111827;     /* gray-900 */

/* Borders */
--border: #1f2937;         /* gray-800 */

/* Text */
--text-primary: #f9fafb;   /* gray-50 */
--text-secondary: #9ca3af; /* gray-400 */

/* Accent */
--accent: #ea580c;         /* orange-600 */

/* Status */
--success: #22c55e;        /* green-500 */
```

## Typography Scale

### Headings
- **Hero**: `text-5xl md:text-7xl` (48px → 72px)
- **H1**: `text-2xl md:text-4xl` (24px → 36px)
- **H2**: `text-xl` (20px)
- **H3**: `text-lg` (18px)

### Body Text
- **Large**: `text-lg md:text-xl` (18px → 20px)
- **Base**: `text-base` (16px)
- **Small**: `text-sm` (14px)
- **Extra Small**: `text-xs` (12px)

### Font Weight
- **Bold**: `font-bold` (700)
- **Medium**: `font-medium` (500)
- **Regular**: `font-normal` (400)

## Spacing System

### Section Padding
```css
py-16 md:py-24  /* 64px → 96px vertical */
px-4 md:px-8    /* 16px → 32px horizontal */
```

### Card Padding
```css
p-6 md:p-8      /* 24px → 32px all sides */
```

### Container
```css
max-w-6xl mx-auto  /* 1152px max width, centered */
```

### Gaps
- **xs**: `gap-2` (8px)
- **sm**: `gap-3` (12px)
- **md**: `gap-4` (16px)
- **lg**: `gap-6` (24px)
- **xl**: `gap-8` (32px)

## Components

### Button
```tsx
// Variants
primary   - Orange background, white text
secondary - Gray background, border
ghost     - Transparent, gray text

// Sizes
sm  - text-sm px-3 py-2 (min-h: 36px)
md  - text-base px-4 py-2.5 (min-h: 44px)
lg  - text-lg px-6 py-3 (min-h: 52px)
```

### Card
```tsx
// Default
bg-gray-900 border-gray-800 rounded-lg p-6 md:p-8

// With hover
hover:border-gray-700 hover:shadow-lg
```

### Input
```tsx
// Default
bg-gray-950 border-gray-800 rounded-lg px-4 py-2.5
text-gray-50 placeholder-gray-500
min-h-touch (44px)

// Focus
focus:ring-2 focus:ring-orange-600
```

### Badge
```tsx
// Variants
default - bg-gray-800 text-gray-300
success - bg-green-500/20 text-green-500
warning - bg-orange-600/20 text-orange-600
error   - bg-red-500/20 text-red-500
```

## Layout

### Grid System
```tsx
// Mobile-first responsive grids
grid grid-cols-1               // Mobile: 1 column
md:grid-cols-2                // Tablet: 2 columns  
lg:grid-cols-3                // Desktop: 3 columns

// Common patterns
grid-cols-2 md:grid-cols-4    // Stats bars
md:grid-cols-2 lg:grid-cols-3 // Card grids
```

### Breakpoints
- **md**: 768px (tablet)
- **lg**: 1024px (desktop)

## Touch Targets

All interactive elements must meet minimum touch target sizes:
- **Minimum**: 44px × 44px
- **Recommended**: 48px × 48px

Implementation:
```tsx
className="min-h-touch min-w-touch"  // 44px × 44px
```

## Accessibility

### Focus States
All interactive elements have visible focus rings:
```tsx
focus:outline-none focus:ring-2 focus:ring-orange-600 focus:ring-offset-2
```

### Color Contrast
- Text on gray-950: 16.1:1 (AAA)
- Orange-600 on gray-950: 4.8:1 (AA)
- Gray-400 on gray-950: 7.0:1 (AA)

### ARIA Labels
```tsx
aria-label="Close menu"
aria-label="Open menu"
```

## Animation

Keep animations minimal and purposeful:
```tsx
// Transitions
transition-colors  // For hover states
transition-all     // For complex changes

// Durations
duration-200       // Fast (hover)
duration-500       // Medium (page transitions)
duration-1000      // Slow (score gauge)

// Easing
ease-out           // Natural deceleration
```

## Icons & Emoji

Using emoji for icons (fast, no SVG loading):
- 🦞 - Logo/Brand
- 🔐 - Escrow
- 💸 - Send
- 📜 - History
- 🤖 - Register
- ⭐ - Trust
- 📊 - Credit
- 🎉 - Success

## Best Practices

1. **Mobile-First**: Design for 375px first, scale up
2. **Touch-Friendly**: 44px minimum tap targets
3. **Whitespace**: Let content breathe (py-16 md:py-24)
4. **Hierarchy**: Use size/weight/color to guide attention
5. **Performance**: System fonts, minimal JS, static generation
6. **Accessibility**: Keyboard navigation, focus states, ARIA labels
7. **Consistency**: Use component library for all UI elements

## File Organization

```
src/components/
├── ui/              # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Badge.tsx
│   └── ScoreGauge.tsx
└── layout/          # Layout components
    ├── Header.tsx
    └── MobileNav.tsx
```

## Usage Examples

### Page Layout
```tsx
<div className="min-h-screen py-16 md:py-24 px-4 md:px-8">
  <div className="max-w-6xl mx-auto space-y-8">
    <h1 className="text-2xl md:text-4xl font-bold">Title</h1>
    <Card>Content</Card>
  </div>
</div>
```

### Form Section
```tsx
<form className="space-y-6">
  <Input label="Name" placeholder="Enter name" />
  <Button size="lg" className="w-full">Submit</Button>
</form>
```

### Card Grid
```tsx
<div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
  <Card hover>Content 1</Card>
  <Card hover>Content 2</Card>
  <Card hover>Content 3</Card>
</div>
```

---

**Version**: 1.0  
**Last Updated**: 2026-02-05  
**Maintained by**: Pay Lobster Team
