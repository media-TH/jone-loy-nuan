# Tailwind 4.1 Core Concepts: Theme, Utilities, Dark Mode

This doc summarizes how to structure design tokens (theme), compose styles with utilities, and implement dark mode in Tailwind 4.1 — tailored to the patterns used in this repo.

## Theme (Design Tokens)
- Purpose
  - Centralize colors, radii, fonts, and other tokens so utilities like `bg-background` or `text-foreground` stay consistent.
- Inline theme in this repo
  - We define tokens in `app/globals.css` using CSS variables and an inline `@theme`:
    - CSS vars (light/dark): `:root { --background: ... }`, `.dark { --background: ... }`
    - Map to Tailwind tokens:
      - `@theme inline { --color-background: var(--background); --radius-lg: var(--radius); ... }`
  - Result: `bg-background` resolves to `var(--background)`, so switching the variable updates the entire UI coherently.
- Adding or updating tokens
  - Add/modify a CSS variable (e.g., `--brand`), then expose it in `@theme inline` (e.g., `--color-brand: var(--brand)`).
  - Use in classes: `bg-brand text-brand-foreground` (if also mapped), or in CSS via `theme(colors.brand)`. 
- Key tips
  - Name tokens by intent (e.g., `--background`, `--muted`) rather than raw color names.
  - Reference tokens via Tailwind utilities where possible; fall back to `theme(...)` or CSS variables in component styles if needed.

## Styling With Utility Classes
- Composition-first
  - Build components by composing utilities in the markup. Keep classes readable; group logically (layout → spacing → color → effects).
- Variants and state
  - Pseudo and interaction: `hover:`, `focus:`, `active:`, `disabled:`
  - Media/responsive: `sm: md: lg: xl:`
  - Motion/accessibility: `motion-reduce:`
  - Data/ARIA/state: `data-[state=open]:opacity-100`, `aria-expanded:rotate-180`
  - Structural: `group` + `group-hover:...`, `peer` + `peer-checked:...`
- Arbitrary values
  - Properties: `transition-[height]` `shadow-[0_1px_8px_rgb(0_0_0_/_.08)]`
  - Values: `[animation-delay:220ms]` `[backdrop-filter:saturate(1.2)]`
  - Easing: `ease-[cubic-bezier(0.22,1,0.36,1)]`
- When utilities aren’t enough
  - Extract to CSS with `@layer` and `@apply` for repeated patterns or complex selectors.
  - Keep extraction minimal; utilities remain the default styling strategy.

## Dark Mode
- Approach in this repo
  - We opt into a class-based dark mode via a custom variant:
    - `@custom-variant dark (&:is(.dark *));` in `app/globals.css`
    - This makes `dark:` work whenever a `.dark` class is present on a parent (commonly on `html`).
  - We define light/dark values by swapping CSS variables in `:root` vs `.dark` blocks.
- Using dark mode utilities
  - Colors: `bg-card dark:bg-card` `text-muted-foreground dark:text-muted-foreground`
  - Borders and shadows: `border-border dark:border-border` `shadow-sm dark:shadow-none`
  - Transitions: `transition-colors` helps smooth theme toggles.
- Toggling dark mode
  - Add/remove `.dark` on the root element (e.g., via `next-themes` or a simple class toggle).
  - Because tokens reference CSS variables, components update without code changes.
- Accessibility
  - Respect user preferences when appropriate (e.g., initialize from `prefers-color-scheme`) and provide a manual toggle.

## Practical Patterns
- Page/card scaffold
  - `rounded-lg border bg-card text-card-foreground shadow-sm`
- Interactive buttons
  - `inline-flex items-center justify-center gap-2 rounded-md px-3 py-2 transition-colors duration-200 bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:pointer-events-none`
- Disclosures/accordions
  - Trigger icon: `transition-transform duration-200 data-[state=open]:rotate-180`
  - Panel: `overflow-hidden transition-[height] duration-300 ease-out`
- Reduced motion
  - Prefer transform/opacity: `transition-opacity transition-transform`
  - Disable motion if requested: `motion-reduce:transition-none motion-reduce:animate-none`

## Keyframes + Animation (recap)
- Define once in CSS (globals):
  - `@keyframes fade-in-up { 0% { opacity:0; transform:translateY(12px) } 100% { opacity:1; transform:none } }`
- Use with arbitrary animate utility:
  - `opacity-0 animate-[fade-in-up_600ms_ease-out_both]`
- Stagger without JS:
  - Add `[animation-delay:0ms]`, `[animation-delay:120ms]`, `[animation-delay:240ms]` to sequenced elements.

## Guidelines Recap
- Design tokens live in CSS variables and are exposed via `@theme inline`.
- Compose with utilities first; extract to CSS only for complex or repeated patterns.
- Use `dark:` via the custom variant + `.dark` class and define values with CSS variables.
- Prefer transform/opacity for smooth, performant interactions; honor `motion-reduce`.

References
- Theme: https://tailwindcss.com/docs/theme
- Utility classes: https://tailwindcss.com/docs/styling-with-utility-classes
- Dark mode: https://tailwindcss.com/docs/dark-mode

