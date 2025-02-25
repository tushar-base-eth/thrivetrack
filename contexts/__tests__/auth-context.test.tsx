import { render, screen, waitFor, cleanup } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { AuthProvider, useAuth } from "../auth-context"
import { createBrowserClient } from "@supabase/ssr"
import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

// Mock next/navigation
const mockPush = vi.fn()
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}))

// Mock Supabase client
const mockInsert = vi.fn()
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()

const mockSupabase = {
  auth: {
    getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
    signUp: vi.fn(),
    signInWithPassword: vi.fn(),
    signInWithOAuth: vi.fn(),
    signOut: vi.fn(),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
  },
  from: vi.fn(() => ({
    insert: mockInsert,
    select: mockSelect.mockReturnValue({
      eq: mockEq.mockReturnValue({
        single: mockSingle,
      }),
    }),
  })),
}

vi.mock("@supabase/ssr", () => ({
  createBrowserClient: vi.fn(() => mockSupabase),
}))

// Test component that uses auth context
function TestComponent() {
  const { signUp } = useAuth()

  const handleSignUp = async () => {
    try {
      await signUp({
        email: "test@example.com",
        password: "Password123!",
        name: "Test User",
        gender: "Male",
        date_of_birth: "2000-01-01",
        weight_kg: 70,
        height_cm: 170,
        unit_preference: "metric",
        theme_preference: "light",
      })
    } catch (error) {
      console.error("Error in test component:", error)
    }
  }

  return <button onClick={handleSignUp}>Sign Up</button>
}

describe("AuthContext", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSupabase.auth.getUser.mockResolvedValue({ data: { user: null }, error: null })
    mockSingle.mockResolvedValue({ data: null, error: null })
  })

  afterEach(() => {
    cleanup()
  })

  describe("signUp", () => {
    it("should create auth user and profile successfully", async () => {
      const mockUser = { id: "123", email: "test@example.com" }
      
      // Mock successful auth signup
      mockSupabase.auth.signUp.mockResolvedValueOnce({ 
        data: { user: mockUser, session: null }, 
        error: null 
      })

      // Mock successful profile creation
      mockInsert.mockResolvedValueOnce({ 
        data: [{ id: mockUser.id }], 
        error: null 
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const button = screen.getByText("Sign Up")
      await userEvent.click(button)

      // Verify auth signup was called
      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "Password123!",
          options: {
            emailRedirectTo: expect.any(String),
          },
        })
      })

      // Verify profile creation was called
      await waitFor(() => {
        expect(mockSupabase.from).toHaveBeenCalledWith("Users")
        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            id: mockUser.id,
            email: "test@example.com",
            name: "Test User",
            gender: "Male",
            date_of_birth: "2000-01-01",
            weight_kg: 70,
            height_cm: 170,
            unit_preference: "metric",
            theme_preference: "light",
            total_volume: 0,
            total_workouts: 0,
          }),
        ])
      })

      // Verify redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/auth/verify")
      })
    })

    it("should handle auth signup failure", async () => {
      // Mock auth signup failure
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: null, session: null },
        error: { message: "Auth failed" },
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const button = screen.getByText("Sign Up")
      await userEvent.click(button)

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalled()
        expect(mockSupabase.from).not.toHaveBeenCalled()
      })
    })

    it("should handle profile creation failure", async () => {
      const mockUser = { id: "123", email: "test@example.com" }
      
      // Mock successful auth signup
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      })

      // Mock profile creation failure
      mockInsert.mockResolvedValueOnce({
        data: null,
        error: { message: "Profile creation failed" },
      })

      // Mock signout (cleanup after profile creation failure)
      mockSupabase.auth.signOut.mockResolvedValueOnce({
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const button = screen.getByText("Sign Up")
      await userEvent.click(button)

      await waitFor(() => {
        expect(mockSupabase.auth.signUp).toHaveBeenCalled()
        expect(mockInsert).toHaveBeenCalled()
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })

    it("should validate required fields", async () => {
      const mockUser = { id: "123", email: "test@example.com" }
      
      // Mock successful auth signup
      mockSupabase.auth.signUp.mockResolvedValueOnce({
        data: { user: mockUser, session: null },
        error: null,
      })

      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      const button = screen.getByText("Sign Up")
      await userEvent.click(button)

      await waitFor(() => {
        expect(mockInsert).toHaveBeenCalledWith([
          expect.objectContaining({
            id: mockUser.id,
            email: expect.any(String),
            name: expect.any(String),
            gender: expect.any(String),
            date_of_birth: expect.any(String),
            weight_kg: expect.any(Number),
            height_cm: expect.any(Number),
          }),
        ])
      })
    })
  })
})
