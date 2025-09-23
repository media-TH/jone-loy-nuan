# Jone Loy Nuan - Scam Awareness Project

## Project Overview

This project is a web application designed to raise awareness about online scams. It features a quiz that tests users' knowledge of scam detection and prevention. The application collects data from the quiz and provides an admin dashboard for analyzing the results. The ultimate goal is to provide KPI data to the Bank of Thailand (BOT).

**Key Technologies:**

*   **Frontend:** Next.js (React), TypeScript, Tailwind CSS, shadcn/ui, Recharts (for charts), Framer Motion (for animations), Zustand (for state management)
*   **Backend:** Next.js API Routes, Supabase (PostgreSQL)
*   **Authentication:** Supabase Auth
*   **Database:** Supabase (PostgreSQL)

**Architecture:**

The application follows a modern web architecture:

*   **Frontend:** A Next.js application serves the user interface, including the quiz, survey, and admin dashboard.
*   **Backend:** Next.js API routes handle backend logic, and Supabase provides the database and authentication services.
*   **Database:** A PostgreSQL database hosted on Supabase stores all application data, including user sessions, quiz questions, responses, and survey results.

## Building and Running

### Prerequisites

*   Node.js
*   pnpm (or npm/yarn)

### Installation

1.  Clone the repository.
2.  Install dependencies:

    ```bash
    pnpm install
    ```

### Running the Development Server

```bash
pnpm dev
```

The application will be available at `http://localhost:3000`.

### Building for Production

```bash
pnpm build
```

### Starting the Production Server

```bash
pnpm start
```

### Linting and Type-Checking

*   **Linting:**

    ```bash
    pnpm lint
    ```

*   **Type-Checking:**

    ```bash
    pnpm type-check
    ```

## Development Conventions

*   **TypeScript:** The entire codebase is written in TypeScript.
*   **ESLint:** ESLint is used for code linting to maintain code quality and consistency.
*   **Styling:** Tailwind CSS is used for styling, with shadcn/ui for UI components.
*   **State Management:** Zustand is used for global state management.
*   **Database:** The database schema is managed through Supabase migrations.
*   **Authentication:** Authentication is handled by Supabase Auth, with session management implemented in the Next.js middleware.
*   **File Structure:** The project follows a standard Next.js `app` directory structure.
    *   `app/(main)`: Contains the main application routes (e.g., quiz, survey, results).
    *   `app/(admin)`: Contains the admin dashboard routes.
    *   `app/api`: Contains the API routes.
    *   `components`: Contains reusable React components.
    *   `lib`: Contains utility functions, database types, and actions.
    *   `store`: Contains the Zustand store.
    *   `supabase`: Contains Supabase migration files.
