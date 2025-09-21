# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Thai online scam awareness quiz application ("สแกนโจร.online") built with Next.js 15, React 19, TypeScript, and Supabase. The app educates users about common online scams through interactive quizzes with scenario-based questions and visual content.

## Development Commands

### Essential Commands
- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate` - Run quiz data migration script
- `npm run upload:images` - Upload images to Supabase storage

### Database Commands
- `npx supabase start` - Start local Supabase
- `npx supabase db push` - Push migrations
- `npx supabase gen types typescript --local > lib/database.types.ts` - Generate TypeScript types

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript (strict mode), Tailwind CSS v4
- **UI Components**: Radix UI primitives with shadcn/ui (New York style)
- **State Management**: Zustand for quiz state (`store/quiz-store.ts`)
- **Database**: Supabase PostgreSQL with TypeScript types
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

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
├── actions/          # Server actions
├── services/         # Service layer
├── transforms/       # Data transformations
├── database.types.ts # Auto-generated Supabase types
├── types.ts          # Application type definitions
└── schema.ts         # Zod validation schemas

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
- `quiz_sessions` - Session tracking with KPI scores
- `questions` - Quiz questions with content and metadata
- `answers` - Answer options for each question
- `question_responses` - User responses with timing
- `survey_responses` - Demographic data collection
- Views: `quiz_kpi_summary`, `question_difficulty_analysis`

### Component Patterns

**Quiz Components**:
- `QuizClient` - Main client-side quiz orchestrator
- `ContentArea` - Renders different content types (images, text, components)
- `AnswerPanel` - Handles answer selection with flexible layouts
- `ResultCard` - Shows quiz results with explanations

**Animations**:
- `useQuizAnimations` hook provides consistent animation configs
- Framer Motion for page transitions and interactive elements
- Stair transition effects between pages

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
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Testing & Quality
- TypeScript strict mode enabled
- ESLint with Next.js rules
- Custom ESLint overrides:
  - `react/no-unescaped-entities`: off
  - `@next/next/no-page-custom-font`: off

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
1. Fetch questions via Supabase function `get_questions_with_answers`
2. Store in Zustand state
3. Track responses locally
4. Batch save via API routes
5. Calculate KPIs in real-time

**Scam Categories** (10 types):
- SMS_SCAM, LOAN_APP_SCAM, JOB_SCAM, INVESTMENT_SCAM, ROMANCE_SCAM
- GROUP_SCAM, PIN_SCAM, POLICE_AD_SCAM, POLICE_CALL_SCAM, MULE_ACCOUNT_SCAM

### Admin Panel
- Route: `/mgmt-portal`
- Features: Question CRUD, image uploads, analytics dashboard
- Uses React Hook Form + Zod for all forms
- Drag-and-drop reordering with @dnd-kit

### Localization
- Primary language: Thai (`th_TH`)
- All user-facing text in Thai
- Domain: `xn--12co4czb5a2kj.online` (สแกนโจร.online)

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