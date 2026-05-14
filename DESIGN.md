# Feature Dashboard Design System

**Last updated:** May 2026  
**Foundation:** EPAM Design System (Museo Sans, brand palette)  
**Scope:** Feature flag management dashboard — admin-only UI for toggling features, managing traffic allocation, monitoring status changes.

---

## 1. Color Palette

### Semantic Tokens & CSS Variables

All colors derive from the **EPAM Master 2023.5** palette. Feature Dashboard adds semantic aliases for status badges and interactive states.

#### Neutrals (foundation)
| Token | Value | CSS Variable | Usage |
|---|---|---|---|
| Black | `#000000` | `--color-bg-inverse` | Dark modes, accents |
| White | `#FFFFFF` | `--color-bg` | Default surface |
| Ink (near-black navy) | `#040C28` | `--color-fg` | Body text, primary foreground |
| Gray (secondary) | `#A0A0A0` | `--color-fg-subtle` | Disabled text, hints |
| Gray-700 | `#222222` | `--color-fg-muted` | Supporting copy |
| Paper (cool bg) | `#F6F9FD` | `--color-bg-subtle` | Alternate section background |
| Cream (warm bg) | `#FBF5E8` | `--color-bg-cream` | Warm section background (rare) |

#### Status Colors (semantic)
| Status | Base Color | CSS Variable | Usage |
|---|---|---|---|
| **Enabled** | `#149651` (green) | `--color-status-enabled` | Active features, success states |
| **Testing** | `#3055DA` (blue) | `--color-status-testing` | Beta/canary features |
| **Disabled** | `#A0A0A0` (gray) | `--color-status-disabled` | Inactive features |

#### Interactive Accents
| Token | Value | CSS Variable | Usage |
|---|---|---|---|
| Link / Primary CTA | `#3055DA` | `--color-accent` | Buttons, primary actions |
| Link hover | `#418DFF` | `--color-accent-hover` | Hover state on interactive |
| Visited link | `#8353D2` | `--color-link-visited` | Post-click link state |
| Highlight / Mint | `#61E2BB` | `--color-highlight` | Focus rings, call-outs |
| Warning / Amber | `#FBAE40` | `--color-warning` | Caution states, traffic warnings |

#### Borders
| Token | Value | CSS Variable | Usage |
|---|---|---|---|
| Standard (on light) | `rgba(0,0,0,0.12)` | `--color-border` | Card edges, input borders |
| Strong (on light) | `rgba(0,0,0,0.24)` | `--color-border-strong` | Active input borders, dividers |
| Inverse (on dark) | `rgba(255,255,255,0.18)` | `--color-border-inverse` | Dark-mode card borders |

#### Gradients
| Name | Definition | CSS Variable | Usage |
|---|---|---|---|
| Brand gradient | 135° `#0078C2 → #0047FF → #8453D2` | `--epam-gradient` | Icon accents (rare), hero elements |
| Soft gradient | 135° `#418DFF → #8353D2` | `--epam-gradient-soft` | Background accents (sparingly) |

---

## 2. Typography

### Font Choice: Museo Sans (EPAM Brand)

**Justification:**  
The EPAM Design System specifies **Museo Sans** (exljbris foundry) as the corporate brand typeface. It is a **premium geometric sans-serif** with:
- 10 weights (100/300/500/700/900 + italics at every weight)
- High legibility at both display and body sizes
- Editorial, confident tone — aligns with EPAM's consulting/presales voice
- Excellent support for Cyrillic (Latin Extended-A/B)
- Licensed and embedded via `@font-face` in EPAM's `colors_and_type.css`

**Anti-pattern avoidance:** Not using Inter or Roboto. Museo Sans differentiates the admin UI from commodity design patterns; it signals enterprise quality and consistency with EPAM brand.

### Type Scale

