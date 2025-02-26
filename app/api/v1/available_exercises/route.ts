import { NextResponse } from "next/server"
import { type Database } from "@/types/supabase"
import { createClient } from "@/utils/supabase/server"

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from("available_exercises")
      .select("*")

    if (error) throw error

    return NextResponse.json({
      grouped: data.reduce((acc, exercise) => {
        const group = exercise.primary_muscle_group
        acc[group] = [...(acc[group] || []), exercise]
        return acc
      }, {} as Record<string, Database['public']['Tables']['available_exercises']['Row'][]>),
      flat: data
    })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}
