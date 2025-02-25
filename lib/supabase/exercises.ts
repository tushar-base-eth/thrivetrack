import { ExerciseSelection } from "@/components/exercise/types"

export interface ExerciseGroup {
  [key: string]: ExerciseSelection[]
}

export async function fetchExercises(): Promise<{ grouped: ExerciseGroup; flat: ExerciseSelection[] }> {
  const response = await fetch("/api/v1/available_exercises", {
    credentials: "include"
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || "Failed to fetch exercises")
  }

  return response.json()
}
