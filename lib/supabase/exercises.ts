import { ExerciseSelection } from "@/components/exercise/types"

export interface ExerciseGroup {
  [key: string]: ExerciseSelection[]
}

export async function fetchExercises() {
  const response = await fetch("/api/v1/available_exercises")
  if (!response.ok) throw new Error("Failed to fetch exercises")
  return response.json() as Promise<{
    grouped: Record<string, ExerciseSelection[]>
    flat: ExerciseSelection[]
  }>
}
