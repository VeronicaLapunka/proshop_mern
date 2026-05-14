# Accessibility Design Guide for ProShop

**Last updated:** May 2026  
**WCAG Target:** 2.1 Level AA  
**Scope:** All pages (Home, Product, Cart, Checkout, Orders, Admin Dashboard, Feature Dashboard)  
**Legal baseline:** WCAG 2.1 AA, ADA compliance, Section 508 equivalent

---

## 1. Core Principle

**Accessibility is not optional — it is a legal requirement and an ethical responsibility.**

Build inclusive experiences from the start, not as an afterthought. Use semantic HTML first, ARIA second. Test with **real assistive technologies** (NVDA, VoiceOver), not just automated scanners.

---

## 2. WCAG 2.1 Level AA Compliance Map

All features must meet **minimum Level AA**. AAA is optional but encouraged for key user journeys.

| WCAG Criterion | Category | Level | ProShop Scope |
|---|---|---|---|
| 1.1.1 Non-text Content | Perceivable | A | All images must have alt text; product photos must describe visually important details |
| 1.2.1 Audio/Video | Perceivable | A | Product demo videos must have captions (if used) |
| 1.3.1 Info & Relationships | Perceivable | A | Proper semantic markup (heading hierarchy, form associations) |
| 1.3.2 Meaningful Sequence | Perceivable | A | Logical reading order matches visual layout |
| 1.4.3 Contrast (Minimum) | Perceivable | AA | 4.5:1 normal text, 3:1 large text / UI components |
| 1.4.4 Text Resize | Perceivable | AA | Content readable at 200% zoom without horizontal scroll |
| 1.4.5 Images of Text | Perceivable | AA | Avoid text embedded in images (use real text + CSS) |
| 2.1.1 Keyboard | Operable | A | All functionality keyboard accessible (Tab, Enter, Space, Escape) |
| 2.1.2 No Keyboard Trap | Operable | A | Every component escapable via keyboard |
| 2.4.3 Focus Order | Operable | A | Tab order logical (top-to-bottom, left-to-right) |
| 2.4.7 Focus Visible | Operable | AA | Visible focus indicator on all interactive elements (≥3px outline) |
| 2.5.1 Pointer Gestures | Operable | A | Single-pointer alternatives for complex gestures (N/A for ProShop mostly) |
| 2.5.5 Target Size | Operable | AAA | Touch targets ≥44×44px (buttons, links, form inputs) |
| 3.1.1 Language of Page | Understandable | A | Page language declared in `<html lang="en">` |
| 3.2.1 On Focus | Understandable | A | No unexpected context changes when element receives focus |
| 3.2.2 On Input | Understandable | A | Confirm unexpected changes before submitting (e.g., form auto-submit) |
| 3.3.1 Error Identification | Understandable | A | Errors clearly identified and described (not color alone) |
| 3.3.2 Labels or Instructions | Understandable | A | All form inputs have associated labels or instructions |
| 3.3.4 Error Prevention | Understandable | AA | Reversible actions (or confirmation for critical operations like delete/checkout) |
| 4.1.1 Parsing | Robust | A | Valid HTML (no duplicate IDs, proper nesting) |
| 4.1.2 Name, Role, Value | Robust | A | All UI components have accessible name, role, and state |
| 4.1.3 Status Messages | Robust | AA | Changes announced to screen readers (e.g., "Item added to cart") |

---

## 3. Semantic HTML Foundation

**Use semantic HTML first; ARIA is a second resort.**

### Correct Semantic Elements

| Element | Usage | Bad Example | Good Example |
|---|---|---|---|
| `<button>` | Clickable action | `<div onclick="...">Click</div>` | `<button onclick="...">Click</button>` |
| `<a>` | Navigation/links | `<div onClick={navigate}>Link</div>` | `<a href="/page">Link</a>` |
| `<header>` | Page header / nav | `<div class="header">` | `<header>` |
| `<nav>` | Navigation region | `<div class="nav">` | `<nav aria-label="Main navigation">` |
| `<main>` | Primary content | `<div class="main-content">` | `<main>` |
| `<section>` | Thematic grouping | `<div>` | `<section aria-labelledby="h2-id">` |
| `<article>` | Self-contained content (product card, blog post) | `<div class="product">` | `<article>` |
| `<aside>` | Sidebar, related content | `<div class="sidebar">` | `<aside aria-label="Related products">` |
| `<footer>` | Page footer | `<div class="footer">` | `<footer>` |
| `<form>` | Form container | `<div>` | `<form>` |
| `<fieldset>` | Group form inputs (radio, checkbox) | Multiple inputs without wrapper | `<fieldset><legend>Shipping method</legend>...</fieldset>` |
| `<label>` | Associate text with input | `<span for="email">Email</span><input id="email">` | `<label for="email">Email</label><input id="email">` |
| `<h1>–<h6>` | Heading hierarchy | `<div class="title">` | `<h1>`, `<h2>`, etc. |

