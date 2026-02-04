---
name: Site UX Cleanup
overview: Comprehensive cleanup of the Uthini site addressing logo size, navigation design, responsive behaviour, spacing inconsistencies, and code organisation - guided by Laws of UX principles.
todos:
  - id: header-logo
    content: Fix header height and logo sizing to eliminate clipping
    status: completed
  - id: nav-desktop
    content: Add active states, hover animations, better tap targets to desktop nav
    status: completed
  - id: nav-mobile
    content: Add hamburger icon, slide transition, backdrop overlay for mobile nav
    status: completed
  - id: spacing-fix
    content: Remove section--reveal left padding, fix Orchestrator gap, simplify section spacing
    status: completed
  - id: responsive
    content: Add tablet breakpoints, fix feature grid, improve mobile typography
    status: completed
  - id: code-cleanup
    content: Reorganise CSS by component, remove redundant rules, add comments
    status: completed
isProject: false
---

# Site UX Cleanup Plan

## Issues Identified

### 1. Logo Size Problem

- Header height is `5rem` (80px) but logo is set to `5.5rem`/`7rem` - this causes overflow/clipping
- The `max-height: 100%` constraint fights with the explicit height
- **Fix**: Increase header height or properly constrain logo within header bounds

### 2. Navigation Issues

- **Plain styling**: No active state, minimal hover feedback, no visual distinction
- **Mobile menu**: Uses text "Menu" instead of recognisable hamburger icon
- **No transitions**: Menu appears/disappears abruptly on mobile
- **Tap targets**: Links are text-only with no padding (violates **Fitts's Law**)

### 3. Spacing and Gap Problems

- **Orchestrator page gap**: `.section--reveal` adds `padding-left: var(--space-lg)` AND `border-left: 4px` creating inconsistent left alignment
- **Double padding**: `main` has `padding: var(--space-2xl) var(--space-lg)` but sections also have `padding: var(--space-3xl) 0`
- **Negative margin pattern**: Sections use `margin-left/right: calc(-1 * var(--space-lg))` which is fragile
- **Alternating backgrounds**: Even/odd section styling adds visual noise

### 4. Responsive Issues

- Single breakpoint at `48rem` (768px) - no tablet intermediate
- Mobile nav has no smooth transition
- Feature grid `minmax(14rem, 1fr)` may break on very small screens
- Typography doesn't scale smoothly below mobile breakpoint

### 5. Code Organisation

- Styles are scattered - hero styles in middle of file
- Some redundant/conflicting rules
- Magic numbers (e.g., `47.9375rem`)
- Inconsistent naming (`.section__lead` vs `.section__intro`)

---

## Improvement Plan (Applying Laws of UX)

### A. Header and Logo (Aesthetic-Usability Effect, Fitts's Law)

**File**: [css/style.css](css/style.css) lines 56-93, [css/variables.css](css/variables.css)

- Increase `--header-height` from `5rem` to `6rem` to properly contain the logo
- Set logo height to `4rem` mobile / `5rem` desktop (within header bounds)
- Add subtle logo hover effect (slight scale or opacity)

### B. Navigation Redesign (Jakob's Law, Fitts's Law)

**File**: [css/style.css](css/style.css) lines 95-138

Desktop nav improvements:

- Add active state with underline/highlight for current page
- Increase link padding for larger tap targets: `padding: 0.5rem 0.75rem`
- Add subtle hover underline animation
- Add focus-visible state for accessibility

Mobile nav improvements:

- Replace "Menu" text with hamburger icon (CSS-only, 3 lines)
- Add smooth slide-down transition for menu open/close
- Increase mobile link padding for thumb-friendly tap targets
- Add backdrop overlay when menu open

### C. Spacing System Cleanup (Law of Proximity, Cognitive Load)

**File**: [css/style.css](css/style.css) lines 186-241

- Remove `.section--reveal` left padding and border - apply to heading only
- Simplify section spacing: remove alternating backgrounds (visual noise)
- Use consistent vertical rhythm: sections get `padding-block: var(--space-3xl)`
- Remove fragile negative margin pattern for full-bleed sections
- Fix Orchestrator page gap by ensuring first section aligns with content

### D. Responsive Improvements (Fitts's Law, Doherty Threshold)

**File**: [css/style.css](css/style.css)

Add breakpoints:

- Small: `< 30rem` (480px) - phone
- Medium: `30rem - 48rem` (480-768px) - tablet portrait
- Large: `48rem - 64rem` (768-1024px) - tablet landscape
- XL: `> 64rem` - desktop

Specific fixes:

- Feature grid: `minmax(10rem, 1fr)` on mobile
- Typography: Ensure all `clamp()` values work at 320px
- Footer: Stack on mobile, side-by-side on desktop
- Hero: Reduce padding on mobile

### E. Code Cleanup

**File**: [css/style.css](css/style.css)

- Group styles by component: Reset, Layout, Header, Nav, Hero, Sections, Forms, Footer, Utilities
- Remove redundant rules
- Replace magic numbers with variables
- Consolidate `.section__lead` and `.section__intro` into one class
- Add CSS comments for each section

---

## Visual Hierarchy Summary (Miller's Law, Law of Pragnanz)

```
Header: Logo (prominent) + Nav (clear, active states)
    |
Hero: Single message, single CTA
    |
Sections: Consistent spacing, clear titles, no visual noise
    |
Footer: Grouped links, company info
```

---

## Files to Modify


| File                | Changes                                                         |
| ------------------- | --------------------------------------------------------------- |
| `css/variables.css` | Increase header height, add new spacing vars                    |
| `css/style.css`     | Nav redesign, spacing fixes, responsive breakpoints, code reorg |
| All HTML files      | Add `aria-current="page"` to active nav links                   |


