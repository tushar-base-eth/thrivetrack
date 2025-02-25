import { NextRequest, NextResponse } from "next/server"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import { type Database } from "@/types/supabase"
import { WorkoutSubmission } from "@/lib/types/workouts"
import { saveWorkout } from "@/lib/supabase/workouts"
import { workoutSubmissionSchema, workoutInsertSchema } from "@/lib/validations/workouts"

// POST /api/v1/workouts - Save a new workout
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore })
    
    // Check if user is authenticated
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      return new NextResponse(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401 }
      )
    }
    
    // Get user ID from session
    const userId = session.user.id
    
    // Parse request body
    const body = await request.json()
    
    // Validate request body using Zod schema
    const validationResult = workoutSubmissionSchema.safeParse(body)
    if (!validationResult.success) {
      return new NextResponse(
        JSON.stringify({ 
          error: "Invalid request body",
          details: validationResult.error.format()
        }),
        { status: 400 }
      )
    }

    // Extract validated data
    const workoutData = validationResult.data
    
    // Ensure workout belongs to authenticated user
    if (workoutData.user_id !== userId) {
      return new NextResponse(
        JSON.stringify({ error: "Cannot create workout for another user" }),
        { status: 403 }
      )
    }
    
    // Create workout base record - only fields in the database schema
    const workoutInsert = workoutInsertSchema.parse({
      user_id: userId,
      created_at: new Date().toISOString(),
    });
    
    // Save workout including metadata (name, totalVolume) which is stored in a separate table/field
    const result = await saveWorkout({
      ...workoutData,
      workoutRecord: workoutInsert
    })
    
    if (!result) {
      return new NextResponse(
        JSON.stringify({ error: "Failed to save workout" }),
        { status: 500 }
      )
    }
    
    return NextResponse.json({ success: true, id: result.id })
  } catch (error) {
    console.error("Error saving workout:", error)
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      { status: 500 }
    )
  }
}
