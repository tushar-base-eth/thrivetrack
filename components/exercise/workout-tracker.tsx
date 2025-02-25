"use client"

// TODO: Implement haptic feedback when haptics module is ready

import { useState, useTransition } from "react"
import { Plus, Save } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { useToast } from "@/components/ui/use-toast"
import { ExerciseList } from "./exercise-list"
import { ExerciseSelector } from "./exercise-selector"
import { SetEditor } from "./set-editor"
import { WorkoutWelcome } from "./workout-welcome"
import { ExerciseSkeleton } from "@/components/loading/exercise-skeleton"
import type { WorkoutExercise, Exercise, Set } from "@/types/exercises"
import type { Workout } from "@/types/workouts"
import { supabase } from "@/utils/supabase/client"

export function WorkoutTracker() {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null)
  const [showExerciseModal, setShowExerciseModal] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isSaving, setIsSaving] = useState(false)
  const { toast } = useToast()

  const isWorkoutValid =
    exercises.length > 0 &&
    exercises.every(
      (exercise) =>
        exercise.sets.length > 0 &&
        exercise.sets.every((set) => set.reps > 0 && set.weight_kg > 0)
    )

  const handleUpdateSets = (exerciseIndex: number, newSets: Set[]) => {
    if (exerciseIndex === -1) return
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex] = { ...exercises[exerciseIndex], sets: newSets }
    setExercises(updatedExercises)

    // Update selectedExercise if it's the same exercise being edited
    if (selectedExercise && selectedExercise.id === updatedExercises[exerciseIndex].id) {
      setSelectedExercise(updatedExercises[exerciseIndex])
    }
  }

  const handleExerciseSelect = (exercise: WorkoutExercise) => {
    // Find the full exercise data from our exercises array
    const existingExercise = exercises.find(ex => ex.id === exercise.id)
    if (existingExercise) {
      setSelectedExercise(existingExercise)
    }
  }

  const handleRemoveExercise = (index: number) => {
    startTransition(() => {
      setExercises(exercises.filter((_, i) => i !== index))
    })
  }

  const handleSaveWorkout = async () => {
    if (!isWorkoutValid) return

    setIsSaving(true)
    const now = new Date()
    
    const workout: Omit<Workout, "id"> = {
      created_at: now.toISOString(),
      exercises: exercises.map(({ exercise, sets }) => ({
        name: exercise.name,
        sets: sets.map(set => ({
          reps: set.reps,
          weight: set.weight_kg,
        })),
      })),
      totalVolume: exercises.reduce(
        (total, { sets }) =>
          total +
          sets.reduce((setTotal, set) => setTotal + set.weight_kg * set.reps, 0),
        0
      ),
    }

    try {
      // Log auth state before making request
      const { data: { session } } = await supabase.auth.getSession()
      console.log('Client auth status:', {
        hasSession: !!session,
        userId: session?.user?.id
      })

      const response = await fetch("/api/v1/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(workout),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => null)
        throw new Error(error?.error || "Failed to save workout")
      }

      toast({
        title: "Workout saved!",
        description: "Your workout has been saved successfully.",
      })

      // Reset state
      setExercises([])
      setSelectedExercise(null)
    } catch (error) {
      console.error("Error saving workout:", error)
      toast({
        title: "Error",
        description: "Failed to save workout. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
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
          onExerciseSelect={handleExerciseSelect}
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
                disabled={isSaving}
                aria-label="Save Workout"
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
            }}
            aria-label="Add Exercise"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all bg-[#4B7BFF] hover:bg-[#4B7BFF]/90"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </motion.div>
      </div>

      <ExerciseSelector
        open={showExerciseModal}
        onOpenChange={setShowExerciseModal}
        onAddExercises={(selectedExerciseData) => {
          startTransition(() => {
            const newExercises = selectedExerciseData.map((exercise) => ({
              id: exercise.id,
              exercise,
              sets: [{ weight_kg: 0, reps: 0 }],
            }))

            setExercises([...exercises, ...newExercises])
            setShowExerciseModal(false)
          })
        }}
      />

      {selectedExercise && (
        <SetEditor
          exercise={selectedExercise}
          exerciseIndex={exercises.findIndex(
            (ex) => ex.id === selectedExercise.id
          )}
          onClose={() => setSelectedExercise(null)}
          onUpdateSets={handleUpdateSets}
        />
      )}
    </div>
  )
}
