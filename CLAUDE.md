# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Thai online scam awareness quiz application ("สแกนโจร.online") built with Next.js 15, React 19, TypeScript, and Supabase. The app educates users about common online scams through interactive quizzes with scenario-based questions and visual content.

**Domain**: `xn--12co4czb5a2kj.online` (สแกนโจร.online)
**Primary Language**: Thai (`th_TH`)

## Development Commands

### Essential Commands
- `npm run dev` - Start development server (localhost:3000)
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint with Next.js rules
- `npm run type-check` - Run TypeScript type checking without emit
- `npm run migrate` - Run quiz data migration script (uses tsx)
- `npm run upload:images` - Upload images to Supabase storage (uses tsx)

### Database Commands
- `npx supabase start` - Start local Supabase
- `npx supabase db push` - Push migrations
- `npx supabase gen types typescript --local > lib/database.types.ts` - Generate TypeScript types

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript (strict mode), Tailwind CSS v4 with PostCSS
- **UI Components**: Radix UI primitives with shadcn/ui (New York style)
- **State Management**: Zustand for quiz state with devtools (`store/quiz-store.ts`)
- **Database**: Supabase PostgreSQL with auto-generated TypeScript types
- **Animations**: Framer Motion with custom animation hooks
- **Forms**: React Hook Form with Zod validation schemas
- **Icons**: Lucide React and Tabler Icons
- **Charts**: Recharts for analytics dashboard
- **Tables**: TanStack React Table for data management
- **Drag & Drop**: @dnd-kit for admin panel reordering
- **Styling**: CSS custom properties with dark mode support
- **Build Tools**: tsx for script execution, PostCSS for CSS processing

### Directory Structure
```
app/                    # Next.js App Router pages
├── (admin)/           # Admin panel with separate layout
│   └── mgmt-portal/   # Management portal routes
├── (main)/            # Main app routes
│   ├── quiz/          # Quiz flow
│   ├── result/        # Quiz results
│   └── survey/        # Post-quiz survey
└── api/               # API routes
    ├── analytics/     # Analytics endpoints
    └── dashboard/     # Dashboard data endpoints

components/            # Shared React components
├── ui/               # shadcn/ui components
└── [custom]          # Custom components

lib/                   # Core business logic
├── actions/          # Server actions (questions, quiz, analytics, images, survey)
├── services/         # Service layer (quiz.service.ts, kpi-target-service.ts)
├── transforms/       # Data transformations
├── utils/            # Utility functions
├── constants.ts      # Application constants and configurations
├── database.types.ts # Auto-generated Supabase types
├── types.ts          # Application type definitions (QuizContent, KPI types, etc.)
├── schema.ts         # Zod validation schemas (survey, forms)
└── utils.ts          # Shared utility functions

store/                 # Zustand state management
hooks/                 # Custom React hooks
utils/supabase/        # Supabase client configuration
supabase/             # Supabase project config
├── migrations/       # Database migrations
└── config.toml       # Local development config
```

### Key Architecture Patterns

**Quiz System**:
- Questions stored in Supabase with images in storage
- Each question has multiple choice answers with one correct answer
- Four KPI categories: SCAM_RECOGNITION, RISK_ASSESSMENT, PROTECTIVE_ACTIONS, RESPONSE_STRATEGIES
- Target: 80% success rate per category
- Session tracking with device type and analytics

**State Management**:
- `useQuizResultStore` (Zustand) manages quiz progress, responses, and session data
- Session persists across navigation using store
- Real-time KPI calculation during quiz

**Content Types**:
Quiz content supports four types via `QuizContent` interface:
- `"image"` - Regular images with alt text
- `"text"` - Plain text content
- `"svg"` - SVG graphics stored in public directory
- `"component"` - React components for interactive scenarios

**Database Schema Key Tables**:
- `quiz_sessions` - Session tracking with KPI scores, device fingerprinting
- `questions` - Quiz questions with JSONB content and KPI categories
- `answers` - Answer options with correct/incorrect flags and explanations
- `question_responses` - User responses with timing data and KPI mapping
- `survey_responses` - Demographic data collection (age, education, occupation)
- `_quiz_session_map` - Internal session mapping for analytics
- **Views**: `quiz_kpi_summary`, `question_difficulty_analysis`
- **Functions**: `get_questions_with_answers()` for optimized quiz fetching

### Component Patterns

**Quiz Components**:
- `QuizClient` - Main client-side quiz orchestrator
- `ContentArea` - Renders different content types (images, text, components)
- `AnswerPanel` - Handles answer selection with flexible layouts
- `ResultCard` - Shows quiz results with explanations

**Animations**:
- `useQuizAnimations` hook provides consistent animation configs with screen size detection
- Framer Motion for page transitions and interactive elements
- Stair transition effects between pages with configurable delays
- ANIMATION_PRESETS in constants.ts for reusable animation patterns
- Responsive animation behavior based on device type

