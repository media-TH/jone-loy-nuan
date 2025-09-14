# Admin Group Route

This directory uses Next.js 13+ Group routing feature to organize admin-related pages.

## Structure

```
app/(admin)/
├── layout.tsx          # Admin layout with authentication
├── page.tsx            # Admin dashboard (/)
├── dashboard/
│   └── page.tsx        # Dashboard page (/dashboard)
├── quizzes/
│   ├── page.tsx        # Quiz management (/quizzes)
│   ├── new/
│   │   └── page.tsx    # New quiz (/quizzes/new)
│   └── [id]/
│       ├── edit/
│       │   └── page.tsx # Edit quiz (/quizzes/[id]/edit)
│       └── images/
│           └── page.tsx # Quiz images (/quizzes/[id]/images)
└── settings/
    └── page.tsx        # Settings (/settings)
```

## URL Mapping

The admin routes are hidden behind a secure path using Next.js rewrites:

- Public URL: `/x9k2m7n4p8q1/*`
- Internal Route: `/(admin)/*`

## Features

- **Group Routing**: Organizes admin pages without affecting URL structure
- **Shared Layout**: All admin pages share authentication and layout
- **URL Obfuscation**: Admin routes are hidden behind random string
- **Authentication**: Middleware protects all admin routes

## Authentication

All routes in this group are protected by:
1. Middleware authentication check
2. Layout-level user verification
3. Supabase session management