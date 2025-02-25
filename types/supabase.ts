export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          name: string
          gender: 'Male' | 'Female' | 'Other'
          date_of_birth: string
          weight_kg: number
          height_cm: number
          body_fat_percentage: number | null
          unit_preference: 'metric' | 'imperial'
          theme_preference: 'light' | 'dark'
          total_volume: number
          total_workouts: number
          created_at: string
          updated_at: string
        }
        Insert: Omit<Tables['users']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Tables['users']['Insert']>
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: Omit<Tables['workouts']['Row'], 'id' | 'created_at'>
        Update: Partial<Tables['workouts']['Insert']>
      }
      available_exercises: {
        Row: {
          id: string
          name: string
          primary_muscle_group: string
          secondary_muscle_group: string | null
        }
        Insert: Omit<Tables['available_exercises']['Row'], 'id'>
        Update: Partial<Tables['available_exercises']['Insert']>
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          created_at: string
        }
        Insert: Omit<Tables['workout_exercises']['Row'], 'id' | 'created_at'>
        Update: Partial<Tables['workout_exercises']['Insert']>
      }
      sets: {
        Row: {
          id: string
          workout_exercise_id: string
          reps: number
          weight_kg: number
          created_at: string
        }
        Insert: Omit<Tables['sets']['Row'], 'id' | 'created_at'>
        Update: Partial<Tables['sets']['Insert']>
      }
      daily_volume: {
        Row: {
          id: number
          user_id: string
          date: string
          volume: number
        }
        Insert: Omit<Tables['daily_volume']['Row'], 'id'>
        Update: Partial<Tables['daily_volume']['Insert']>
      }
    }
    Functions: {
      update_user_stats: {
        Args: { p_user_id: string; p_volume: number }
        Returns: void
      }
      get_total_volume: {
        Args: { p_user_id: string }
        Returns: number
      }
      get_volume_by_day: {
        Args: { p_user_id: string; p_days: number }
        Returns: { date: string; volume: number }[]
      }
      get_workout_volume: {
        Args: { p_workout_id: string }
        Returns: { volume: number }[]
      }
      update_user_stats_on_delete: {
        Args: { p_user_id: string; p_volume: number }
        Returns: void
      }
      create_workout_with_exercises: {
        Args: {
          p_workout_id: string
          p_user_id: string
          p_total_volume: number
          p_exercises: Json
        }
        Returns: void
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]
export type Functions<T extends keyof Database['public']['Functions']> = Database['public']['Functions'][T]