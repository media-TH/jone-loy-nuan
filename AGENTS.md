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
  - `SUPABASE_SECRET_KEY` (server-side only)
- Store secrets in `.env.local` (do not commit).
