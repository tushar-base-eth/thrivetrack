export interface Exercise {
  id: string
  name: string
  primary_muscle_group: string
  secondary_muscle_group?: string
  description?: string
}

export interface Set {
  weight_kg: number
  reps: number
}

export interface WorkoutExercise {
  exercise: Exercise
  sets: Set[]
}