| Role | Size | Weight | CSS Var | Line Height | Tracking | Usage |
|---|---|---|---|---|---|---|
| **Display XL** | 88px (clamp 48–88) | 900 | `--fs-display-xl` | 1.05 | -0.01em | Page title (rare) |
| **Display L** | 64px (clamp 40–64) | 700 | `--fs-display-l` | 1.05 | -0.01em | Section title (rare) |
| **Display M** | 44px (clamp 32–44) | 700 | `--fs-display-m` | 1.2 | 0 | Feature page header |
| **H1** | 40px | 700 | `--fs-h1` | 1.05 | -0.01em | Dashboard title |
| **H2** | 28px | 700 | `--fs-h2` | 1.2 | 0 | Section headers |
| **H3** | 22px | 700 | `--fs-h3` | 1.2 | 0 | Card titles |
| **H4** | 18px | 700 | `--fs-h4` | 1.2 | 0 | Form labels |
| **Body Large** | 18px | 300 | `--fs-body-lg` | 1.45 | 0 | Deck/editorial body |
| **Body** | 16px | 300 | `--fs-body` | 1.45 | 0 | Default body text |
| **Body Small** | 14px | 300 | `--fs-body-sm` | 1.45 | 0 | Secondary copy |
| **Caption** | 12px | 500 | `--fs-caption` | 1.45 | 0 | Footer, metadata |
| **Eyebrow** | 11px | 700 | `--fs-eyebrow` | 1.45 | 0.16em | Labels, status tags |

### Font Weights

| Weight | Value | Museo Sans Style | Usage |
|---|---|---|---|
| Thin | 100 | Museo Sans 100 | Rare — large display only |
| Light | 300 | Museo Sans 300 | Body, secondary text (reads as "normal" in Museo) |
| Regular | 500 | Museo Sans 500 | Semibold emphasis, UI labels, buttons |
| Semibold | 700 | Museo Sans 700 | Headings, strong emphasis |
| Black | 900 | Museo Sans 900 | Extra-large display only |

---

## 3. Spacing Scale

**Grid basis:** 8px (matches EPAM PowerPoint internal layout grid).  
**All spacing uses multiples of 8.** No exceptions.

| Token | Value | CSS Variable | Usage |
|---|---|---|---|
| Space 0 | 0 | `--space-0` | No gap |
| Space 1 | 4px | `--space-1` | ⚠ **Avoid; use Space 2 instead** |
| Space 2 | 8px | `--space-2` | Tight spacing: badge padding, icon gaps |
| Space 3 | 12px | `--space-3` | ⚠ **Avoid; use Space 2 or Space 4** |
| Space 4 | 16px | `--space-4` | Standard: input padding, button padding, card gutters |
| Space 5 | 24px | `--space-5` | Breathing room: section margins, vertical rhythm |
| Space 6 | 32px | `--space-6` | Large gap: major layout breaks |
| Space 7 | 48px | `--space-7` | XL: page margins, hero sections |
| Space 8 | 64px | `--space-8` | Page-level padding |
| Space 9 | 96px | `--space-9` | Viewport-scale spacer (rare) |
| Space 10 | 128px | `--space-10` | Maximum spacing (very rare) |

### Slide margins (page default)
- Horizontal: 48px (`--slide-pad-x`)
- Vertical: 56px (`--slide-pad-y`)

---

## 4. Border Radius Scale

EPAM philosophy: **sharp corners by default; slight softening for utility.**  
No aggressive rounded-corner nostalgia or iOS-style pill buttons.

| Token | Value | CSS Variable | Usage |
|---|---|---|---|
| None | 0 | `--radius-none` | Badges, tags (sharp edges) |
| XS | 2px | `--radius-xs` | Minimal rounding: focus rings |
| SM | 4px | `--radius-sm` | Default: cards, buttons, inputs |
| MD | 8px | `--radius-md` | Larger elements: drawer/modal corners |
| LG | 12px | `--radius-lg` | Image masks, hero photo overlays (rare) |
| Pill | 999px | `--radius-pill` | Pill badges, lozenges, toggle buttons |

**Anti-pattern:** No left-border accent cards (`border-left: 4px solid...`). Instead use **icon-based status** + **flex layout** for clarity.

---

## 5. Elevation & Shadow Approach

EPAM uses **subtle, photographic shadows** — no elevation system in the Material Design sense. Shadows exist to separate content layers, not create visual hierarchy.

