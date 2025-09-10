# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Thai online scam awareness quiz application ("สแกนโจร.online") built with Next.js 15, React 19, TypeScript, and Supabase. The app educates users about common online scams through interactive quizzes with scenario-based questions and visual content.

## Development Commands

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate` - Run quiz data migration script
- `npm run upload:images` - Upload images to Supabase storage

## Architecture

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **UI Components**: Radix UI primitives with shadcn/ui (New York style)
- **State Management**: Zustand for quiz state
- **Database**: Supabase with TypeScript types
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Directory Structure
```
app/                    # Next.js App Router pages
├── admin/             # Admin panel for quiz management
├── api/               # API routes
├── quiz/              # Main quiz flow
├── login/             # Authentication
├── result/            # Quiz results
├── survey/            # User survey functionality
└── error/             # Error handling pages

components/            # Shared React components
├── ui/               # shadcn/ui components
├── admin/            # Admin-specific components
└── [custom components like content-area, login-form, etc.]

lib/                   # Utilities and business logic
├── actions/          # Server actions for database operations
├── types/            # Additional type definitions
├── handlers/         # Business logic handlers
├── services/         # Service layer components
├── transforms/       # Data transformation utilities
├── animations/       # Animation configurations
├── types.ts          # Main TypeScript type definitions
├── schema.ts         # Zod validation schemas
├── database.types.ts # Generated Supabase types
└── constants.ts      # Application constants

store/                 # Zustand state management
hooks/                 # Custom React hooks
utils/                 # General utilities (includes supabase config)
supabase/              # Supabase configuration and migrations
```

### Key Architecture Patterns

**Quiz System**:
- Questions stored in Supabase with images in storage
- Each question has multiple choice answers with one correct answer
- Results show explanations and scam category information
- Session tracking with device type and analytics

**State Management**:
- `useQuizResultStore` (Zustand) manages quiz progress, responses, and session data
- Local state for UI interactions and animations
- Supabase real-time subscriptions for admin features

**Content Management**:
- Quiz content supports multiple types: text, images, SVG, and React components
- Scenario-based visual content stored in `/public/images/scenarios/`
- Admin panel allows CRUD operations on questions and image uploads

**Database Schema**:
- `questions` table with content, answers, and metadata
- `quiz_responses` for analytics and session tracking
- `scenario_images` for visual content management

### Component Patterns

**Quiz Components**:
- `QuizClient` - Main client-side quiz orchestrator
- `ContentArea` - Renders different content types (images, text, components)
- `AnswerPanel` - Handles answer selection with flexible layouts
- `ResultCard` - Shows quiz results with explanations

**Animations**:
- `useQuizAnimations` hook provides consistent animation configs
- Framer Motion for page transitions and interactive elements
- Custom stair transition effects

**Form Handling**:
- React Hook Form with Zod validation throughout
- Server actions for data mutations
- Optimistic updates where appropriate

### Styling Conventions
- Tailwind CSS v4 with CSS variables
- Two Google Fonts: Inter (primary) and Prompt (Thai text)
- Mobile-first responsive design
- Custom CSS animations for quiz transitions

### Environment Variables
Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - For admin operations

### Testing and Quality
- ESLint configured with Next.js rules
- TypeScript strict mode enabled
- Custom rules: disabled `react/no-unescaped-entities` and `@next/next/no-page-custom-font`

### Localization
- Primary language: Thai (`th_TH`)
- All user-facing text in Thai
- SEO optimized for Thai domain (`xn--12co4czb5a2kj.online`)

## Data Migration
Use `npm run migrate` to run the quiz data migration script which handles question imports and database seeding.

## Important Code Architecture Details

### Quiz Flow Architecture
The quiz system follows a specific flow pattern:
1. Questions are fetched via Supabase functions (`get_questions_with_answers`)
2. State is managed through `useQuizResultStore` with session tracking
3. Each question supports different content types via the `QuizContent` interface
4. Responses are stored locally and batch-saved via API routes

### Scam Category System
The application categorizes scams into 10 specific types defined in `lib/types.ts`:
- SMS_SCAM, LOAN_APP_SCAM, JOB_SCAM, INVESTMENT_SCAM, ROMANCE_SCAM
- GROUP_SCAM, PIN_SCAM, POLICE_AD_SCAM, POLICE_CALL_SCAM, MULE_ACCOUNT_SCAM

### Content Type System
Quiz questions support four content types in the `QuizContent` interface:
- `"image"` - Regular images with alt text
- `"text"` - Plain text content  
- `"svg"` - SVG graphics stored in public directory
- `"component"` - React components for interactive scenarios

### Database Integration
- Uses Supabase with TypeScript types generated in `database.types.ts`
- Server actions in `lib/actions/` handle all database mutations
- Quiz responses saved to `/api/quiz-response` endpoint for analytics
- Real-time features available for admin panel updates

### Animation System
Centralized animation configuration through `useQuizAnimations` hook provides:
- Consistent timing and easing across components
- Stair transition effects for page changes
- Interactive element animations via Framer Motion

### Admin Panel Architecture
- Separate admin routes under `/app/admin/`
- CRUD operations for questions with image upload capability
- Uses React Hook Form + Zod for form validation
- Drag-and-drop reordering with @dnd-kit library

### Build and Development Notes
- Uses TypeScript strict mode with custom ESLint rules
- Two disabled ESLint rules: `react/no-unescaped-entities` and `@next/next/no-page-custom-font`
- Tailwind CSS v4 with CSS variables for theming and `tw-animate-css` for additional animations
- Font loading: Inter (primary) + Prompt (Thai) with display swap optimization
- Path aliases: `@/*` maps to project root for cleaner imports
- Development server runs on default port 3000
- Uses `tsx` for running TypeScript scripts (migration, image upload)

### Common Development Patterns
- Server actions for all database mutations (no client-side database calls)
- Consistent error handling with try-catch in async operations
- TypeScript interfaces defined in `lib/types.ts` for all major data structures
- Component props extend interfaces for type safety
- Zustand store with devtools for state debugging
- Modular component architecture with separation of concerns
- Use of custom hooks for complex state logic and animations