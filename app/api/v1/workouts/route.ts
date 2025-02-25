import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type Database } from "@/types/supabase"
import { WorkoutSubmission } from "@/lib/types/workouts"
import { saveWorkout } from "@/lib/supabase/workouts"

// Validation schema for workout data
const workoutSetSchema = z.object({
  reps: z.number().min(1),
  weight_kg: z.number().min(0),
})

const workoutExerciseSchema = z.object({
  name: z.string().min(1),
  sets: z.array(workoutSetSchema),
})

const workoutSchema = z.object({
  exercises: z.array(workoutExerciseSchema),
  totalVolume: z.number(),
  created_at: z.string().datetime(),
})

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>(cookieStore)
    
    // Log cookies for debugging
    console.log('Cookies:', cookieStore.getAll())
    
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    // Log auth status
    console.log('Auth status:', { 
      hasSession: !!session, 
      userId: session?.user?.id,
      error: authError
    })

    if (authError || !session?.user) {
      console.error("Auth error:", authError || "No session")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    const result = workoutSchema.safeParse(body)

    if (!result.success) {
      return new NextResponse(JSON.stringify(result.error), { status: 400 })
    }

    const workout = result.data

    // Create a simpler data structure that the stored procedure can handle
    // instead of trying to match the full WorkoutExercise type
    await saveWorkout({
      workout: {
        user_id: session.user.id,
        created_at: workout.created_at,
        totalVolume: workout.totalVolume,
        exercises: workout.exercises.map(exercise => ({
          name: exercise.name,
          sets: exercise.sets
        }))
      },
      userId: session.user.id,
    })

    return new NextResponse(JSON.stringify({ success: true }), { status: 200 })
  } catch (error) {
    console.error("Error saving workout:", error)
    return new NextResponse(JSON.stringify({ error: "Internal Server Error" }), {
      status: 500,
    })
  }
}