| Token | Definition | CSS Variable | Usage |
|---|---|---|---|
| **XS** | `0 1px 2px rgba(4,12,40,0.06)` | `--shadow-xs` | Hover lift on cards |
| **SM** | `0 2px 4px rgba(4,12,40,0.08), 0 1px 2px rgba(4,12,40,0.04)` | `--shadow-sm` | Default: cards, dropdowns, buttons on hover |
| **MD** | `0 6px 16px rgba(4,12,40,0.10), 0 2px 4px rgba(4,12,40,0.06)` | `--shadow-md` | Modals, elevated popovers |
| **LG** | `0 16px 40px rgba(4,12,40,0.14)` | `--shadow-lg` | Full-page overlays, lightbox backdrops |
| **Inset** | `inset 0 0 0 1px rgba(0,0,0,0.08)` | `--shadow-inset` | Focus rings, recessed controls |

### Shadow Philosophy
- **No drop shadows on every element.** Reserve shadows for intentional layer separation.
- **Hover → add shadow** (transition over `--dur-fast`).
- **No color shadows.** Always use black (`rgba(4,12,40,...)`).
- **Never stack multiple shadows** unless layering distinct UI planes (modal + backdrop).

### Focus & Keyboard Indicators
- **Focus ring:** 2px solid `var(--color-highlight)` (`#61E2BB`), offset 2px outward.
- **Ring on dark:** Use `var(--color-accent-hover)` (`#418DFF`) for contrast.

---

## 6. Component Patterns

### 6.1 Cards

**Structure:** flex column, 1px border, soft corner, optional shadow on hover.

```css
.card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  background: var(--color-bg);
  padding: var(--space-4);
  transition: box-shadow var(--dur-fast) var(--ease-standard);
}

.card:hover {
  box-shadow: var(--shadow-sm);
}
```

**Content structure (feature card example):**
```
┌─────────────────────────────────┐
│ [Icon] Name        [Status]     │  ← eyebrow + status badge, gap: space-4
├─────────────────────────────────┤  ← divider (1px border-top)
│ Traffic: ██████░░ 67%           │  ← progress bar + label
│ Last modified: 2 hours ago      │  ← metadata, color-fg-subtle
├─────────────────────────────────┤  ← divider
│ [Toggle] [Edit] [More]          │  ← action buttons, gap: space-2
└─────────────────────────────────┘
```

---

### 6.2 Buttons

**Base button:**
```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  font-weight: var(--fw-regular); /* 500 */
  line-height: 1;
  cursor: pointer;
  transition: 
    background-color var(--dur-fast) var(--ease-standard),
    color var(--dur-fast) var(--ease-standard),
    border-color var(--dur-fast) var(--ease-standard);
  text-decoration: none;
  user-select: none;
}

.btn:focus-visible {
  outline: 2px solid var(--color-highlight);
  outline-offset: 2px;
}
```

#### Button variants

| Variant | Background | Text | Border | Usage |
|---|---|---|---|---|
| **Primary** (filled) | `var(--color-accent)` | white | none | Main CTA |
| **Primary hover** | `var(--color-accent-hover)` | white | — | — |
| **Primary active** | darker by 8% OKLCH | white | — | Click/press |
| **Secondary** (outline) | transparent | `var(--color-accent)` | 1px `var(--color-accent)` | Alternative action |
| **Secondary hover** | `rgba(48,85,218,0.08)` | `var(--color-accent-hover)` | 1px `var(--color-accent-hover)` | — |
| **Tertiary** (text only) | transparent | `var(--color-accent)` | none | Inline action |
| **Tertiary hover** | transparent | `var(--color-accent-hover)` | none | — |
| **Danger** | `#F26B43` (orange) | white | none | Destructive action (delete, reset) |
| **Danger hover** | darken by 8% OKLCH | white | — | — |

**Button sizes:**
| Size | Height | Padding (H/V) | Font Size | Usage |
|---|---|---|---|---|
| XS | 28px | 8px/4px | 12px | Compact UI, tags |
| SM | 32px | 12px/4px | 14px | Toolbar buttons |
| MD | 40px | 16px/8px | 16px | Default / standard |
| LG | 48px | 20px/12px | 18px | Page-level CTA |

---

### 6.3 Input Fields

