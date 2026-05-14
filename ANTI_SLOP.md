# Anti-AI-slop Supplement к DESIGN.md

```markdown
## Anti-AI-slop Guards (mandatory)

### Layout & composition

- **NO 2-column comparison blocks.** Forbidden patterns: «Without us / With us»,
  «Before / After», «Old way / New way» side-by-side. Use single-column
  storytelling or 3-card grid instead. If comparison is unavoidable —
  use a table, not two columns.
- **ASCII wireframe first.** Before generating UI code: produce an ASCII
  wireframe of the page layout (HERO / sections / cards / footer).
  Then generate code that matches the wireframe EXACTLY. Do not invent
  additional sections.
- **Generous spacing between sections.** Padding between major sections:
  minimum 48px on desktop, 32px on mobile. Section internal padding:
  minimum 24px. Never 12-16px between sections.

### Visual style

- **NO gradients on backgrounds, buttons, or hero blocks.** Use solid
  colors only — clean white / gray / black / metallic palette from
  DESIGN.md tokens. Single exception: skeleton loader shimmer animation.
- **Cards: subtle elevation, NEVER heavy borders.** Use 1px border at
  10% opacity (`border: 1px solid color-mix(in srgb, var(--border) 10%, transparent)`)
  or no border with background contrast. Forbidden: `border: 2px+`,
  `border: 3px solid black`, double borders.
- **shadcn/ui MUST be customized.** Do not ship default shadcn theme
  (slate / zinc / gray out-of-box). Use TweakCN.com to generate
  brand-aligned theme, export as CSS variables, paste into globals.css.

### UX-first thinking

- **User journey before visual style.** Before generating any page —
  answer: (1) Who is on this page? (2) What are they trying to do?
  (3) Where is the primary CTA? (4) What is the next logical step?
  Visual decisions follow user journey, not the other way around.
- **Primary CTA must be above the fold.** Hero with full-screen height
  pushing content below fold = anti-pattern. Hero takes max 60vh,
  primary CTA visible without scroll on 1366×768 desktop.
- **Contrast ≥ 4.5:1 for body text always.** No light-gray text on
  white because «it looks aesthetic in screenshots». UX > screenshot
  beauty.

### Magic phrase (put first in system prompt)

> «Be a human designer so it doesn't look like AI. With design taste.»
```
