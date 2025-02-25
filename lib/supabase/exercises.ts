import { supabase } from "@/lib/supabase/client"
import type { Exercise } from "@/types/exercises"

export interface ExerciseGroup {
  [key: string]: Exercise[]
}

export async function fetchExercises(): Promise<{ grouped: ExerciseGroup; flat: Exercise[] }> {
  const { data, error } = await supabase
    .from("available_exercises")
    .select("*")

  if (error) {
    console.error("Error fetching exercises:", error)
    throw error
  }

  // Convert to Exercise type
  const exercises = data.map((exercise): Exercise => ({
    id: exercise.id,
    name: exercise.name,
    primary_muscle_group: exercise.primary_muscle_group,
    secondary_muscle_group: exercise.secondary_muscle_group || undefined,
  }))

  // Group exercises by primary muscle group
  const groupedExercises = exercises.reduce((acc: ExerciseGroup, exercise) => {
    const group = exercise.primary_muscle_group
    if (!acc[group]) {
      acc[group] = []
    }
    acc[group].push(exercise)
    return acc
  }, {})

  return {
    grouped: groupedExercises,
    flat: exercises
  }
}
