/**
 * Auth Context Provider
 * 
 * Manages authentication state and user profile data.
 * Provides auth-related functionality to the entire app.
 */

"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from '@supabase/supabase-js'
import type { User } from '@supabase/supabase-js'

export type UserProfile = {
  id: string
  email: string
  name: string
  gender: "Male" | "Female" | "Other"
  date_of_birth: string
  weight_kg: number
  height_cm: number
  body_fat_percentage: number | null
  unit_preference: "metric" | "imperial"
  theme_preference: "light" | "dark"
  total_volume: number
  total_workouts: number
  created_at?: string
  updated_at?: string
}

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
  user: User | null
  profile: UserProfile | null
  signUp: (data: SignUpData) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const router = useRouter()

  const signUp = async (data: SignUpData) => {
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
          },
        },
      })
      
      if (authError) throw authError

      if (!authData?.user) {
        throw new Error("Failed to create user account")
      }

      // Create profile in users table
      const { error: profileError } = await supabase
        .from("users")
        .insert([{
          id: authData.user.id,
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

      if (profileError) {
        // If profile creation fails, delete the auth user
        await supabase.auth.signOut()
        throw profileError
      }

      // Since email confirmation is disabled, sign in the user immediately
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (signInError) throw signInError

      // Redirect to dashboard
      router.push("/dashboard")
    } catch (error) {
      console.error("Error in signUp:", error)
      throw error
    }
  }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) throw error
      router.push("/dashboard")
    } catch (error) {
      console.error("Error in signIn:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      router.push("/")
    } catch (error) {
      console.error("Error in signOut:", error)
      throw error
    }
  }

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single()
          
          setProfile(profile)
        } else {
          setProfile(null)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      signUp,
      signIn,
      signOut,
    }}>
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
