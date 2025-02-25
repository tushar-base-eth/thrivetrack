"use client"

import { useState, useTransition } from "react"
import { Plus, Save } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { ExerciseList } from "@/components/exercise/exercise-list"
import { ExerciseSelector } from "@/components/exercise/exercise-selector"
import { SetEditor } from "@/components/exercise/set-editor"
import { WorkoutWelcome } from "@/components/exercise/workout-welcome"
import { ExerciseSkeleton } from "@/components/loading/exercise-skeleton"
import { useHaptic } from "@/hooks/use-haptic"
import type { WorkoutExercise } from "@/types/exercises"
import type { Workout } from "@/types/workouts"
import { exerciseGroups } from "@/lib/exercises"

export function WorkoutTracker() {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null)
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])
  const [isPending, startTransition] = useTransition()
  const haptic = useHaptic()

  const isWorkoutValid =
    exercises.length > 0 &&
    exercises.every(
      (exercise) => exercise.sets.length > 0 && exercise.sets.every((set) => set.reps > 0 && set.weight_kg > 0),
    )

  const calculateTotalVolume = (exercises: WorkoutExercise[]) => {
    return exercises.reduce((total, exercise) => {
      return (
        total +
        exercise.sets.reduce((setTotal, set) => {
          return setTotal + set.weight_kg * set.reps
        }, 0)
      )
    }, 0)
  }

  const handleExerciseToggle = (id: string) => {
    haptic.trigger()
    setSelectedExercises((prev) => {
      const newSelection = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
      return newSelection
    })
  }

  const handleAddExercises = () => {
    startTransition(() => {
      const newExercises = selectedExercises
        .map((id) => {
          const exercise = Object.values(exerciseGroups)
            .flat()
            .find((e) => e.id === id)
          if (!exercise) return null
          return {
            exercise,
            sets: [{ weight_kg: 0, reps: 0 }],
          }
        })
        .filter((ex): ex is WorkoutExercise => ex !== null)

      setExercises([...exercises, ...newExercises])
      setSelectedExercises([])
      setShowExerciseModal(false)
      haptic.success()
    })
  }

  const handleUpdateSets = (exerciseIndex: number, newSets: Set[]) => {
    if (exerciseIndex === -1) return
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex] = { ...exercises[exerciseIndex], sets: newSets }
    setExercises(updatedExercises)

    // Update selectedExercise if it's the same exercise being edited
    if (selectedExercise && selectedExercise.exercise.id === updatedExercises[exerciseIndex].exercise.id) {
      setSelectedExercise(updatedExercises[exerciseIndex])
    }

    haptic.trigger()
  }

  const handleRemoveExercise = (index: number) => {
    startTransition(() => {
      setExercises(exercises.filter((_, i) => i !== index))
      haptic.error()
    })
  }

  const handleSaveWorkout = () => {
    if (isWorkoutValid) {
      startTransition(() => {
        const now = new Date()
        const workout: Workout = {
          id: crypto.randomUUID(),
          date: now.toISOString().split("T")[0],
          time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
          totalVolume: calculateTotalVolume(exercises),
          exercises: exercises.map((ex) => ({
            name: ex.exercise.name,
            sets: ex.sets.map((set) => ({
              reps: set.reps,
              weight: set.weight_kg,
            })),
          })),
        }

        // Get existing workouts from localStorage
        const existingWorkouts = JSON.parse(localStorage.getItem("workouts") || "[]")
        // Add new workout
        const updatedWorkouts = [workout, ...existingWorkouts]
        // Save back to localStorage
        localStorage.setItem("workouts", JSON.stringify(updatedWorkouts))

        setExercises([])
        haptic.success()
      })
    }
  }

  return (
    <div className="p-4 space-y-6">
      <WorkoutWelcome />

      {isPending ? (
        <ExerciseSkeleton />
      ) : (
        <ExerciseList
          exercises={exercises}
          onExerciseSelect={setSelectedExercise}
          onExerciseRemove={handleRemoveExercise}
        />
      )}

      {/* Action Buttons */}
      <div className="fixed bottom-20 right-4 flex flex-col gap-4">
        <AnimatePresence>
          {isWorkoutValid && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.8, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <Button
                size="icon"
                onClick={handleSaveWorkout}
                className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-green-500 hover:bg-green-600 active:scale-95"
              >
                <Save className="h-6 w-6" />
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="icon"
            onClick={() => {
              setShowExerciseModal(true)
              haptic.trigger()
            }}
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-[#4B7BFF] hover:bg-[#4B7BFF]/90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>

      <ExerciseSelector
        open={showExerciseModal}
        onOpenChange={setShowExerciseModal}
        selectedExercises={selectedExercises}
        onExerciseToggle={handleExerciseToggle}
        onAddExercises={handleAddExercises}
      />

      {selectedExercise && (
        <SetEditor
          exercise={selectedExercise}
          onClose={() => setSelectedExercise(null)}
          onUpdateSets={handleUpdateSets}
          exerciseIndex={exercises.findIndex((ex) => ex.exercise.id === selectedExercise.exercise.id)}
        />
      )}
    </div>
  )
}

