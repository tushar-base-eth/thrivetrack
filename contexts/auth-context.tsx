/**
 * Authentication Context Provider
 *
 * Manages global authentication state and user profile data using React Context.
 * Implements mock authentication for development purposes with localStorage persistence.
 *
 * Features:
 * - User authentication state management
 * - User profile data management
 * - Mock authentication methods (login, signup, logout)
 * - Persistent authentication using localStorage
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
  logout: () => void
  updateProfile: (user: UserProfile) => void
} | null>(null)

// Mock storage keys
const MOCK_USERS = "fitlite_users"
const MOCK_CURRENT_USER = "fitlite_current_user"

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
    const currentUser = localStorage.getItem(MOCK_CURRENT_USER)
    if (currentUser) {
      dispatch({ type: "LOGIN", user: JSON.parse(currentUser) })
    } else {
      dispatch({ type: "SET_LOADING", isLoading: false })
    }
  }, [])

  // Mock authentication methods
  const login = async (email: string, password: string) => {
    dispatch({ type: "SET_LOADING", isLoading: true })

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const users = JSON.parse(localStorage.getItem(MOCK_USERS) || "[]")
    const user = users.find((u: UserProfile & { password: string }) => u.email === email && u.password === password)

    if (user) {
      const { password: _, ...userProfile } = user
      localStorage.setItem(MOCK_CURRENT_USER, JSON.stringify(userProfile))
      dispatch({ type: "LOGIN", user: userProfile })
      router.push("/")
    } else {
      throw new Error("Invalid credentials")
    }
  }

  const signup = async (user: UserProfile, password: string) => {
    dispatch({ type: "SET_LOADING", isLoading: true })

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    const users = JSON.parse(localStorage.getItem(MOCK_USERS) || "[]")
    if (users.some((u: UserProfile) => u.email === user.email)) {
      throw new Error("Email already exists")
    }

    users.push({ ...user, password })
    localStorage.setItem(MOCK_USERS, JSON.stringify(users))
    localStorage.setItem(MOCK_CURRENT_USER, JSON.stringify(user))

    dispatch({ type: "SIGNUP", user })
    router.push("/")
  }

  const logout = () => {
    localStorage.removeItem(MOCK_CURRENT_USER)
    dispatch({ type: "LOGOUT" })
    router.push("/auth")
  }

  const updateProfile = (user: UserProfile) => {
    const users = JSON.parse(localStorage.getItem(MOCK_USERS) || "[]")
    const updatedUsers = users.map((u: UserProfile & { password: string }) =>
      u.email === user.email ? { ...u, ...user } : u,
    )
    localStorage.setItem(MOCK_USERS, JSON.stringify(updatedUsers))
    localStorage.setItem(MOCK_CURRENT_USER, JSON.stringify(user))
    dispatch({ type: "UPDATE_PROFILE", user })
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

