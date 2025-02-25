import type { Workout } from "@/types/workouts"

export const initialWorkouts: Workout[] = [
  {
    id: "1",
    date: "2025-02-23",
    time: "10:33 PM",
    duration: 45,
    totalVolume: 3240,
    exercises: [
      {
        id: "exe-1-1",
        workout_exercise_id: "exe-1-1",
        created_at: "2023-01-01T00:00:00Z",
        name: "Barbell Bench Press",
        sets: [
          { 
            id: "set-1-1",
            reps: 12, 
            weight_kg: 60, 
            workout_exercise_id: "exe-1-1", 
            created_at: "2023-01-01T00:00:00Z" 
          },
          { 
            id: "set-1-2",
            reps: 10, 
            weight_kg: 65, 
            workout_exercise_id: "exe-1-1", 
            created_at: "2023-01-01T00:00:00Z" 
          },
          { 
            id: "set-1-3",
            reps: 8, 
            weight_kg: 70, 
            workout_exercise_id: "exe-1-1", 
            created_at: "2023-01-01T00:00:00Z" 
          },
        ],
      },
      {
        name: "Pull-ups",
        sets: [
          { reps: 10, weight_kg: 0 },
          { reps: 8, weight_kg: 0 },
          { reps: 6, weight_kg: 0 },
        ],
      },
    ],
  },
  {
    id: "2",
    date: "2025-02-22",
    time: "8:15 AM",
    duration: 60,
    totalVolume: 4150,
    exercises: [
      {
        name: "Squats",
        sets: [
          { reps: 10, weight_kg: 100 },
          { reps: 8, weight_kg: 110 },
          { reps: 6, weight_kg: 120 },
        ],
      },
      {
        name: "Deadlifts",
        sets: [
          { reps: 8, weight_kg: 130 },
          { reps: 6, weight_kg: 140 },
          { reps: 4, weight_kg: 150 },
        ],
      },
    ],
  },
  {
    id: "3",
    date: "2025-02-20",
    time: "4:45 PM",
    duration: 50,
    totalVolume: 2800,
    exercises: [
      {
        name: "Shoulder Press",
        sets: [
          { reps: 12, weight_kg: 40 },
          { reps: 10, weight_kg: 45 },
          { reps: 8, weight_kg: 50 },
        ],
      },
      {
        name: "Bent-Over Row",
        sets: [
          { reps: 12, weight_kg: 60 },
          { reps: 10, weight_kg: 65 },
          { reps: 8, weight_kg: 70 },
        ],
      },
    ],
  },
]
