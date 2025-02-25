import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { WorkoutTracker } from "../workout-tracker"
import { useToast } from "@/components/ui/use-toast"
import { useHaptic } from "@/hooks/use-haptic"

// Mock dependencies
vi.mock("@/components/ui/use-toast", () => ({
  useToast: vi.fn(),
}))

vi.mock("@/hooks/use-haptic", () => ({
  useHaptic: vi.fn(),
}))

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}))

// Mock Supabase client
vi.mock("@/utils/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: { session: null }, error: null })),
    },
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        data: [
          {
            id: "barbell-bench-press",
            name: "Barbell Bench Press",
            primary_muscle_group: "Chest",
            secondary_muscle_group: "Triceps",
          },
        ],
        error: null,
      })),
    })),
  }),
}))

// Mock exercise fetching
vi.mock("@/lib/supabase/exercises", () => ({
  fetchExercises: vi.fn(() => Promise.resolve({
    grouped: {
      "Chest": [
        {
          id: "barbell-bench-press",
          name: "Barbell Bench Press",
          primary_muscle_group: "Chest",
          secondary_muscle_group: "Triceps",
        },
      ],
    },
    flat: [
      {
        id: "barbell-bench-press",
        name: "Barbell Bench Press",
        primary_muscle_group: "Chest",
        secondary_muscle_group: "Triceps",
      },
    ],
  })),
}))

// Mock ExerciseSelector component
vi.mock("../exercise-selector", () => ({
  ExerciseSelector: ({ onExerciseToggle, onAddExercises, open }: any) => (
    <div data-testid="exercise-selector" style={{ display: open ? "block" : "none" }}>
      <button onClick={() => onExerciseToggle("barbell-bench-press")}>Bench Press</button>
      <button onClick={onAddExercises}>Add Selected</button>
    </div>
  ),
}))

// Mock SetEditor component
vi.mock("../set-editor", () => ({
  SetEditor: ({ onUpdateSets, exerciseIndex }: any) => (
    <div data-testid="set-editor">
      <button onClick={() => onUpdateSets([{ reps: 10, weight_kg: 100 }])}>Add Set</button>
    </div>
  ),
}))

describe("WorkoutTracker", () => {
  const mockToast = vi.fn()
  const mockHaptic = {
    trigger: vi.fn(),
    success: vi.fn(),
    error: vi.fn(),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useToast as any).mockReturnValue({ toast: mockToast })
    ;(useHaptic as any).mockReturnValue(mockHaptic)
    global.fetch = vi.fn()
    localStorage.clear()
  })

  it("should render initial state correctly", () => {
    render(<WorkoutTracker />)
    expect(screen.getByText(/Welcome back/i)).toBeInTheDocument()
  })

  it("should allow adding exercises and sets", async () => {
    const user = userEvent.setup()
    render(<WorkoutTracker />)

    // Open exercise selector
    await user.click(screen.getByLabelText(/Add Exercise/i))

    // Add exercise
    await user.click(screen.getByText(/Bench Press/i))
    await user.click(screen.getByText(/Add Selected/i))

    // Add set
    await user.click(screen.getByText(/Add Set/i))

    // Save button should be visible
    expect(screen.getByLabelText(/Save Workout/i)).toBeInTheDocument()
  })

  it("should save workout successfully", async () => {
    const user = userEvent.setup()
    const mockWorkoutId = "test-workout-id"
    ;(global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ workoutId: mockWorkoutId }),
    })

    render(<WorkoutTracker />)

    // Add exercise and set
    await user.click(screen.getByLabelText(/Add Exercise/i))
    await user.click(screen.getByText(/Bench Press/i))
    await user.click(screen.getByText(/Add Selected/i))
    await user.click(screen.getByText(/Add Set/i))

    // Save workout
    await user.click(screen.getByLabelText(/Save Workout/i))

    await waitFor(() => {
      // Verify API call
      expect(global.fetch).toHaveBeenCalledWith("/api/v1/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: expect.any(String),
      })

      // Verify localStorage
      const savedWorkouts = JSON.parse(localStorage.getItem("workouts") || "[]")
      expect(savedWorkouts[0].id).toBe(mockWorkoutId)

      // Verify toast
      expect(mockToast).toHaveBeenCalledWith({
        title: "Workout saved!",
        description: "Your workout has been saved successfully.",
      })

      // Verify haptic feedback
      expect(mockHaptic.success).toHaveBeenCalled()
    })
  })

  it("should handle save errors", async () => {
    const user = userEvent.setup()
    ;(global.fetch as any).mockRejectedValueOnce(new Error("API Error"))

    render(<WorkoutTracker />)

    // Add exercise and set
    await user.click(screen.getByLabelText(/Add Exercise/i))
    await user.click(screen.getByText(/Bench Press/i))
    await user.click(screen.getByText(/Add Selected/i))
    await user.click(screen.getByText(/Add Set/i))

    // Trigger save
    await user.click(screen.getByLabelText(/Save Workout/i))

    await waitFor(() => {
      // Verify error toast
      expect(mockToast).toHaveBeenCalledWith({
        title: "Error saving workout",
        description: "Please try again later.",
        variant: "destructive",
      })

      // Verify haptic feedback
      expect(mockHaptic.error).toHaveBeenCalled()
    })
  })

  it("should prevent double submission while saving", async () => {
    const user = userEvent.setup()
    const saveMock = vi.fn(() => new Promise(resolve => setTimeout(resolve, 100)))
    ;(global.fetch as any).mockImplementation(saveMock)

    render(<WorkoutTracker />)

    // Add exercise and set
    await user.click(screen.getByLabelText(/Add Exercise/i))
    await user.click(screen.getByText(/Bench Press/i))
    await user.click(screen.getByText(/Add Selected/i))
    await user.click(screen.getByText(/Add Set/i))

    // First click
    const saveButton = screen.getByLabelText(/Save Workout/i)
    await user.click(saveButton)
    
    // Second click should be prevented
    await user.click(saveButton)

    expect(saveMock).toHaveBeenCalledTimes(1)
  })
})