### Semantic HTML in React

```jsx
// ❌ Bad: divs everywhere
<div className="header">
  <div className="nav">
    <div onClick={goHome}>Home</div>
    <div onClick={goAbout}>About</div>
  </div>
</div>

// ✅ Good: semantic structure
<header>
  <nav aria-label="Main navigation">
    <a href="/">Home</a>
    <a href="/about">About</a>
  </nav>
</header>
```

---

## 4. Keyboard Navigation Requirements

**Every interactive element must be keyboard accessible.**

### Keyboard Controls (Universal)

| Key | Action | Elements |
|---|---|---|
| **Tab** | Move focus to next interactive element | Buttons, links, inputs, toggles |
| **Shift + Tab** | Move focus to previous interactive element | All interactive |
| **Enter** | Activate button, submit form, follow link | Buttons, links, form submission |
| **Space** | Toggle checkbox/radio/switch, click button (if focused) | Buttons, checkboxes, radios, toggles |
| **Escape** | Close modal, dismiss dropdown, cancel edit | Modals, dropdowns, inline editors |
| **Arrow keys** | Navigate within groups | Radio buttons, tabs, segmented controls, menus |
| **Ctrl/Cmd + F** | Browser find (native, do not override) | N/A |

### Tab Order

- **Logical order:** Top-to-bottom, left-to-right, visually
- **Never use negative `tabindex`** except for focus management (focus trap in modals)
- **Positive `tabindex` is anti-pattern** — rely on DOM order instead
- **Skip links:** Place at the very start of body to jump to main content

```html
<body>
  <a href="#main-content" class="skip-link">Skip to main content</a>
  
  <header>
    <!-- Navigation -->
  </header>
  
  <main id="main-content" tabindex="-1">
    <!-- Main content (receives focus after skip link) -->
  </main>
</body>
```

### Keyboard Traps (Forbidden)

**A keyboard trap is any element you cannot escape from using keyboard alone.**

| Bad Example | Issue | Fix |
|---|---|---|
| Modal without Escape handler | Cannot close | Add `onKeyDown={(e) => e.key === 'Escape' && close()}` |
| Iframe without focus trap | Focus goes into iframe, cannot escape | Trap focus inside; move to next element on Tab at boundary |
| Autocomplete dropdown without arrow key support | Cannot navigate suggestions | Implement arrow key navigation + Enter to select |
| Select dropdown that doesn't trap focus | Tab skips around | Use `tabindex="-1"` on menu items, enable focus trap on open |

### Focus Management (React)

```jsx
import { useRef, useEffect } from 'react'

// Modal with focus trap
const Modal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null)
  const firstButtonRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Focus first interactive element in modal
      firstButtonRef.current?.focus()
      
      // Trap focus inside modal
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-labelledby="modal-title"
      aria-modal="true"
    >
      <h2 id="modal-title">Confirm Delete</h2>
      <p>Are you sure?</p>
      <button ref={firstButtonRef} onClick={() => { /* delete */ }}>
        Delete
      </button>
      <button onClick={onClose}>Cancel</button>
    </div>
  )
}
```

---

## 5. Screen Reader Support (ARIA & Semantic HTML)

**Test with real screen readers: NVDA (Windows, free), VoiceOver (macOS/iOS, built-in), TalkBack (Android).**

### Essential ARIA Attributes

