import type { Database } from '@/types/supabase';

// Derive from DB schema
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

// Exercise selector types
export type ExerciseSelection = {
  id: string;
  name: string;
  primary_muscle_group: string;
  secondary_muscle_group?: string;
  description?: string;
};
