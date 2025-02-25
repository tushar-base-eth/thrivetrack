"use client"

// TODO: Implement haptic feedback when haptics module is ready

import { useState, useTransition } from "react"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useRouter } from "next/navigation"
import { ExerciseSelector } from "./exercise-selector"
import { ExerciseList } from "./exercise-list"
import { SetEditor } from "./set-editor"
import { ExerciseSkeleton } from "./exercise-skeleton"
import { format } from "date-fns"
import { AlertDialog, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogFooter, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Label } from "@/components/ui/label"
import { motion, AnimatePresence } from "framer-motion"
import { Check, Dumbbell, Plus, Save, X } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { saveWorkout } from "@/lib/supabase/workouts"
import { supabase } from "@/utils/supabase/client"
import { LocalExercise } from "./types"

// Create a simplified version of WorkoutExercise for local use in this component
// export type LocalExercise = {
//   id?: string // Optional ID for local management
//   exercise_id?: string
//   name: string
//   sets: {
//     id?: string
//     reps: number
//     weight_kg: number
//   }[]
//   exercise?: {
//     id: string
//     name: string
//     category?: string
//     description?: string
//   }
// }

export function WorkoutTracker() {
  const [exercises, setExercises] = useState<LocalExercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<LocalExercise | null>(null)
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

  const handleUpdateSets = (exerciseIndex: number, newSets: LocalExercise['sets']) => {
    if (exerciseIndex === -1) return
    const updatedExercises = [...exercises]
    updatedExercises[exerciseIndex] = { ...exercises[exerciseIndex], sets: newSets }
    setExercises(updatedExercises)

    // Update selectedExercise if it's the same exercise being edited
    if (selectedExercise && selectedExercise.id === updatedExercises[exerciseIndex].id) {
      setSelectedExercise(updatedExercises[exerciseIndex])
    }
  }

  const handleExerciseSelect = (exercise: LocalExercise) => {
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
    setIsSaving(true)

    // Create workout object with current data
    const workout = {
      exercises: exercises.map(exercise => ({
        name: exercise.exercise?.name || exercise.name,
        sets: exercise.sets.map(set => ({
          reps: set.reps,
          weight_kg: set.weight_kg,
        }))
      })),
      created_at: new Date().toISOString(),
      totalVolume: exercises.reduce(
        (total, exercise) =>
          total +
          exercise.sets.reduce((setTotal, set) => setTotal + set.weight_kg * set.reps, 0),
        0
      ),
    }

    try {
      // Check session exists
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Authentication Error",
          description: "You are not logged in. Please sign in to save workouts.",
          variant: "destructive"
        })
        setIsSaving(false)
        window.location.href = '/auth'
        return
      }

      const response = await fetch("/api/v1/workouts", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
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
        <div className="flex flex-col gap-4 w-full">
          <ExerciseList
            exercises={exercises}
            onExerciseSelect={handleExerciseSelect}
            onRemoveExercise={handleRemoveExercise}
          />
        </div>
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
            const newExercises: LocalExercise[] = selectedExerciseData.map((exercise) => ({
              id: exercise.id,
              exercise_id: exercise.id,
              name: exercise.name,
              sets: [{ weight_kg: 0, reps: 0 }],
              exercise: {
                id: exercise.id,
                name: exercise.name,
                category: exercise.primary_muscle_group,
                description: exercise.description
              },
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