| Attribute | Usage | Example |
|---|---|---|
| `role="..."` | Override/clarify element role (use sparingly) | `<div role="button">` (last resort) |
| `aria-label="..."` | Accessible name for icon-only elements | `<button aria-label="Close dialog">×</button>` |
| `aria-labelledby="id"` | Link to heading/label element | `<dialog aria-labelledby="title">` |
| `aria-describedby="id"` | Additional description for input | `<input aria-describedby="hint error">` |
| `aria-hidden="true"` | Hide from screen readers (decorative icons) | `<svg aria-hidden="true">` |
| `aria-live="polite"` | Announce dynamic content updates (non-urgent) | Cart count badge |
| `aria-live="assertive"` | Announce urgent updates (e.g., errors) | Error messages, timers |
| `aria-busy="true/false"` | Indicate loading state | `<button aria-busy={isLoading}>` |
| `aria-expanded="true/false"` | Indicate expanded/collapsed state | Accordion, dropdown |
| `aria-current="page"` | Mark current navigation item | `<a href="/products" aria-current="page">Products</a>` |
| `aria-pressed="true/false"` | Toggle button state | `<button aria-pressed={isActive}>Toggle</button>` |
| `aria-invalid="true/false"` | Mark form field as invalid | `<input aria-invalid={hasError}>` |
| `aria-required="true"` | Mark form field as required | `<input aria-required="true">` |
| `aria-atomic="true"` | Announce entire region on update (with live) | Status messages, cart count |

### ARIA DO's & DON'Ts

| DO | DON'T |
|---|---|
| Use semantic HTML first (`<button>`, `<nav>`) | Use ARIA when semantic element exists |
| `aria-label` for icon-only buttons | Duplicate info: label + identical aria-label |
| `aria-live="polite"` for non-critical updates | Overuse `aria-live` (becomes annoying) |
| `aria-describedby` for additional form hints | Put `aria-label` on non-interactive elements |
| Test with real screen readers (NVDA, VoiceOver) | Rely only on automated tools (false positives) |
| `role="alert"` for error messages | `role="button"` on actual `<button>` elements |

### Screen Reader Announcements

**ProShop-specific scenarios:**

| Event | Announcement | Implementation |
|---|---|---|
| Product added to cart | "Product added to cart. Cart now contains 3 items." | `<div role="status" aria-live="polite" aria-atomic="true">` |
| Form field error | "Email address required. Must be valid email." | `aria-invalid="true"` + `aria-describedby="error-id"` |
| Price updated | "Price updated to $49.99" | `aria-live="polite"` on price element |
| Order placed | "Order confirmed. Order #12345 placed successfully." | `role="alert"` for critical confirmations |
| Filter applied | "Products filtered by category. 24 results." | `aria-live="polite"` on results count |

---

## 6. Form Accessibility

### Form Label Association

```html
<!-- ❌ Bad: placeholder instead of label -->
<input type="email" placeholder="Enter email">

<!-- ✓ Good: explicit label -->
<label for="email">Email address</label>
<input type="email" id="email" name="email" required>

<!-- ✓ Good: implicit label (wrap input) -->
<label>
  Email address
  <input type="email" name="email" required>
</label>
```

### Form Errors (WCAG 3.3.1, 3.3.2)

```html
<form>
  <div>
    <label for="password">Password</label>
    <input
      type="password"
      id="password"
      name="password"
      required
      aria-describedby="pwd-hint pwd-error"
      aria-invalid="false"
    />
    <div id="pwd-hint" class="hint">
      Minimum 8 characters
    </div>
    <div id="pwd-error" role="alert" aria-live="polite">
      <!-- Error message appears here if validation fails -->
    </div>
  </div>
  <button type="submit">Register</button>
</form>
```

### Required Fields

```html
<!-- ❌ Bad: only visually marked with red * -->
<label>Email <span style="color: red;">*</span></label>

<!-- ✓ Good: marked both visually & semantically -->
<label for="email">
  Email address
  <span aria-label="required">*</span>
</label>
<input type="email" id="email" required aria-required="true">

<!-- ✓ Also good: use HTML5 required -->
<input type="email" id="email" required>
<!-- Browser announces "required" automatically -->
```

### Checkout Form (Critical User Journey)

