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
  date: string
  time: string
  duration: number
  totalVolume: number
  exercises: WorkoutExercise[]
}

