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

// Types for workout history
export type WorkoutSummary = {
  id: string;
  name: string;
  created_at: string;
  totalVolume: number;
  exerciseCount: number;
};