```jsx
const CheckoutForm = () => {
  const [errors, setErrors] = useState({})

  return (
    <form onSubmit={handleSubmit}>
      <fieldset>
        <legend>Shipping Address</legend>
        
        <div className="form-group">
          <label htmlFor="address">Street Address</label>
          <input
            id="address"
            type="text"
            required
            aria-invalid={!!errors.address}
            aria-describedby={errors.address ? "address-error" : undefined}
          />
          {errors.address && (
            <div id="address-error" role="alert">
              {errors.address}
            </div>
          )}
        </div>

        <div className="form-group">
          <fieldset>
            <legend>Shipping Method</legend>
            <label>
              <input type="radio" name="shipping" value="standard" required />
              Standard ($5.99)
            </label>
            <label>
              <input type="radio" name="shipping" value="express" required />
              Express ($12.99)
            </label>
          </fieldset>
        </div>
      </fieldset>

      <button type="submit" disabled={isLoading} aria-busy={isLoading}>
        {isLoading ? 'Processing...' : 'Continue to Payment'}
      </button>
    </form>
  )
}
```

---

## 7. Color Contrast & Visual Accessibility

### Contrast Ratios (WCAG 1.4.3)

| Text Type | Level AA | Level AAA |
|---|---|---|
| Normal text (< 18px) | 4.5:1 | 7:1 |
| Large text (≥ 18px or 14px bold) | 3:1 | 4.5:1 |
| UI components (border, icon, underline) | 3:1 | 4.5:1 |

### Testing Color Contrast

**Tools:**
- WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
- Chrome DevTools: Inspect element → Accessibility panel
- axe DevTools browser extension
- Stark (Figma plugin)

**ProShop palette compliance:**

| Element | Foreground | Background | Ratio | AA? | AAA? |
|---|---|---|---|---|---|
| Body text | `#040C28` (ink) | `#FFFFFF` (white) | 16:1 | ✓ | ✓ |
| Secondary text | `#A0A0A0` (gray) | `#FFFFFF` | 3.6:1 | ✓ | ✗ |
| Link | `#3055DA` (blue) | `#FFFFFF` | 8.8:1 | ✓ | ✓ |
| Enabled badge | `#149651` (green) | `rgba(20,150,81,0.15)` | 6.2:1 | ✓ | ✓ |
| Disabled button | `#A0A0A0` (gray) | `#F6F9FD` (paper) | 4.1:1 | ✓ | ✗ |
| Error text | `#F26B43` (orange) | `#FFFFFF` | 5.1:1 | ✓ | ✓ |

**Anti-pattern:** Do NOT use low contrast for disabled states. Instead, use `opacity: 0.5` or desaturate.

### Text Scaling (WCAG 1.4.4)

All content must remain readable at **200% browser zoom** without horizontal scrolling.

```css
/* ✓ Good: use relative units */
body {
  font-size: 16px; /* base */
  line-height: 1.5;
}

h1 { font-size: 2rem; } /* 32px at 16px base */

/* ❌ Bad: fixed widths prevent scaling */
body { width: 1200px; } /* horizontal scroll at zoom */

/* ✓ Good: use max-width + responsive */
.container { max-width: 1200px; width: 100%; }
```

---

## 8. Images & Alt Text

### Alt Text Guidelines (WCAG 1.1.1)

| Image Type | Alt Text | Example |
|---|---|---|
| **Product photo** | Describe visually important details | `alt="Blue wool sweater with v-neck, size M"` |
| **Product on model** | Describe fit, color, context | `alt="Model wearing blue wool sweater"` |
| **Icon (meaningful)** | Describe purpose | `alt="Shopping cart icon"` (if icon-only) or use `aria-label` |
| **Icon (decorative)** | Empty or aria-hidden | `alt=""` or `aria-hidden="true"` |
| **Chart/graph** | Describe data/trend | `alt="Sales trend shows 25% growth in Q2"` |
| **Logo** | Brand name or skip if decorative | `alt="ProShop logo"` or `alt=""` |
| **Screenshot** | Describe key content | `alt="Screenshot of checkout page with payment options"` |

### React Image Component

```jsx
// ✓ Good: semantic, accessible
const ProductImage = ({ product, isDecorative = false }) => {
  if (isDecorative) {
    return <img src={product.image} alt="" aria-hidden="true" />
  }
  
  return (
    <img
      src={product.image}
      alt={`${product.name} - ${product.color || ''} - ${product.size || ''}`}
      width={product.imageWidth}
      height={product.imageHeight}
      loading="lazy"
    />
  )
}

// Usage in product card
<article>
  <h3>{product.name}</h3>
  <ProductImage product={product} />
  <p>${product.price}</p>
</article>
```

---

