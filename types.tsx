export interface Exercise {
  id: string;
  name: string;
  primary_muscle_group: string;
  secondary_muscle_group?: string;
}

export interface Set {
  weight_kg: number;
  reps: number;
}

export interface WorkoutExercise {
  exercise: Exercise;
  sets: Set[];
}

export interface WorkoutSet {
  reps: number;
  weight: number;
}

export interface Workout {
  id: string;
  date: string;
  time: string;
  totalVolume: number;
  exercises: WorkoutExercise[];
}
