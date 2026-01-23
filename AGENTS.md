# Repository Guidelines

## Project Structure & Module Organization
- `app/` contains Next.js App Router routes. Grouped routes live under `(main)` for the quiz flow and `(admin)` for management (`/mgmt-portal`).
- `components/` holds shared UI, with shadcn/ui primitives in `components/ui/`.
- `lib/` contains server actions, services, types, constants, and Supabase types (auto-generated in `lib/database.types.ts`).
- `store/` is Zustand state, `hooks/` for custom hooks, `utils/` for helpers, and `supabase/` for migrations and local config.
- Tests live in `__tests__/` (and optionally `tests/` per Jest config).

## Build, Test, and Development Commands
- `npm run dev` – start the dev server at `http://localhost:3000`.
- `npm run build` – compile the production build.
- `npm run start` – run the production server locally.
- `npm run lint` – run Next.js ESLint rules.
- `npm run type-check` – run TypeScript checks (no emit).
- `npm run test` – run Jest suite.
- `npm run test:watch` – watch mode for Jest.
- `npm run test:integration` – run integration tests under `__tests__/integration`.
- `npm run migrate` – run quiz data migration script.
- `npm run upload:images` – upload quiz images to Supabase storage.

## Coding Style & Naming Conventions
- TypeScript everywhere; keep strict typing and prefer interfaces from `lib/types.ts`.
- Use the path alias `@/*` for imports (e.g., `@/components/ui/button`).
- Tailwind CSS v4 for styling; follow existing utility patterns in `app/globals.css`.
- All user-facing text should be in Thai.

## Testing Guidelines
- Jest is configured with `jsdom` and setup in `jest.setup.ts`.
- Test files should use `*.test.ts(x)` or `*.spec.ts(x)` under `__tests__/` or `tests/`.
- Run `npm run test` before changes to quiz flow, services, or admin dashboard logic.

## Commit & Pull Request Guidelines
- Commit messages in history follow a lightweight convention like `feat: ...` or `fix: ...`. Keep subjects short and action-oriented.
- PRs should include a concise summary, test commands run, and screenshots for UI changes (quiz, dashboard, or admin portal).
- Link related issues or tasks when available.

## Security & Configuration Tips
- Supabase credentials live in `.env.local`. Do not commit secrets.
- Prefer server actions in `lib/actions/` for data mutations; avoid direct client-side Supabase writes.
