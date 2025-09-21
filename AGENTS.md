# Repository Guidelines

## Project Structure & Module Organization
This Next.js App Router project groups end-user flows under pp/(main) and administrative surfaces in pp/(admin); shared layouts live in pp/layout.tsx and global styles in pp/globals.css. Reusable UI sits in components/ui, feature composites in components/admin and components/data, and client state stores in store/. Domain logic and server actions live in lib/ (lib/actions, lib/services, lib/utils), while Supabase schemas and generated types stay alongside in lib/schema.ts and lib/database.types.ts. Persist new assets under public/, and commit schema changes as SQL migrations in supabase/migrations/.

## Build, Test & Development Commands
Use pnpm dev for local development with hot reload. Run pnpm build before deploying to verify the production bundle, and pnpm start to serve that build. pnpm lint enforces the shared ESLint (Next.js base) rules, and pnpm type-check must stay clean before merging. When updating database structures, run the Supabase CLI locally (e.g., supabase db push) and include the generated migration file.

## Coding Style & Naming Conventions
Follow the existing TypeScript conventions: tab indentation, single quotes inside JSX props only when required, and named exports for shared modules. React components use PascalCase file names (ScenarioViewer.tsx), hooks and utilities stay camelCase, and Zustand stores end with -store.ts. Prefer co-locating scenario-specific helpers inside the relevant feature folder, and keep environment-dependent values in .env.local with matching entries in lib/constants.ts.

## Testing Guidelines
Component tests live in components/__tests__/ using React Testing Library patterns; create files as *.test.tsx and mirror the component directory. Until an automated test runner is added to package.json, document manual QA steps in the PR and run pnpm lint and pnpm type-check as the minimum gate. Aim to cover critical user flows (quiz progression, admin dashboards) and validate Supabase interactions against a local instance before pushing.

## Commit & Pull Request Guidelines
Follow Conventional Commit prefixes where possible (ix:, efactor:, eat:) as seen in recent history. Scope commit messages narrowly and keep bodies short but descriptive. For pull requests, provide a summary of changes, reference Jira or GitHub issues, attach before/after screenshots for UI updates, and list verification steps (commands run, migrations applied). Flag breaking Supabase changes and note any new environment variables so the team can update shared configs promptly.