## 9. Component Accessibility Patterns

### Accessible Button

```jsx
// ✓ Good: semantic, with proper states
<button
  type="button"
  onClick={handleClick}
  disabled={isDisabled}
  aria-busy={isLoading}
  aria-label={buttonLabel}
>
  {isLoading ? <Spinner aria-hidden="true" /> : 'Click me'}
</button>

// Icon-only button
<button
  type="button"
  onClick={handleDelete}
  aria-label="Delete product"
  title="Delete product"
>
  <TrashIcon aria-hidden="true" />
</button>

// Toggle button
<button
  type="button"
  aria-pressed={isActive}
  onClick={() => setActive(!isActive)}
>
  {isActive ? 'Active' : 'Inactive'}
</button>
```

### Accessible Link

```jsx
// ✓ Good: real <a> tag, clear link text
<a href="/products">Browse all products</a>

// ✓ Good: link with icon
<a href="/product/123">
  <ProductImage product={product} isDecorative={true} />
  <span>{product.name}</span>
</a>

// ❌ Bad: "Click here" (non-descriptive)
<a href="/products">Click here</a>

// ❌ Bad: div styled as link (no keyboard support)
<div onClick={navigate} style={{cursor: 'pointer'}}>
  Products
</div>
```

### Accessible Dropdown / Select

```jsx
const DropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      triggerRef.current?.focus()
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      const firstItem = menuRef.current?.querySelector('[role="menuitem"]')
      firstItem?.focus()
    }
  }

  return (
    <div>
      <button
        ref={triggerRef}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen(!isOpen)}
      >
        Options
      </button>
      {isOpen && (
        <ul
          ref={menuRef}
          role="menu"
          onKeyDown={handleKeyDown}
        >
          <li role="menuitem"><a href="/account">Account</a></li>
          <li role="menuitem"><a href="/orders">Orders</a></li>
          <li role="menuitem"><button onClick={logout}>Logout</button></li>
        </ul>
      )}
    </div>
  )
}
```

### Accessible Modal / Dialog

```jsx
const Modal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef(null)
  const firstButtonRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      // Focus first button
      firstButtonRef.current?.focus()
      
      // Prevent body scroll
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = 'auto'
      }
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="modal-backdrop"
        onClick={onClose}
        aria-hidden="true"
      />
      
      {/* Dialog */}
      <div
        ref={modalRef}
        role="dialog"
        aria-labelledby="modal-title"
        aria-modal="true"
        className="modal"
      >
        <div className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div className="modal-body">{children}</div>
        <div className="modal-footer">
          <button
            ref={firstButtonRef}
            onClick={onClose}
            type="button"
          >
            Confirm
          </button>
          <button onClick={onClose} type="button">
            Cancel
          </button>
        </div>
      </div>
    </>
  )
}
```

### Accessible Tabs

```jsx
const Tabs = ({ tabs }) => {
  const [activeTab, setActiveTab] = useState(0)

  const handleTabKeyDown = (e, index) => {
    let newIndex = index
    
    if (e.key === 'ArrowLeft') {
      e.preventDefault()
      newIndex = (index - 1 + tabs.length) % tabs.length
    } else if (e.key === 'ArrowRight') {
      e.preventDefault()
      newIndex = (index + 1) % tabs.length
    }
    
    setActiveTab(newIndex)
    // Focus the new tab
    document.getElementById(`tab-${newIndex}`)?.focus()
  }

  return (
    <div>
      <div role="tablist">
        {tabs.map((tab, index) => (
          <button
            id={`tab-${index}`}
            role="tab"
            aria-selected={index === activeTab}
            aria-controls={`panel-${index}`}
            tabIndex={index === activeTab ? 0 : -1}
            onClick={() => setActiveTab(index)}
            onKeyDown={(e) => handleTabKeyDown(e, index)}
            key={tab.label}
          >
            {tab.label}
          </button>
        ))}
      </div>
      
      {tabs.map((tab, index) => (
        <div
          id={`panel-${index}`}
          role="tabpanel"
          aria-labelledby={`tab-${index}`}
          hidden={index !== activeTab}
          key={tab.label}
        >
          {tab.content}
        </div>
      ))}
    </div>
  )
}
```

---

## 10. Dynamic Content & Live Regions

### Announcing Changes to Screen Readers

