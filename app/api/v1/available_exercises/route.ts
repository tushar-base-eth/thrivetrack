import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

// Make route static
export const dynamic = "force-static";

export async function GET() {
  try {
    // Move client creation inside the request handler
    const supabase = createClient();
    
    const { data, error } = await supabase
      .from("available_exercises")
      .select("*");

    if (error) {
      console.error("Error fetching exercises:", error);
      return new NextResponse(
        JSON.stringify({ error: "Failed to fetch exercises" }),
        {
          status: 500,
        }
      );
    }

    // Convert to Exercise type and group by muscle group
    const exercises = data.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      primary_muscle_group: exercise.primary_muscle_group,
      secondary_muscle_group: exercise.secondary_muscle_group || undefined,
    }));

    // Group exercises by primary muscle group
    const groupedExercises = exercises.reduce<
      Record<string, (typeof exercises)[0][]>
    >((acc, exercise) => {
      const group = exercise.primary_muscle_group;
      if (!acc[group]) {
        acc[group] = [];
      }
      acc[group].push(exercise);
      return acc;
    }, {});

    return NextResponse.json({
      grouped: groupedExercises,
      flat: exercises,
    });
  } catch (error) {
    console.error("Error in exercises API:", error);
    return new NextResponse(
      JSON.stringify({ error: "Internal Server Error" }),
      {
        status: 500,
      }
    );
  }
}
