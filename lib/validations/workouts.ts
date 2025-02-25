import * as z from "zod";
import { type Database } from "@/types/supabase";
import { type WorkoutSubmission } from "@/lib/types/workouts";

// Type aliases from database schema
type SetInsert = Database['public']['Tables']['sets']['Insert'];
type WorkoutExerciseInsert = Database['public']['Tables']['workout_exercises']['Insert'];
type WorkoutInsert = Database['public']['Tables']['workouts']['Insert'];

// Schema for a single exercise set
export const workoutSetSchema = z.object({
  reps: z.number().int().min(1, "Reps must be at least 1"),
  weight_kg: z.number().min(0, "Weight must be at least 0 kg"),
}) satisfies z.ZodType<Omit<SetInsert, 'id' | 'created_at' | 'workout_exercise_id'>>;

// Schema for an exercise within a workout
export const workoutExerciseSchema = z.object({
  exercise_id: z.string().min(1, "Exercise ID is required"),
  name: z.string().min(1, "Exercise name is required"), // For UI display, not stored directly
  sets: z.array(workoutSetSchema).min(1, "At least one set is required"),
});

// Schema for a full workout submission
export const workoutSubmissionSchema = z.object({
  name: z.string().min(1, "Workout name is required").max(50, "Workout name is too long"), // For UI display, stored in metadata
  user_id: z.string().uuid("Invalid user ID"),
  totalVolume: z.number().min(0, "Total volume must be at least 0"), // For UI tracking, stored separately
  exercises: z.array(workoutExerciseSchema).min(1, "At least one exercise is required"),
}) satisfies z.ZodType<WorkoutSubmission>;

// Schema for workout record insertion (core DB fields only)
export const workoutInsertSchema = z.object({
  user_id: z.string().uuid("Invalid user ID").nullable(),
  created_at: z.string().datetime().optional().nullable(),
}) satisfies z.ZodType<WorkoutInsert>;

// Export types
export type WorkoutSetFormData = z.infer<typeof workoutSetSchema>;
export type WorkoutExerciseFormData = z.infer<typeof workoutExerciseSchema>;
export type WorkoutSubmissionFormData = z.infer<typeof workoutSubmissionSchema>;