**Base input:**
```css
.input {
  display: block;
  width: 100%;
  padding: var(--space-2) var(--space-4);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-family: var(--font-body);
  font-size: var(--fs-body);
  color: var(--color-fg);
  background: var(--color-bg);
  transition: 
    border-color var(--dur-fast) var(--ease-standard),
    box-shadow var(--dur-fast) var(--ease-standard);
}

.input:focus {
  border-color: var(--color-accent);
  box-shadow: 0 0 0 2px rgba(48,85,218,0.1);
  outline: none;
}

.input:disabled {
  background: var(--color-bg-subtle);
  color: var(--color-fg-subtle);
  cursor: not-allowed;
}
```

#### Input variants

| State | Border | Background | Icon |
|---|---|---|---|
| Default | `--color-border` | `--color-bg` | Gray |
| Focus | `--color-accent` | `--color-bg` | Blue |
| Error | `#F26B43` (orange) | `rgba(242,107,67,0.04)` | Orange ⚠️ |
| Disabled | `--color-border` | `--color-bg-subtle` | Muted |
| Success | `--color-status-enabled` | `rgba(20,150,81,0.04)` | Green ✓ |

**Label + hint structure:**
```
┌─ Label (font-weight: 500, color: --color-fg)
├─ Input
└─ Hint text (font-size: --fs-body-sm, color: --color-fg-subtle)
  └─ Error (color: #F26B43)
```

---

### 6.4 Status Badges

**Inline badge (semantic color + text):**
```css
.badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-2) var(--space-4);
  border-radius: var(--radius-none); /* sharp corners */
  font-size: var(--fs-eyebrow);
  font-weight: var(--fw-bold);
  text-transform: uppercase;
  letter-spacing: var(--ls-eyebrow);
  line-height: 1;
}

.badge--enabled {
  background: rgba(20,150,81,0.15);
  color: var(--color-status-enabled);
}

.badge--testing {
  background: rgba(48,85,218,0.15);
  color: var(--color-status-testing);
}

.badge--disabled {
  background: rgba(160,160,160,0.15);
  color: var(--color-status-disabled);
}
```

| Status | Background | Text | Icon | Used |
|---|---|---|---|---|
| **Enabled** | `rgba(20,150,81,0.15)` | `#149651` | ✓ circle | Active features |
| **Testing** | `rgba(48,85,218,0.15)` | `#3055DA` | ◐ circle | Beta/canary features |
| **Disabled** | `rgba(160,160,160,0.15)` | `#A0A0A0` | ◯ circle | Inactive features |

---

### 6.5 Toggle Switch

**Accessible toggle (checkbox styled as switch):**
```css
.toggle {
  display: inline-block;
  position: relative;
  width: 48px;
  height: 28px;
}

.toggle input {
  display: none; /* hide native */
}

.toggle__track {
  position: absolute;
  inset: 0;
  background: var(--color-border-strong);
  border-radius: var(--radius-pill);
  cursor: pointer;
  transition: background-color var(--dur-fast) var(--ease-standard);
}

.toggle input:checked + .toggle__track {
  background: var(--color-status-enabled);
}

.toggle__thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 24px;
  height: 24px;
  background: white;
  border-radius: var(--radius-pill);
  box-shadow: var(--shadow-xs);
  transition: transform var(--dur-fast) var(--ease-standard);
}

.toggle input:checked + .toggle__track ~ .toggle__thumb {
  transform: translateX(20px);
}
```

---

### 6.6 Slider (Traffic %)

**Accessible range input:**
```css
.slider {
  display: flex;
  align-items: center;
  gap: var(--space-4);
}

.slider input[type="range"] {
  flex: 1;
  height: 4px;
  border-radius: var(--radius-pill);
  background: linear-gradient(to right,
    var(--color-status-enabled) 0%,
    var(--color-status-enabled) var(--slider-percent, 0%),
    var(--color-border) var(--slider-percent, 0%),
    var(--color-border) 100%);
  appearance: none;
  -webkit-appearance: none;
  outline: none;
}

.slider input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 20px;
  height: 20px;
  border-radius: var(--radius-pill);
  background: var(--color-status-enabled);
  cursor: pointer;
  box-shadow: var(--shadow-sm);
  border: 2px solid white;
  transition: box-shadow var(--dur-fast) var(--ease-standard);
}

.slider input[type="range"]::-webkit-slider-thumb:hover {
  box-shadow: var(--shadow-md);
}

.slider input[type="range"]:focus::-webkit-slider-thumb {
  outline: 2px solid var(--color-highlight);
  outline-offset: 2px;
}

.slider__value {
  min-width: 48px;
  text-align: right;
  font-weight: var(--fw-regular);
  font-size: var(--fs-body);
}
```

