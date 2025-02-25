import { describe, it, expect, vi, beforeEach } from "vitest"
import { NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { saveWorkout } from "@/lib/supabase/workouts"
import { type User } from '@supabase/supabase-js'

// Mock dependencies
vi.mock("@/lib/supabase/workouts", () => ({
  saveWorkout: vi.fn(),
}))

vi.mock("@supabase/ssr", () => ({
  createServerClient: vi.fn(),
}))

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}))

describe("Workouts API", () => {
  const mockUser: User = {
    id: "123",
    email: "test@example.com",
    created_at: new Date().toISOString(),
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    role: "authenticated"
  }

  let mockClient: ReturnType<typeof createServerClient>

  beforeEach(() => {
    vi.clearAllMocks()
    mockClient = createServerClient('test-url', 'test-key', { auth: { persistSession: false } })
    ;(createServerClient as any).mockReturnValue(mockClient)
    ;(cookies as any).mockReturnValue({
      getAll: () => [],
    })
  })

  describe("POST /api/v1/workouts", () => {
    const mockWorkout = {
      exercises: [
        {
          name: "Bench Press",
          sets: [{ reps: 10, weight: 100 }],
        },
      ],
      totalVolume: 1000,
      created_at: new Date().toISOString(),
    }

    it("should return 401 if user is not authenticated", async () => {
      mockClient.auth.getUser.mockResolvedValueOnce({
        data: { user: null },
        error: new Error("Unauthorized"),
      })

      const request = new NextRequest("http://localhost:3000/api/v1/workouts", {
        method: "POST",
        body: JSON.stringify(mockWorkout),
      })

      const { POST } = await import("../route")
      const response = await POST(request)
      expect(response.status).toBe(401)
    })

    it("should save workout and return 200 if request is valid", async () => {
      const request = new NextRequest("http://localhost:3000/api/v1/workouts", {
        method: "POST",
        body: JSON.stringify(mockWorkout),
      })

      const { POST } = await import("../route")
      const response = await POST(request)
      expect(response.status).toBe(200)
      expect(saveWorkout).toHaveBeenCalledWith({
        workout: mockWorkout,
        userId: mockUser.id,
      })
    })

    it("should return 400 if workout data is invalid", async () => {
      const request = new NextRequest("http://localhost:3000/api/v1/workouts", {
        method: "POST",
        body: JSON.stringify({
          exercises: [],
        }),
      })

      const { POST } = await import("../route")
      const response = await POST(request)
      expect(response.status).toBe(400)
    })

    it("returns 401 when no session exists", async () => {
      vi.mocked(mockClient.auth.getSession).mockResolvedValue({
        data: { 
          session: null 
        },
        error: null
      })

      const response = await fetch('http://localhost:3000/api/v1/workouts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          exercises: [],
          totalVolume: 0,
          created_at: new Date().toISOString()
        })
      })

      expect(response.status).toBe(401)
    })
  })
})