```jsx
// ✗ Bad: silent update
const [cartCount, setCartCount] = useState(0)

// ✓ Good: announce with live region
const [cartCount, setCartCount] = useState(0)
const [announcement, setAnnouncement] = useState('')

const addToCart = () => {
  setCartCount(cartCount + 1)
  setAnnouncement(`Product added. Cart now contains ${cartCount + 1} items.`)
}

return (
  <>
    {/* Live region for announcements */}
    <div
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only" // screen-reader-only class
    >
      {announcement}
    </div>
    
    <button onClick={addToCart}>Add to Cart</button>
    <span>{cartCount}</span>
  </>
)
```

### Screen Reader Only Text

```css
/* Hide visually but keep for screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

---

## 11. Testing Checklist

### Automated Testing (Required)

```bash
# Install axe-core
npm install -D @axe-core/cli jest-axe

# Run axe scanner
npx axe http://localhost:3000 --stdout

# Run in Jest tests
import { axe, toHaveNoViolations } from 'jest-axe'
expect.extend(toHaveNoViolations)

test('Component should have no violations', async () => {
  const { container } = render(<Component />)
  expect(await axe(container)).toHaveNoViolations()
})
```

### Keyboard Navigation Testing (Manual)

- [ ] **Tab / Shift+Tab** — Navigate through all interactive elements
- [ ] **Tab order** — Matches visual left-to-right, top-to-bottom
- [ ] **Enter** — Activate buttons, submit forms, follow links
- [ ] **Space** — Toggle checkboxes, radios, switches
- [ ] **Escape** — Close modals, dismiss dropdowns
- [ ] **Arrow keys** — Navigate within tabs, menus, segmented controls
- [ ] **No keyboard traps** — Can escape every interactive element
- [ ] **Focus visible** — Clear outline on all focused elements (≥3px)
- [ ] **Skip links** — Jump to main content available at page start

### Screen Reader Testing (Manual with Real AT)

#### **NVDA** (Windows, free)
1. Install from https://www.nvaccess.org/
2. Start: Ctrl + Alt + N
3. Navigate:
   - H — next heading
   - D — next landmark/region
   - F — next form field
   - L — next link
   - Tab — next interactive element
4. Check:
   - Headings announced with level (H1, H2, etc.)
   - Form labels associated with inputs
   - Button purposes clear
   - Images have alt text (or marked decorative)
   - Error messages announced
   - Dynamic content updates announced

#### **VoiceOver** (macOS, built-in)
1. Enable: System Preferences → Accessibility → VoiceOver → Enable
2. Start: Cmd + F5
3. Navigate:
   - VO + Right Arrow — next element
   - VO + Cmd + H — next heading
   - VO + Cmd + J — jump to element
   - VO + U — rotor (browse headings, links, form controls)
4. Check: same as NVDA

### Visual Testing

- [ ] **Zoom to 200%** — All content readable, no horizontal scroll
- [ ] **Color contrast** — Check with WebAIM Contrast Checker (4.5:1 minimum)
- [ ] **Focus visible** — Outline clearly visible on all focused elements
- [ ] **Hover/active states** — Clearly differentiated from default
- [ ] **Disabled states** — Obvious but not low-contrast (use opacity, not color alone)

### ProShop Specific Tests

**Home page:**
- [ ] Product list has semantic structure (articles, headings)
- [ ] Search input has label or aria-label
- [ ] Filter buttons keyboard accessible
- [ ] Product images have meaningful alt text

**Product page:**
- [ ] Product images have detailed alt text
- [ ] Size/color options keyboard accessible
- [ ] "Add to Cart" button announced clearly
- [ ] Quantity input keyboard accessible (number input, arrow keys)
- [ ] Reviews section has heading hierarchy

**Cart page:**
- [ ] Item count announced when updated
- [ ] Quantity adjustments keyboard accessible
- [ ] Remove buttons have clear labels
- [ ] Price updates announced
- [ ] Checkout link announced with purpose

**Checkout pages (Shipping, Payment, PlaceOrder):**
- [ ] Form labels associated with inputs
- [ ] Required fields indicated (aria-required, HTML5 required)
- [ ] Error messages announced (role="alert")
- [ ] Payment methods keyboard accessible
- [ ] Order confirmation announced clearly

**Admin pages (Feature Dashboard, Orders, Users):**
- [ ] Table headers semantic (`<th scope="col/row">`)
- [ ] Toggle switches keyboard accessible (Space to toggle)
- [ ] Sliders keyboard accessible (Arrow keys to adjust)
- [ ] Status badges have semantic color + text (not color alone)
- [ ] Delete/critical actions require confirmation

---

## 12. Accessibility Audit Report Template

```markdown
# Accessibility Audit: [Page Name]