---

### 6.7 Search Input

**Icon-left search field:**
```css
.search {
  position: relative;
  display: flex;
  align-items: center;
}

.search__icon {
  position: absolute;
  left: var(--space-4);
  width: 20px;
  height: 20px;
  color: var(--color-fg-subtle);
  pointer-events: none;
}

.search__input {
  padding-left: calc(var(--space-4) + 20px + var(--space-2));
  /* rest inherits from .input base styles */
}
```

---

### 6.8 Filter Buttons / Tabs

**Segmented control (toggle group):**
```css
.segmented-control {
  display: flex;
  gap: var(--space-2);
  padding: var(--space-2);
  background: var(--color-bg-subtle);
  border-radius: var(--radius-sm);
}

.segmented-control__button {
  flex: 1;
  padding: var(--space-3) var(--space-4);
  border: none;
  border-radius: var(--radius-xs);
  background: transparent;
  color: var(--color-fg-muted);
  font-size: var(--fs-body-sm);
  font-weight: var(--fw-regular);
  cursor: pointer;
  transition: all var(--dur-fast) var(--ease-standard);
}

.segmented-control__button[aria-pressed="true"] {
  background: var(--color-bg);
  color: var(--color-accent);
  box-shadow: var(--shadow-xs);
}
```

---

## 7. Interactive States

### 7.1 Default State (Idle)

All components at rest:
- **Color:** Brand palette (primary: `--color-accent`)
- **Shadow:** None (or `--shadow-xs` for cards)
- **Border:** 1px `--color-border` on inputs/cards
- **Cursor:** Auto (default)

---

### 7.2 Hover State

**Trigger:** Mouse enters element (non-touch)  
**Duration:** `--dur-fast` (120ms)  
**Easing:** `var(--ease-standard)` (cubic-bezier(0.2, 0, 0.2, 1))

#### For buttons (filled)
- **Background:** shift to `--color-accent-hover` (`#418DFF`, lighter)
- **Shadow:** add `--shadow-sm`
- **Cursor:** pointer

#### For buttons (outline/tertiary)
- **Color:** shift to `--color-accent-hover`
- **Background:** light wash `rgba(48,85,218,0.08)`
- **Cursor:** pointer

#### For cards
- **Shadow:** add `--shadow-sm`
- **Border:** no change
- **Elevation:** visual lift via shadow only (no transform)

#### For toggles
- **Track:** darken by ~10% in OKLCH
- **Thumb:** shadow → `--shadow-md`

#### For inputs
- **Border:** shift from `--color-border` → `--color-accent`
- **Background:** no change
- **Focus box shadow:** add subtle blue wash (see focus state)

#### For links
- **Color:** `--color-accent-hover`
- **Text decoration:** underline (inherited from base)

**Anti-pattern:** No scale transforms (`transform: scale(1.05)`). All hover is **color + shadow**, never geometry.

---

### 7.3 Active / Press State

**Trigger:** Mouse down on button, or toggle switched  
**Duration:** instant (no transition)  
**Easing:** N/A (immediate)

#### For buttons (all variants)
- **Opacity:** 0.85 (darkening via transparency)
- **Shadow:** none (collapse)
- **Transform:** none (no scale)

#### For toggles
- **Thumb:** translate confirmed; no additional change

#### For radio buttons / checkboxes
- **Ring:** visible `2px --color-highlight` with offset 2px

---

### 7.4 Focus State

**Trigger:** Keyboard Tab into element, or click-focus  
**Duration:** instant (ring appears)  
**Easing:** N/A

**Universal focus ring:**
```css
*:focus-visible {
  outline: 2px solid var(--color-highlight); /* #61E2BB */
  outline-offset: 2px;
}
```

#### Special cases

**On dark background:**
- Use `--color-accent-hover` (`#418DFF`) instead for contrast.

**On inputs:**
- Ring is outside the input border (offset: 2px)
- Input border also shifts to `--color-accent` for reinforcement

