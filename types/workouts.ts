export interface WorkoutSet {
  reps: number
  weight: number
}

export interface WorkoutExercise {
  name: string
  sets: WorkoutSet[]
}

export interface Workout {
  id: string
  created_at: string
  exercises: WorkoutExercise[]
  totalVolume: number
}
