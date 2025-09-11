# Repository Guidelines

## Project Structure & Module Organization
- `app/`: Next.js App Router pages, layouts, and route handlers. Co-locate page-specific components under their route (e.g., `app/quiz/...`).
- `components/`: Reusable UI (shadcn/ui) and app-level components; `components/ui/` for primitives.
- `lib/`: Domain logic (actions, services, transforms), schemas, and shared types.
- `hooks/`: React hooks (`useX.ts`).
- `store/`: Zustand stores and state helpers.
- `public/`: Static assets.
- `supabase/`: Database migrations and related artifacts.
- `utils/`: External client helpers (e.g., Supabase client).
- Root config: `next.config.ts`, `eslint.config.mjs`, `tsconfig.json`, `middleware.ts`.

## Build, Test, and Development Commands
- `npm run dev` — Start local dev server.
- `npm run build` — Production build with Next.js.
- `npm start` — Run production server from `.next`.
- `npm run lint` — Lint with ESLint (Next.js config).
- `npm run analyze` — Bundle analyzer build (`ANALYZE=true`).
- Utility (optional): `npm run migrate`, `npm run upload:images` if corresponding `scripts/*.ts` exist.

## Coding Style & Naming Conventions
- Language: TypeScript (`strict: true`).
- Indentation: 2 spaces; prefer named exports.
- Components: `PascalCase` (`MyWidget.tsx`); hooks: `useCamelCase.ts`.
- Files colocated by feature/route where practical.
- Paths use alias `@/*` (see `tsconfig.json`).
- Linting: ESLint extends `next`; run `npm run lint` before PRs. Disable rules sparingly and with rationale.

## Testing Guidelines
- No formal test suite yet. Prefer adding unit tests with Vitest (`*.test.ts[x]`) under `__tests__/` or alongside sources, and E2E with Playwright.
- Aim for meaningful coverage on `lib/` and critical flows in `app/`.
- Example: `npx vitest` (once configured). Include reproduction steps in PRs when tests are missing.

## Commit & Pull Request Guidelines
- Commit style: Prefer Conventional Commits (`feat:`, `fix:`, `refactor:`, `docs:`). Keep messages clear and scoped.
- PRs must include: purpose/summary, linked issues (e.g., `Closes #123`), screenshots/GIFs for UI, steps to test, and notes on risk/rollback.
- Keep diffs focused; document decisions in code or PR description when non-obvious.

## Security & Configuration Tips
- Use `.env.local` for secrets; never commit credentials. Distinguish public env vars (`NEXT_PUBLIC_*`) from server-only.
- Review `middleware.ts` and Supabase usage for auth-sensitive changes.