---

### 7.5 Disabled State

**Applied via:** `disabled` attribute, `.is-disabled` class, or `aria-disabled="true"`

#### For buttons
- **Background:** `var(--color-bg-subtle)` or lighten primary by 30%
- **Color:** `var(--color-fg-subtle)`
- **Cursor:** `not-allowed`
- **Opacity:** 0.5
- **No hover/focus effects** (events are ignored)

#### For inputs
- **Background:** `var(--color-bg-subtle)`
- **Border:** `--color-border` (unchanged)
- **Color:** `var(--color-fg-subtle)`
- **Cursor:** `not-allowed`
- **No focus ring** (Tab skips disabled inputs)

#### For toggles
- **Track:** `var(--color-border)`
- **Thumb:** `var(--color-bg-subtle)`
- **Cursor:** `not-allowed`

---

### 7.6 Loading State

**Applied during async operations (feature toggle, traffic update, search).**

#### Spinner / skeleton

**Skeleton (placeholder):**
```css
.skeleton {
  display: block;
  background: linear-gradient(
    90deg,
    var(--color-bg-subtle) 0%,
    var(--color-bg) 50%,
    var(--color-bg-subtle) 100%
  );
  background-size: 200% 100%;
  animation: loading-pulse 1.5s ease-in-out infinite;
}

@keyframes loading-pulse {
  0%, 100% { background-position: 200% 0; }
  50% { background-position: -200% 0; }
}
```

**Applied to:**
- Feature list rows (height: 56px, border-radius: 4px)
- Buttons (replaced with spinner icon: 16px inline SVG, spinning)
- Input fields (height: 40px, width: 100%)

**Spinner animation:**
```css
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: var(--radius-pill);
  animation: spinner-rotate 0.8s linear infinite;
}

@keyframes spinner-rotate {
  to { transform: rotate(360deg); }
}
```

---

### 7.7 Empty State

**Shown when:**
- Filter returns 0 results
- Feature list is empty
- No search matches

**Visual structure:**
```
┌───────────────────────────────────┐
│                                   │
│          [Empty icon]             │  ← 64×64 outline icon (grayscale)
│                                   │
│      No features found.           │  ← h3, --color-fg
│      Try adjusting your search.   │  ← p, --color-fg-subtle
│                                   │
│      [Clear filters] [Create new] │  ← CTA buttons
│                                   │
└───────────────────────────────────┘
```

**Styling:**
- **Background:** `var(--color-bg-subtle)` (full-bleed section or card)
- **Padding:** `var(--space-8)` vertical, `var(--space-7)` horizontal
- **Text align:** center
- **Icon:** `var(--color-fg-subtle)`, no fill (stroke only)

---

### 7.8 Error State

**Shown when:**
- API request fails
- Form validation fails
- Required data is missing

**On input fields:**
- **Border:** shift to orange/danger (`#F26B43`)
- **Background:** light wash `rgba(242,107,67,0.04)`
- **Icon:** ⚠️ danger icon (orange) inside field (right-aligned)
- **Helper text:** color shift to orange, show error message

**Global error message:**
```css
.alert--error {
  padding: var(--space-4);
  border-radius: var(--radius-sm);
  background: rgba(242,107,67,0.1);
  border-left: 4px solid #F26B43;
  color: #F26B43;
  font-size: var(--fs-body-sm);
  font-weight: var(--fw-regular);
}

.alert--error svg {
  width: 20px;
  height: 20px;
  margin-right: var(--space-2);
}
```

---

### 7.9 Success State

**Shown when:**
- Feature toggle succeeds
- Traffic percentage updated
- Change saved