**Date:** YYYY-MM-DD
**WCAG Target:** Level AA
**Compliance Rate:** XX%

## Executive Summary
- Critical Issues: X (block release)
- Major Issues: X (should fix)
- Minor Issues: X (nice to have)

## Critical Issues (Block Release)

### Issue #1: Missing Form Labels
**WCAG Criterion:** 3.3.2 Labels or Instructions (Level A)
**Severity:** Critical
**Location:** Login form, password input
**Problem:** Input has no associated label
**Impact:** Screen reader users cannot identify the field
**Reproduction:** Use NVDA, Tab to password input — no label announced
**Fix:**
\`\`\`jsx
<label htmlFor="password">Password</label>
<input id="password" type="password" />
\`\`\`
**Effort:** 15 minutes

### Issue #2: Insufficient Color Contrast
**WCAG Criterion:** 1.4.3 Contrast (Minimum) (Level AA)
**Severity:** Critical
**Location:** Primary button text
**Problem:** Color #7B8A9A on white = 3.2:1 (requires 4.5:1)
**Impact:** Users with low vision cannot read button
**Fix:** Change to #374151 (9.1:1)
**Effort:** 5 minutes

## Major Issues (Should Fix)
[List with details...]

## Testing Summary
- Automated: axe-core (0 violations)
- Keyboard: All interactive elements tab-accessible, no traps
- Screen readers: NVDA (Windows), VoiceOver (macOS)
- Browsers: Chrome 118+, Firefox 119+, Safari 17+
- Device: Desktop 1920×1080

## Sign-off Checklist
- [ ] All Critical issues resolved
- [ ] 90%+ of Major issues resolved
- [ ] WCAG 2.1 Level AA compliance verified
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (2+ readers)
- [ ] Color contrast verified (4.5:1 minimum)
- [ ] Semantic HTML validated

**Status:** Approved / Blocked
```

---

## 13. Implementation Guidelines

### For All React Components

```jsx
// ✓ Always use semantic HTML
<button>Click</button>
<a href="/page">Link</a>
<nav aria-label="Main">...</nav>

// ✓ Always associate labels with form inputs
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✓ Always provide alt text for images
<img src="product.jpg" alt="Blue wool sweater, size M" />

// ✓ Always test with keyboard
// Tab should move through all interactive elements
// Escape should close modals/dropdowns

// ✓ Always announce dynamic changes
<div role="status" aria-live="polite">
  {announcement}
</div>

// ❌ Never use divs instead of buttons/links
<div onClick={handleClick}>Click</div>

// ❌ Never hide content with low opacity
<button style={{opacity: 0.3}}>Disabled</button>

// ❌ Never rely on color alone
<span style={{color: 'red'}}>Error</span>

// ❌ Never create keyboard traps
// Escape should always close modals
```

### CSS for Accessibility

```css
/* ✓ Always visible focus indicator */
*:focus-visible {
  outline: 3px solid #418DFF;
  outline-offset: 2px;
}

/* ✓ Support 200% zoom */
html { font-size: 16px; }
h1 { font-size: 2.5rem; } /* scales with zoom */

/* ✓ Support high contrast mode (Windows) */
@media (prefers-contrast: more) {
  button { border: 2px solid currentColor; }
}

/* ✓ Support reduced motion (accessibility setting) */
@media (prefers-reduced-motion: reduce) {
  * { animation-duration: 0.01ms !important; }
  * { transition-duration: 0.01ms !important; }
}

/* ✓ Hide decorative content from screen readers */
.icon {
  background: url('icon.svg') no-repeat;
  width: 24px;
  height: 24px;
  aria-hidden: true;
}

/* ✓ Proper disabled styling (visible, not low-contrast) */
button:disabled {
  background: #E5E7EB;
  color: #6B7280;
  cursor: not-allowed;
  opacity: 0.7; /* not the only indicator */
}
```

---

