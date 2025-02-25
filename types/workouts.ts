import type { Database } from './supabase'

export type WorkoutSet = Database['public']['Tables']['sets']['Row']

export type WorkoutExercise = Database['public']['Tables']['workout_exercises']['Row'] & {
  sets: WorkoutSet[]
  exercise: Database['public']['Tables']['available_exercises']['Row']
}

export type Workout = Database['public']['Tables']['workouts']['Row'] & {
  exercises: WorkoutExercise[]
  totalVolume: number
}