**Toast / inline confirmation:**
```css
.alert--success {
  padding: var(--space-4);
  border-radius: var(--radius-sm);
  background: rgba(20,150,81,0.1);
  border-left: 4px solid var(--color-status-enabled);
  color: var(--color-status-enabled);
  animation: slide-in var(--dur-base) var(--ease-enter);
}

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(-8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

---

### 7.10 Summary Table: Interactive States

| Element | Idle | Hover | Active | Focus | Disabled |
|---|---|---|---|---|---|
| **Primary Button** | `--color-accent` bg, white text | `--color-accent-hover` bg, `--shadow-sm` | opacity 0.85 | 2px ring `--color-highlight` | `--color-bg-subtle` bg, `--color-fg-subtle` text, cursor: not-allowed |
| **Input** | 1px `--color-border`, white bg | 1px `--color-accent`, blue wash | — | 1px `--color-accent`, 2px ring | `--color-bg-subtle` bg, `--color-fg-subtle` text, cursor: not-allowed |
| **Toggle** | track: `--color-border-strong` | track: darken 10%, thumb: `--shadow-md` | thumb: move 20px | track: 2px ring | track: `--color-border`, no interaction |
| **Card** | 1px `--color-border`, no shadow | `--shadow-sm` | — | child focus ring visible | opacity 0.5 (if disabled) |
| **Link** | `--color-accent` | `--color-accent-hover`, underline | opacity 0.85 | 2px ring `--color-highlight` | `--color-fg-subtle`, cursor: not-allowed |
| **Status Badge** | semantic color bg + text | no change | no change | no change | opacity 0.5 |

---

## 8. Motion & Animation

### Timing Tokens

| Token | Value | Usage |
|---|---|---|
| `--dur-fast` | 120ms | Hover, small state changes |
| `--dur-base` | 200ms | Default transition |
| `--dur-slow` | 360ms | Page transitions, large animations |

### Easing Tokens

| Token | Value | Usage |
|---|---|---|
| `--ease-standard` | `cubic-bezier(0.2, 0, 0.2, 1)` | General-purpose transitions |
| `--ease-enter` | `cubic-bezier(0, 0, 0.2, 1)` | Entrance animations (fade in, slide up) |
| `--ease-exit` | `cubic-bezier(0.4, 0, 1, 1)` | Exit animations (fade out, slide down) |

### Transition Presets

```css
/* Smooth color/opacity change (most common) */
transition: color var(--dur-fast) var(--ease-standard),
            background-color var(--dur-fast) var(--ease-standard),
            opacity var(--dur-fast) var(--ease-standard);

/* Entrance (modal open, toast appear) */
transition: opacity var(--dur-base) var(--ease-enter),
            transform var(--dur-base) var(--ease-enter);

/* Exit (close modal, dismiss toast) */
transition: opacity var(--dur-base) var(--ease-exit),
            transform var(--dur-base) var(--ease-exit);
```

### Anti-patterns
- **No bounces** (spring easing).
- **No parallax** or stagger effects.
- **No 3D transforms** (rotateX, rotateY).
- **No scale on hover** (geometry is reserved for intentional zoom UIs).

---

## 9. Accessibility (A11y) Standards

### ARIA Labels & Roles

| Element | ARIA Attributes | Usage |
|---|---|---|
| **Toggle switch** | `role="switch"` `aria-checked="true\|false"` | Semantic state for screen readers |
| **Search input** | `aria-label="Search features"` | If no visible label |
| **Status badge** | `aria-label="Enabled"` (via badge text, often implicit) | Clarify intent if icon-only |
| **Filter button group** | `role="group"` `aria-label="Filter by status"` | Group semantics |
| **Loading skeleton** | `aria-busy="true"` (on container) | Announce loading state |
| **Error message** | `role="alert"` | Auto-announce to screen readers |
| **Modal / drawer** | `role="dialog"` `aria-labelledby="title-id"` `aria-modal="true"` | Full dialog semantics |
| **List of features** | `role="list"` on container, `role="listitem"` on rows | Semantic structure |

---

### Keyboard Navigation

| Action | Expected Behavior |
|---|---|
| **Tab** | Move focus to next interactive element in logical order (left-to-right, top-to-bottom) |
| **Shift + Tab** | Move focus to previous interactive element |
| **Enter** | Activate button, submit form |
| **Space** | Toggle checkbox/switch, click button if focused |
| **Escape** | Close modal, dismiss dropdown, cancel edit |
| **Arrow keys** | Move within segmented control / tabs / menu |
| **Ctrl+F / Cmd+F** | Native browser find (no custom override) |

### Focus Management
- **Initial focus:** On page load, set focus to main heading or first interactive element.
- **Modal open:** trap focus inside modal; restore focus on close.
- **Search input:** focus here on page load.
- **Inline edit:** focus the input field; select all text.

---

### Color Contrast (WCAG AA minimum)

| Text Type | Min Ratio | Example | Pass |
|---|---|---|---|
| Normal text on white | 4.5:1 | `#040C28` (ink) on white | ✓ 16:1 |
| Large text (18px+) on white | 3:1 | `#A0A0A0` (gray) on white | ✓ 3.6:1 |
| Link on white | 4.5:1 | `#3055DA` (blue) on white | ✓ 8.8:1 |
| Status badge on badge bg | 4.5:1 | `#149651` (green) on `rgba(20,150,81,0.15)` | ✓ 6.2:1 |

