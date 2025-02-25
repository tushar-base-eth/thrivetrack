import type { Exercise } from "@/types/exercises"

export interface ExerciseGroup {
  [key: string]: Exercise[]
}

export async function fetchExercises(): Promise<{ grouped: ExerciseGroup; flat: Exercise[] }> {
  const response = await fetch("/api/v1/available_exercises", {
    credentials: "include"
  })

  if (!response.ok) {
    const error = await response.json().catch(() => null)
    throw new Error(error?.error || "Failed to fetch exercises")
  }

  return response.json()
}
