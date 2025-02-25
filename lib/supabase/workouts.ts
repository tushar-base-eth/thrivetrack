import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Database } from "@/types/supabase"
import { WorkoutSubmission, WorkoutSummary } from "@/lib/types/workouts"

const supabase = createClientComponentClient<Database>()

// Define a simpler interface for workout data that doesn't require
// all the database fields since the stored procedure will handle that
interface SimplifiedWorkout {
  user_id: string
  created_at: string
  totalVolume: number
  exercises: {
    name: string
    sets: {
      reps: number
      weight_kg: number
    }[]
  }[]
}

interface SaveWorkoutOptions {
  workout: SimplifiedWorkout
  userId: string
}

interface WorkoutTransaction {
  workoutId: string
  exerciseIds: string[]
  workoutExerciseIds: string[]
}

/**
 * Saves a workout and its exercises to the database in a transaction.
 * Also updates user stats and daily volume.
 */
export async function saveWorkout({ workout, userId }: SaveWorkoutOptions) {
  const { data: workoutData, error: workoutError } = await supabase
    .from("workouts")
    .insert({
      user_id: userId,
      created_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (workoutError || !workoutData) {
    throw new Error(`Failed to create workout: ${workoutError?.message}`)
  }

  const workoutId = workoutData.id

  // Create workout exercises and sets
  try {
    await supabase.rpc("create_workout_with_exercises", {
      p_workout_id: workoutId,
      p_user_id: userId,
      p_total_volume: workout.totalVolume,
      p_exercises: workout.exercises.map(exercise => ({
        name: exercise.name,
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight_kg: set.weight_kg,
        })),
      })),
    })
  } catch (error) {
    // If anything fails, delete the workout to maintain consistency
    await supabase.from("workouts").delete().eq("id", workoutId)
    throw new Error(`Failed to save workout exercises: ${error}`)
  }

  return workoutId
}

/**
 * Retrieves a workout by its ID, including all exercises and sets
 */
export async function getWorkoutById(workoutId: string) {
  const { data: workoutData, error: workoutError } = await supabase
    .from("workouts")
    .select(`
      id,
      created_at,
      workout_exercises (
        id,
        exercise_id,
        available_exercises (
          name,
          primary_muscle_group,
          secondary_muscle_group
        ),
        sets (
          reps,
          weight_kg
        )
      )
    `)
    .eq("id", workoutId)
    .single()

  if (workoutError || !workoutData) {
    throw new Error(`Failed to get workout: ${workoutError?.message}`)
  }

  return workoutData
}

/**
 * Gets paginated workouts for a user
 */
export async function getWorkouts(userId: string, page = 1, pageSize = 20) {
  const start = (page - 1) * pageSize
  const end = start + pageSize - 1

  const { data: workouts, error } = await supabase
    .from("workouts")
    .select(
      `
      id,
      created_at,
      workout_exercises (
        id,
        exercise_id,
        sets (
          id,
          weight_kg,
          reps
        )
      )
    `
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(start, end)

  if (error) {
    throw error
  }

  return workouts
}

/**
 * Deletes a workout and all related data (exercises, sets)
 * Also updates user stats and daily volume
 */
export async function deleteWorkout(workoutId: string, userId: string) {
  const { error } = await supabase
    .from("workouts")
    .delete()
    .eq("id", workoutId)
    .eq("user_id", userId)

  if (error) {
    throw error
  }
}