## 14. Quick Reference: WCAG Success Criteria Map

| Criterion | Level | ProShop Pages | Check |
|---|---|---|---|
| 1.1.1 Non-text Content | A | All pages (images) | Alt text present |
| 1.3.1 Info & Relationships | A | Forms, product pages | Semantic HTML |
| 1.4.3 Contrast (Minimum) | AA | All pages | 4.5:1 text ratio |
| 1.4.4 Text Resize | AA | All pages | Readable at 200% zoom |
| 2.1.1 Keyboard | A | All pages | All functions keyboard-accessible |
| 2.1.2 No Keyboard Trap | A | Modals, dropdowns | Escape always works |
| 2.4.3 Focus Order | A | All pages | Tab order logical |
| 2.4.7 Focus Visible | AA | All pages | Focus outline visible |
| 2.5.5 Target Size | AAA | Buttons, inputs | 44×44px minimum |
| 3.1.1 Language of Page | A | All pages | `<html lang="en">` |
| 3.3.2 Labels or Instructions | A | Forms | All inputs have labels |
| 3.3.3 Error Suggestion | AA | Forms | Suggestions for errors |
| 4.1.2 Name, Role, Value | A | Buttons, modals | Proper ARIA attributes |
| 4.1.3 Status Messages | AA | Cart, checkout | Changes announced |

---

## 15. Resources & References

### WCAG & Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/) — Official W3C specification
- [WCAG 2.2 Guidelines](https://www.w3.org/WAI/WCAG22/quickref/) — Latest (Level A alignment with 2.1 AA)
- [WAI-ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/) — ARIA patterns & best practices
- [ADA Compliance](https://www.ada.gov/tech-accessibility.html) — Legal requirement (USA)
- [Section 508](https://www.section508.gov/) — Federal IT accessibility standard

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/) — Automated violations scanner
- [NVDA Screen Reader](https://www.nvaccess.org/) — Free Windows screen reader
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/) — Color contrast validation
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) — Chrome DevTools accessibility audit
- [Pa11y](https://pa11y.org/) — Automated accessibility testing CLI

### React/Testing
- [jest-axe](https://github.com/nickcolley/jest-axe) — Accessibility testing in Jest
- [Testing Library](https://testing-library.com/) — Query by accessible roles
- [Storybook a11y addon](https://storybook.js.org/docs/react/essentials/accessibility) — Test in component library

### Legal / Compliance
- [VPAT (Voluntary Product Accessibility Template)](https://www.itic.org/vpat) — Accessibility statement template
- [Legal requirements by region](https://www.w3.org/WAI/policies/) — Country-specific laws

---

## 16. Best Practices Summary

### Always DO
- ✓ Use semantic HTML first (`<button>`, `<nav>`, `<label>`)
- ✓ Test with real screen readers (NVDA, VoiceOver) — not just tools
- ✓ Make all functionality keyboard accessible
- ✓ Provide visible focus indicators (≥3px outline)
- ✓ Write meaningful alt text for images (describe visually important content)
- ✓ Ensure 4.5:1 color contrast for normal text, 3:1 for large/UI
- ✓ Announce dynamic content to screen readers (aria-live)
- ✓ Include skip links to main content
- ✓ Test at 200% browser zoom
- ✓ Support keyboard shortcuts (document them)

### Never DO
- ✗ Rely on automated tools alone (false positives/negatives)
- ✗ Use divs instead of semantic elements
- ✗ Hide focus indicators (outline: none)
- ✗ Create keyboard traps (can't escape with keyboard)
- ✗ Use color as the only indicator (e.g., red text for errors — need label too)
- ✗ Put aria-label on non-interactive elements
- ✗ Duplicate information (label + identical aria-label)
- ✗ Ignore form labels (placeholder alone is not enough)
- ✗ Auto-play sound/video (respect user control)
- ✗ Flash content more than 3×/second (seizure risk)

---

## 17. Closing Statement

**Accessibility is a legal requirement and an ethical responsibility.**

This guide is your minimum baseline. Test with real assistive technologies, not just scanners. When in doubt, raise the issue, cite the WCAG criterion, and propose a concrete fix. Ship inclusive by construction, not by remediation.

---

**Version:** 1.0  
**Last reviewed:** May 14, 2026  
**Owner:** ProShop Accessibility Team  
**Status:** Active
