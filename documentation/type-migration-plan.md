# ThriveTrack Type System Migration Plan

## Current Issues

- Redundant type definitions across multiple files
- Lack of direct derivation from Supabase database schema
- Types spread across unrelated files
- Inconsistent naming conventions
- Type errors occurring due to mismatch between components and API

## Recommended File Structure

Industry-Standard Type Organization Without /src (Using existing Next.js 13+ App Router structure):

```
/ (project root)
├── types/
│   ├── supabase.ts        # Single source: `npx supabase gen types typescript`
│   └── index.ts           # Optional barrel exports
├── lib/
│   └── types/             # Domain-specific type utilities
├── components/
│   └── exercise/
│       ├── types.ts       # Component-specific types
│       └── ...
├── app/
│   └── api/
│       └── types/         # API-specific types (if needed)
└── tsconfig.json          # Path aliases
```

## Implementation Plan

### Phase 1: Centralize Supabase Types

1. Regenerate the Supabase types file:
   ```bash
   npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
   ```

2. Create barrel export file for convenience (types/index.ts):
   ```typescript
   export * from './supabase';
   ```

### Phase 2: Create Component-Colocated Types

1. For each major component group, create a local types.ts file:

   ```typescript
   // components/exercise/types.ts
   import type { Database } from '@/types/supabase';

   // Derive from DB schema instead of redefining
   export type Exercise = Database['public']['Tables']['available_exercises']['Row'];
   export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'];
   export type Set = Database['public']['Tables']['sets']['Row'];

   // Local component types
   export type LocalExercise = {
     id?: string;
     exercise_id?: string;
     name: string;
     sets: {
       id?: string;
       reps: number;
       weight_kg: number;
     }[];
     exercise?: {
       id: string;
       name: string;
       category?: string;
       description?: string;
     };
   };
   ```

### Phase 3: Create Domain-Specific Type Utilities

1. Create domain-specific type utilities:

   ```typescript
   // lib/types/workouts.ts
   import type { Database } from '@/types/supabase';

   // Composite type for workouts with related data
   export type WorkoutWithExercises = Database['public']['Tables']['workouts']['Row'] & {
     exercises: Array<
       Database['public']['Tables']['workout_exercises']['Row'] & {
         sets: Database['public']['Tables']['sets']['Row'][];
         exercise: Database['public']['Tables']['available_exercises']['Row'];
       }
     >;
   };

   // Simplified type for API requests
   export type WorkoutSubmission = {
     name: string;
     user_id: string;
     totalVolume: number;
     exercises: {
       exercise_id: string;
       name: string;
       sets: {
         reps: number;
         weight_kg: number;
       }[];
     }[];
   };
   ```

### Phase 4: Migration Process

1. Create new type files first
2. Update component imports one by one
3. Verify type safety with `tsc --noEmit`
4. Delete redundant type files once migration is complete:
   - types/exercises.ts
   - types/workouts.ts
   - types.tsx

### Phase 5: Update Related Code

1. Update validation schemas to use new type structure
2. Update API routes to use domain-specific types
3. Update test mocks to align with new type system

## Summary of Accomplishments
1. **Type Fixes and Updates**:
   - **lib/validations/auth.ts**: 
     - Created a `UserInsertWithDateString` type to handle the `date_of_birth` as a string.
     - Added a `SignupFields` type for additional fields in the signup form.
     - Updated the signup schema to use the new types, ensuring proper validation.

   - **data/mock-workouts.ts**:
     - Updated workout mock data to include the required fields (`id`, `workout_exercise_id`, `created_at`) and changed `weight` to `weight_kg`.

2. **Removed Unused Directories**:
   - The `src` directory was safely removed as it contained no relevant files for the current codebase.

3. **Error Resolution**:
   - Addressed various TypeScript errors related to type mismatches and missing fields.
   - Ensured that all types align with the Supabase schema and that validation schemas are correctly implemented.

## Type Files and Their Purposes
- **lib/validations/auth.ts**:
  - Purpose: Contains validation schemas for user authentication, including signup and login, ensuring that all fields meet the required criteria.

- **data/mock-workouts.ts**:
  - Purpose: Provides mock data for workouts, including exercises and their respective sets, used for testing and development.

## Benefits

- **Single Source of Truth**: All types derive from Supabase schema
- **Locality**: Component-specific types are colocated with their components
- **Maintainability**: Easier to update when database schema changes
- **Scalability**: Clean separation between UI, domain, and database types
