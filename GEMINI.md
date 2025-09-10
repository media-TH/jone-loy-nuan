# GEMINI.md

This file provides guidance to Gemini when working with code in this repository.

## Project Overview

This is a Thai online scam awareness quiz application ("สแกนโจร.online") built with Next.js 15, React 19, TypeScript, and Supabase. The app educates users about common online scams through interactive quizzes with scenario-based questions and visual content.

### Tech Stack
- **Framework**: Next.js 15 with App Router
- **Frontend**: React 19, TypeScript, Tailwind CSS v4
- **UI Components**: Radix UI primitives with shadcn/ui (New York style)
- **State Management**: Zustand for quiz state
- **Database**: Supabase with TypeScript types
- **Animations**: Framer Motion
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React

## Building and Running

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run migrate` - Run quiz data migration script
- `npm run upload:images` - Upload images to Supabase storage

## Development Conventions

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
