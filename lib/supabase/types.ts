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
        Insert: {
          id?: string
          email: string
          name: string
          gender: 'Male' | 'Female' | 'Other'
          date_of_birth: string
          weight_kg: number
          height_cm: number
          body_fat_percentage?: number | null
          unit_preference?: 'metric' | 'imperial'
          theme_preference?: 'light' | 'dark'
          total_volume?: number
          total_workouts?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          name?: string
          gender?: 'Male' | 'Female' | 'Other'
          date_of_birth?: string
          weight_kg?: number
          height_cm?: number
          body_fat_percentage?: number | null
          unit_preference?: 'metric' | 'imperial'
          theme_preference?: 'light' | 'dark'
          total_volume?: number
          total_workouts?: number
          created_at?: string
          updated_at?: string
        }
      }
      workouts: {
        Row: {
          id: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          created_at?: string
        }
      }
      available_exercises: {
        Row: {
          id: string
          name: string
          primary_muscle_group: string
          secondary_muscle_group: string | null
        }
        Insert: {
          id?: string
          name: string
          primary_muscle_group: string
          secondary_muscle_group?: string | null
        }
        Update: {
          id?: string
          name?: string
          primary_muscle_group?: string
          secondary_muscle_group?: string | null
        }
      }
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          created_at: string
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          created_at?: string
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          created_at?: string
        }
      }
      sets: {
        Row: {
          id: string
          workout_exercise_id: string
          reps: number
          weight_kg: number
          created_at: string
        }
        Insert: {
          id?: string
          workout_exercise_id: string
          reps: number
          weight_kg: number
          created_at?: string
        }
        Update: {
          id?: string
          workout_exercise_id?: string
          reps?: number
          weight_kg?: number
          created_at?: string
        }
      }
      daily_volume: {
        Row: {
          id: number
          user_id: string
          date: string
          volume: number
        }
        Insert: {
          id?: number
          user_id: string
          date: string
          volume: number
        }
        Update: {
          id?: number
          user_id?: string
          date?: string
          volume?: number
        }
      }
    }
    Functions: {
      update_user_stats: {
        Args: {
          p_user_id: string
          p_volume: number
        }
        Returns: void
      }
      get_total_volume: {
        Args: {
          p_user_id: string
        }
        Returns: number
      }
      get_volume_by_day: {
        Args: {
          p_user_id: string
          p_days: number
        }
        Returns: {
          date: string
          volume: number
        }[]
      }
    }
  }
}
