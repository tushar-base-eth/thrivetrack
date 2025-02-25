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
      workout_exercises: {
        Row: {
          id: string
          workout_id: string
          exercise_id: string
          order: number
        }
        Insert: {
          id?: string
          workout_id: string
          exercise_id: string
          order?: number
        }
        Update: {
          id?: string
          workout_id?: string
          exercise_id?: string
          order?: number
        }
      }
      workout_sets: {
        Row: {
          id: string
          workout_exercise_id: string
          reps: number
          weight_kg: number
          order: number
        }
        Insert: {
          id?: string
          workout_exercise_id: string
          reps: number
          weight_kg: number
          order?: number
        }
        Update: {
          id?: string
          workout_exercise_id?: string
          reps?: number
          weight_kg?: number
          order?: number
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}