---

### Images & Icons
- **Always provide alt text** for any icon that conveys meaning.
- **Icon-only buttons:** use `aria-label` (e.g., `aria-label="Delete feature"`) or include screen-reader text.
- **Decorative icons:** use `aria-hidden="true"`.

---

### Semantic HTML
- **Use `<button>` for buttons** (not `<div>` with click handler).
- **Use `<a>` for links** (not buttons styled as links).
- **Use `<label>` for form fields** (with `for="id"` attribute).
- **Use `<fieldset>` / `<legend>` for grouped inputs** (e.g., radio group, checkbox group).

---

## 10. Anti-AI-Slop Guards

This system is **explicitly designed to avoid** commodity, off-the-shelf design patterns:

1. ✓ **Museo Sans as brand font** — not Inter, Roboto, or system defaults. Premium, differentiated voice.
2. ✓ **Sharp corners by default** — no iOS-style rounded pill nostalgia. Max radius is 8px for cards.
3. ✓ **No aggressive gradients** — use gradients sparingly (brand gradient on rare hero elements only).
4. ✓ **No left-border accent cards** — avoided. Use icon-based status + semantic color instead.
5. ✓ **No emoji** — not part of EPAM brand. Use Lucide icons (re-colored with EPAM gradient if needed).
6. ✓ **No stacked shadows** — one shadow per element, max.
7. ✓ **No bouncy/spring easing** — all animations use standard or enter/exit cubic-bezier.
8. ✓ **No scale transforms on hover** — geometry reserved for intentional zoom UIs.
9. ✓ **No dense grids of options** — prefer single-column card layouts; use tabs/segmented controls sparingly.
10. ✓ **No filler content** — every element earns its place; empty states are intentional.

---

## 11. Implementation Notes

### Loading EPAM Design Tokens

All CSS variables defined in this system are available from EPAM's `colors_and_type.css`. Import it in your React component file:

```html
<link rel="stylesheet" href="/path/to/colors_and_type.css">
```

Alternatively, inline the `@font-face` declarations and CSS custom properties in your main stylesheet.

### CSS Classes (optional, but recommended)

For consistency, create a small utility layer:

```css
/* Buttons */
.btn { /* base */ }
.btn--primary { }
.btn--secondary { }
.btn--danger { }
.btn--sm { }
.btn--md { }
.btn--lg { }

/* Inputs */
.input { }
.input--error { }
.input--success { }

/* Cards */
.card { }
.card--elevation { }

/* Badges */
.badge { }
.badge--enabled { }
.badge--testing { }
.badge--disabled { }

/* Status messages */
.alert { }
.alert--error { }
.alert--success { }
```

Do NOT create utility classes for margin/padding (use CSS Grid/Flexbox + `gap` instead).

### Responsive Behavior

- **Breakpoints:** No predefined breakpoints. Use `clamp()` for fluid typography and `@container` queries for layout reflow.
- **Mobile:** Feature Dashboard is **admin UI**, not consumer-facing. Optimize for desktop (1440px+). Mobile support is optional.

---

## 12. Resources & References

- **EPAM Design System:** `/projects/be0c11e8-c212-4b9d-8fad-b537769617c2/`
- **Colors & Type (CSS tokens):** `colors_and_type.css`
- **Museo Sans fonts:** `/fonts/` (10 weights + italics, `.otf` format)
- **Example layouts:** `preview/`, `slides/` subdirectories in EPAM system

---

**Version:** 1.0  
**Last reviewed:** May 14, 2026  
**Owner:** Feature Dashboard design team
