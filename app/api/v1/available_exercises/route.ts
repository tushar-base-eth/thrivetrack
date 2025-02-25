import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { type Database } from "@/types/supabase";
import { ExerciseSelection } from "@/components/exercise/types";

// Make route static
export const dynamic = "force-static";

export async function GET() {
  try {
    // Move client creation inside the request handler
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient<Database>({ cookies: () => cookieStore });
    
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

    // Convert to ExerciseSelection type
    const exercises: ExerciseSelection[] = data.map((exercise) => ({
      id: exercise.id,
      name: exercise.name,
      primary_muscle_group: exercise.primary_muscle_group,
      secondary_muscle_group: exercise.secondary_muscle_group || undefined,
      description: exercise.description || undefined,
    }));

    // Group exercises by primary muscle group
    const groupedExercises = exercises.reduce<
      Record<string, ExerciseSelection[]>
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
