# FitLite Project Structure, Starter Kit, and Tech Stack

## Overview
This document provides a comprehensive guide to the project structure, setup instructions, and technology stack for FitLite, a lightweight, high-performance fitness tracking web app optimized for rapid development and AI tools.

---

## Tech Stack

### Frontend
- **Framework**: Next.js v14.2.3 (PWA-enabled for iOS-like experience, server-side rendering for performance).
- **UI Library**: Shadcn (latest, compatible with React 18, for iOS-style components).
- **State Management**: React v18.3.1 Context API (simple, no external dependencies).
- **Charts**: Chart.js v4.4.3 (static bar charts for dashboard).
- **Validation**: Zod v3.22.4 (type-safe form validation).
- **Gesture Support**: `react-swipeable` (latest, for swipe gestures in History).
- **Theme Management**: `next-themes` (latest, for light/dark mode with Fitbod-inspired dark).
- **Deployment**: Vercel (latest stable CLI, for instant deployment).

### Backend
- **Platform**: Supabase v2.39.4 (authentication, PostgreSQL database, RESTful APIs).
- **API Routes**: Next.js API Routes with header-based versioning (e.g., `Accept-Version: 1.0`).
- **Supabase Client**: `@supabase/ssr` for secure server-side operations.
- **Environment Variables**:
  ```env
  NEXT_PUBLIC_SUPABASE_URL=<project_url>
  NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon_key>
  ```

### Notes for AI
- Use these tools for rapid implementation; prioritize performance (e.g., server-side rendering, indexes).
- Ensure compatibility with iOS gestures and Fitbod-inspired dark mode (`#1C2526`, `#3B82F6`).

## Project Structure

### Directory Layout
```
fitlite/
├── app/
│   ├── api/
│   │   ├── v1/
│   │   │   ├── workouts/
│   │   │   │   └── route.ts
│   │   │   ├── exercises/
│   │   │   │   └── route.ts
│   │   │   └── users/
│   │   │       └── route.ts
│   │   └── auth/
│   │       └── [...supabase]/
│   │           └── route.ts
│   ├── auth/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── history/
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── components/
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── chart.tsx
│   │   ├── form.tsx
│   │   └── ... (other UI components)
│   ├── navigation.tsx
│   ├── page-header.tsx
│   └── theme-provider.tsx
├── hooks/
│   ├── use-mobile.tsx
│   └── use-toast.ts
├── lib/
│   ├── schemas/
│   │   ├── auth.ts
│   │   ├── user.ts
│   │   ├── workout.ts
│   │   └── index.ts
│   ├── supabase/
│   │   ├── client.ts
│   │   ├── server.ts
│   │   └── middleware.ts
│   ├── errors.ts
│   └── utils.ts
├── public/
│   ├── placeholder-logo.svg
│   ├── placeholder-user.jpg
│   └── ... (other assets)
├── styles/
│   └── globals.css
├── middleware.ts
├── next.config.mjs
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

### Notes for AI
- Implement modular components and API routes; use Shadcn for UI, Context API for state.
- Ensure `middleware.ts` includes rate limiting and version control.
- Optimize for PWA and iOS-like navigation.

---

## Starter Kit Template

### Setup Instructions
1. Initialize Next.js project:
   ```bash
   npx create-next-app@14.2.3 fitlite --typescript --tailwind
   ```
2. Install dependencies:
   ```bash
   npm install @supabase/supabase-js@2.39.4 @supabase/ssr chart.js@4.4.3 react-swipeable next-themes zod@3.22.4
   npm install -D @types/react-swipeable
   ```
3. Configure Supabase:
   - Create a project at [supabase.com](https://supabase.com); add environment variables (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
   - Seed `Available_Exercises` with a Fitbod-inspired list (e.g., "Bench Press", "Squat").

### File Structure
- `app/`: Pages (auth, dashboard, history, settings, home).
- `lib/`: Supabase client, Zod schemas, utils (unit conversion).
- `components/`: UI (button, chart), navigation, theme-provider.

### Boilerplate Snippets
- **Supabase Client**:
  ```typescript
  // lib/supabase/client.ts
  import { createBrowserClient } from '@supabase/ssr';
  export const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  ```
- **Workout Save**:
  ```typescript
  // app/api/v1/workouts/route.ts
  import { workoutSchema } from '@/lib/schemas';
  export async function POST(req) {
    const data = await req.json();
    const validated = workoutSchema.parse(data);
    const { user_id, exercises } = validated;
    const { data: workout } = await supabase.from('workouts').insert({ user_id }).select().single();
    // Insert exercises and sets...
  }
  ```
- **Dashboard SSR**:
  ```typescript
  // app/dashboard/page.tsx
  export async function getServerSideProps() {
    const daily = await supabase.rpc('get_volume_by_day', { p_user_id: userId, p_days: 7 });
    return { props: { daily: daily.data } };
  }
  ```

### Next Steps
- Implement API routes with rate limiting (`middleware.ts`).
- Add swipe gestures with `react-swipeable` for History.
- Deploy to Vercel with optimized build settings.

---


