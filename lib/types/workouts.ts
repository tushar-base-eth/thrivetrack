import type { Database } from '@/types/supabase';

// Composite type for workouts with related data - extended from DB schema
export type WorkoutWithExercises = Database['public']['Tables']['workouts']['Row'] & {
  name?: string; // UI field, not in DB schema
  total_volume_kg?: number; // UI field, not in DB schema
  exercises: Array<
    Database['public']['Tables']['workout_exercises']['Row'] & {
      sets: Database['public']['Tables']['sets']['Row'][];
      exercise: Database['public']['Tables']['available_exercises']['Row'];
    }
  >;
};

// Simplified type for API requests
export type WorkoutSubmission = {
  name: string; // Required for UI but needs to be stored separately
  user_id: string;
  totalVolume: number; // Required for UI but needs to be stored separately
  exercises: {
    exercise_id: string;
    name: string;
    sets: {
      reps: number;
      weight_kg: number;
    }[];
  }[];
};

// Types for workout history
export type WorkoutSummary = {
  id: string;
  name?: string; // May not exist in DB schema
  created_at: string | null;
  totalVolume?: number; // May not exist in DB schema
  exerciseCount: number;
};

// Type for workout insertion into database
export type WorkoutInsert = {
  user_id: string | null;
  created_at?: string | null;
};
