# Repository Guidelines

## Project Structure & Module Organization

- `app/`: Next.js App Router pages, layouts, and route handlers.
- `components/`: Reusable UI components (Radix/Shadcn-style).
- `hooks/`: Custom React hooks.
- `lib/` and `utils/`: Shared utilities, data access, and feature helpers.
- `store/`: Client state management (Zustand).
- `public/`: Static assets served at the site root.
- `supabase/`: Supabase configuration and local tooling.
- `__tests__/`: Unit and integration tests.

## Build, Test, and Development Commands

Use `pnpm` (see `package.json`).

- `pnpm dev`: Start the local Next.js dev server.
- `pnpm build`: Create a production build.
- `pnpm start`: Run the production server locally.
- `pnpm lint`: Run ESLint (Next.js + TypeScript rules).
- `pnpm type-check`: Run TypeScript type checks.
- `pnpm test`: Run Jest test suite.
- `pnpm test:watch`: Run Jest in watch mode.
- `pnpm test:integration`: Run integration tests in `__tests__/integration`.
- `pnpm migrate`: Run quiz data migration script (expects `scripts/`).
- `pnpm upload:images`: Upload images script (expects `scripts/`).

## Coding Style & Naming Conventions

- Language: TypeScript + React (Next.js 16).
- Linting: ESLint with Next core web vitals and TypeScript config (`eslint.config.mjs`).
- Imports: Use `@/` alias for root imports (see `tsconfig.json`).
- Naming: Components in `PascalCase`, hooks in `useSomething` format, files match export names.
- Formatting: No repo formatter config; follow existing file style and run `pnpm lint` before PRs.

## TypeScript & Animation Code

For animation code and animation-related boolean logic:

- Use `any` or `Record<string, any>` for animation configs (GSAP, Motion (`motion/react`) variants, CSS-in-JS).
- Allow implicit boolean conversions; avoid strict `=== true` / `=== false` checks.
- Don’t enforce exact property names or literal types in animation objects.
- Prioritize flexibility over type safety in animation logic; keep strict typing for data/API boundaries.

Examples: `const animate = (el: HTMLElement, config: any) => gsap.to(el, config)`; `if (isAnimating && !paused) { ... }`. Avoid strict interfaces/literal types for animation-only configs.

## Design System & Motion

- Tokens live in `app/globals.css` (CSS variables + Tailwind utilities such as `bg-surface`, `text-ink`, `bg-spark`, `type-title`, `shadow-raised`, `duration-(--dur-quick)`, `z-(--layer-sheet)`); they mirror the สแกนโจร Design System artifact. Use the semantic utilities only: no raw hex, no default palette classes (`bg-blue-500`), no gradients, no purple, no emoji in UI.
- `components/ds/*` are the building blocks (Button, AnswerOption, ScenarioFrame, RedFlagPin, ResultSheet, ProgressRail, RiskMeter, ScoreNumeral, Field, ChoiceChips, ConsentPanel, …): `cva` + `cn`, `focus-ring`, 44px minimum touch target. Status is always word + icon + colour, never colour alone.
- Motion: import from `motion/react` only (the `framer-motion` import is banned) and render `m.*` (`LazyMotion` + `MotionConfig reducedMotion="user"` wrap the app in `components/motion/motion-provider.tsx`). Durations, easings and springs come from `lib/motion/tokens.ts`; reuse the variants in `lib/motion/presets.ts`.
- Only the 8 moments animate: Scan Wipe (route change), Scan Reveal (scenario enters), Flag Plant (red-flag pins), answer feedback, Result Sheet, Progress Rail indicator, score count-up + risk needle, and CTA micro-interactions. Nothing else.
- Reduced motion: transform/layout animation drops out and opacity/colour stays; purely decorative motion is hidden with CSS (`motion-reduce:hidden`), never by rendering different markup from `useReducedMotion()` (it is `null` on the server, so the hydrating render would not match).
- Never server-render a page's main content at opacity 0 (it holds back LCP until hydration): first paint shows content at rest, and enter animations only run on client-side navigations.

## Testing Guidelines

- Framework: Jest with `jsdom` (`jest.config.js`, `jest.setup.ts`).
- Test files: `__tests__/**/*.(test|spec).(ts|tsx|js)` or `tests/**/...`.
- Keep tests deterministic and avoid network calls unless mocked.

## Commit & Pull Request Guidelines

- Commits generally follow Conventional Commit prefixes: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`.
- Keep messages short and imperative; reference the scope when helpful (e.g., `feat: add admin KPI cards`).
- PRs should include: clear description, linked issue (if any), and screenshots for UI changes.

## Security & Configuration Tips

- Supabase configuration relies on environment variables:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
  - `SECRET_KEY` (server-side only)
- Store secrets in `.env.local` (do not commit).