**Form Handling**:
- React Hook Form with Zod validation throughout
- Server actions in `lib/actions/` for data mutations
- Optimistic updates for better UX

### Styling Conventions
- Tailwind CSS v4 with CSS variables
- Two Google Fonts: Inter (primary) and Prompt (Thai text)
- Mobile-first responsive design
- shadcn/ui New York style theme

### Environment Variables
Required in `.env.local`:
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Optional: For admin authentication
SUPABASE_JWT_SECRET=your-jwt-secret
```

### Code Quality & Standards
- **TypeScript**: Strict mode enabled with path aliases (`@/*` maps to project root)
- **ESLint**: Next.js flat config with custom overrides:
  - `react/no-unescaped-entities`: off (for Thai text content)
  - `@next/next/no-page-custom-font`: off (using Google Fonts)
- **No testing framework** - manual testing only
- **Always run** `npm run lint` and `npm run type-check` before commits

### Important Code Patterns

**Server Actions**:
All database mutations use server actions in `lib/actions/`. Never call Supabase directly from client components.

**Type Safety**:
- Database types auto-generated in `lib/database.types.ts`
- Application types in `lib/types.ts`
- Always use TypeScript interfaces for props

**Path Aliases**:
- `@/*` maps to project root
- Use for cleaner imports: `import { Button } from "@/components/ui/button"`

**Quiz Flow**:
1. Initialize session with `useQuizResultStore.startQuiz()`
2. Fetch questions via Supabase function `get_questions_with_answers`
3. Store in Zustand state with device fingerprinting
4. Track responses locally with timing data
5. Calculate KPIs in real-time per category
6. Batch save via QuizService.submitQuizResponse()
7. Generate session analytics and device tracking

**Scam Categories** (10 types):
- SMS_SCAM, LOAN_APP_SCAM, JOB_SCAM, INVESTMENT_SCAM, ROMANCE_SCAM
- GROUP_SCAM, PIN_SCAM, POLICE_AD_SCAM, POLICE_CALL_SCAM, MULE_ACCOUNT_SCAM

### Admin Panel
- Route: `/mgmt-portal` (protected with middleware)
- Features: Question CRUD, image uploads, analytics dashboard
- Uses React Hook Form + Zod for all forms
- Drag-and-drop reordering with @dnd-kit
- Real-time analytics with Recharts visualization
- SVG upload dialog for custom graphics
- Image management with Supabase storage integration

### Configuration Files

**Core Configuration**:
- `components.json` - shadcn/ui configuration (New York style, CSS variables)
- `eslint.config.mjs` - ESLint flat config with Next.js rules
- `next.config.ts` - Next.js configuration (minimal setup)
- `postcss.config.mjs` - PostCSS with Tailwind CSS v4 plugin
- `tsconfig.json` - TypeScript strict mode with path aliases

**Database**:
- `supabase/migrations/` - Database schema migrations
- `lib/database.types.ts` - Auto-generated TypeScript types

**Styling**:
- `app/globals.css` - Tailwind CSS v4 with custom properties
- CSS custom properties for theme customization
- Two font families: Inter (primary), Prompt (Thai)

### Development Notes
- All user-facing text must be in Thai
- Use TypeScript strict mode for all new code
- Follow existing code patterns and conventions
- Prefer server actions over client-side Supabase calls
- Always regenerate types after schema changes: `npx supabase gen types typescript --local > lib/database.types.ts`

## Common Development Tasks

### Adding a New Question Type
1. Update `QuizContent` interface in `lib/types.ts`
2. Add rendering logic to `ContentArea` component
3. Update migration script if needed

### Modifying KPI Categories
1. Update types in `lib/types.ts`
2. Modify database schema via migration
3. Update calculation logic in API routes

### Running Migrations
```bash
npm run migrate
```

### Generating TypeScript Types from Database
```bash
npx supabase gen types typescript --local > lib/database.types.ts
```

### Working with Animations
- Use `useQuizAnimations(showResult)` hook for consistent animations
- Animation configurations in `lib/constants.ts` under ANIMATION_PRESETS
- Screen size detection automatically adjusts animation behavior
- Framer Motion variants are pre-configured for common patterns

### Database Development
- All migrations in `supabase/migrations/` with descriptive filenames
- Use Supabase function `get_questions_with_answers()` for optimized fetching
- KPI categories must match: SCAM_RECOGNITION, RISK_ASSESSMENT, PROTECTIVE_ACTIONS, RESPONSE_STRATEGIES
- Session tracking includes device fingerprinting for analytics

### State Management Patterns
- Quiz state: `useQuizResultStore` (Zustand with devtools)
- Device detection: `QuizService.getDeviceInfo()`
- Session persistence across navigation
- Real-time KPI calculation during quiz progression

### Component Development
- All form components use React Hook Form + Zod validation
- Answer panels have smart layout detection (auto/vertical/horizontal/hidden)
- Content area supports 4 types: image, text, svg, component
- Use TypeScript interfaces from `lib/types.ts` for all props