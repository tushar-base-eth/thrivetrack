/**
 * Auth Context Provider
 * 
 * Manages authentication state and user profile data.
 * Provides auth-related functionality to the entire app.
 */

"use client"

import { createContext, useContext } from "react"
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export type SignUpData = {
  email: string
  password: string
  name: string
  gender: "Male" | "Female" | "Other"
  date_of_birth: string
  weight_kg: number
  height_cm: number
  body_fat_percentage?: number | null
  unit_preference?: "metric" | "imperial"
  theme_preference?: "light" | "dark"
}

type AuthContextType = {
  signUp: (data: SignUpData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const signUp = async (data: SignUpData) => {
    const { error: authError } = await supabase.auth.signUp({
      email: data.email,
      password: data.password,
    })
    
    if (authError) throw authError

    // Create profile in users table
    const { error: profileError } = await supabase
      .from("users")
      .insert([{
        email: data.email,
        name: data.name,
        gender: data.gender,
        date_of_birth: data.date_of_birth,
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        body_fat_percentage: data.body_fat_percentage ?? null,
        unit_preference: data.unit_preference || "metric",
        theme_preference: data.theme_preference || "light",
        total_volume: 0,
        total_workouts: 0,
      }])

    if (profileError) throw profileError
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider value={{ signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
