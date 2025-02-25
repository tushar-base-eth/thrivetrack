/**
 * Authentication Context Provider
 *
 * Manages global authentication state and user profile data using React Context.
 * Implements Supabase authentication with proper session management.
 *
 * Features:
 * - User authentication state management
 * - User profile data management
 * - Supabase authentication methods (login, signup, logout)
 * - Session management
 * - Type-safe context with TypeScript
 *
 * UX Considerations:
 * - Maintains authentication state across page refreshes
 * - Provides loading states for authentication operations
 * - Handles error states and validation
 * - Smooth transitions between authenticated/unauthenticated states
 */

"use client"

import type React from "react"
import { createContext, useContext, useReducer, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"

// User profile interface matching settings form
export interface UserProfile {
  email: string
  name: string
  gender: "male" | "female" | "other"
  dateOfBirth: string
  weight: number
  height: number
  bodyFat?: number
  unitPreference: "metric" | "imperial"
}

// Authentication state interface
interface AuthState {
  isAuthenticated: boolean
  user: UserProfile | null
  isLoading: boolean
}

// Authentication action types
type AuthAction =
  | { type: "LOGIN"; user: UserProfile }
  | { type: "SIGNUP"; user: UserProfile }
  | { type: "LOGOUT" }
  | { type: "UPDATE_PROFILE"; user: UserProfile }
  | { type: "SET_LOADING"; isLoading: boolean }

// Initial authentication state
const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  isLoading: true,
}

// Create authentication context
const AuthContext = createContext<{
  state: AuthState
  login: (email: string, password: string) => Promise<void>
  signup: (user: UserProfile, password: string) => Promise<void>
  logout: () => Promise<void>
  updateProfile: (user: UserProfile) => Promise<void>
} | null>(null)

// Create Supabase client
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Authentication reducer
function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case "LOGIN":
    case "SIGNUP":
      return {
        ...state,
        isAuthenticated: true,
        user: action.user,
        isLoading: false,
      }
    case "LOGOUT":
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        isLoading: false,
      }
    case "UPDATE_PROFILE":
      return {
        ...state,
        user: action.user,
      }
    case "SET_LOADING":
      return {
        ...state,
        isLoading: action.isLoading,
      }
    default:
      return state
  }
}

// Authentication Provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState)
  const router = useRouter()

  // Load authentication state on mount
  useEffect(() => {
    const loadSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        if (session?.user) {
          const { data: profile, error: profileError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()
            
          if (profileError) throw profileError
          
          dispatch({ type: "LOGIN", user: profile })
        }
      } catch (error) {
        console.error("Error loading session:", error)
      } finally {
        dispatch({ type: "SET_LOADING", isLoading: false })
      }
    }

    loadSession()

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()
        
        if (profile) {
          dispatch({ type: "LOGIN", user: profile })
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch({ type: "LOGOUT" })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  const login = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", isLoading: true })
    try {
      const { data: { user }, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      if (error) throw error

      if (user) {
        const { data: profile, error: profileError } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        if (profileError) throw profileError
        
        dispatch({ type: "LOGIN", user: profile })
        router.push("/")
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw new Error("An error occurred during login")
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false })
    }
  }

  const signup = async (user: UserProfile, password: string) => {
    dispatch({ type: "SET_LOADING", isLoading: true })
    try {
      // Create auth user
      const { data: { user: authUser }, error: signUpError } = await supabase.auth.signUp({
        email: user.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        }
      })
      
      if (signUpError) throw signUpError
      if (!authUser) throw new Error("Failed to create user")

      // Create user profile
      const { error: profileError } = await supabase
        .from('users')
        .insert([
          {
            id: authUser.id,
            ...user,
          }
        ])
      
      if (profileError) throw profileError

      dispatch({ type: "SIGNUP", user })
      router.push("/auth/verify")
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw new Error("An error occurred during signup")
    } finally {
      dispatch({ type: "SET_LOADING", isLoading: false })
    }
  }

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      dispatch({ type: "LOGOUT" })
      router.push("/auth")
    } catch (error) {
      console.error("Error during logout:", error)
    }
  }

  const updateProfile = async (user: UserProfile) => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) throw new Error("Not authenticated")

      const { error } = await supabase
        .from('users')
        .update(user)
        .eq('id', authUser.id)
      
      if (error) throw error

      dispatch({ type: "UPDATE_PROFILE", user })
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message)
      }
      throw new Error("An error occurred while updating profile")
    }
  }

  return <AuthContext.Provider value={{ state, login, signup, logout, updateProfile }}>{children}</AuthContext.Provider>
}

// Custom hook to use the auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
