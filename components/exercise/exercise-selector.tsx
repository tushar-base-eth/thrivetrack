"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { fetchExercises } from "@/lib/supabase/exercises"
import type { Exercise } from "@/types/exercises"
import type { ExerciseGroup } from "@/lib/supabase/exercises"

interface ExerciseSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedExercises: string[]
  onExerciseToggle: (id: string) => void
  onAddExercises: () => void
}

type TabValue = "all" | "byMuscle"

export function ExerciseSelector({
  open,
  onOpenChange,
  selectedExercises,
  onExerciseToggle,
  onAddExercises,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState<TabValue>("all")
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)
  const [exerciseGroups, setExerciseGroups] = useState<ExerciseGroup>({})
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function loadExercises() {
      try {
        const data = await fetchExercises()
        setExerciseGroups(data.grouped)
        setExercises(data.flat)
      } catch (error) {
        console.error("Failed to load exercises:", error)
      } finally {
        setIsLoading(false)
      }
    }

    if (open) {
      loadExercises()
    }
  }, [open])

  const muscleGroups = Array.from(
    new Set(exercises.map((ex) => ex.primary_muscle_group))
  )

  const filteredExercises = selectedTab === "all" 
    ? exercises.filter((ex: Exercise) => 
        ex.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : Object.entries(exerciseGroups).reduce(
        (acc, [group, exercises]) => {
          const filtered = exercises.filter(
            (ex) =>
              ex.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
              (!selectedMuscleGroup || ex.primary_muscle_group === selectedMuscleGroup)
          )
          if (filtered.length > 0) {
            acc[group] = filtered
          }
          return acc
        },
        {} as ExerciseGroup
      )

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[80vh] px-0">
        <div className="flex flex-col h-full">
          <div className="px-6 pb-6 flex items-center justify-between border-b">
            <SheetTitle className="text-xl">Add Exercise</SheetTitle>
            <Button size="icon" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-full h-8 w-8">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="px-6 pt-4 space-y-4">
            <Input
              placeholder="Search exercises..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="rounded-xl bg-accent/10 border-0"
            />
            <Tabs
              value={selectedTab}
              onValueChange={(value: string) => {
                setSelectedTab(value as TabValue)
                setSelectedMuscleGroup(null)
              }}
              className="w-full"
            >
              <TabsList className="w-full p-0.5 h-10 bg-accent/10">
                <TabsTrigger value="all" className="flex-1 rounded-lg">
                  All
                </TabsTrigger>
                <TabsTrigger value="byMuscle" className="flex-1 rounded-lg">
                  By Muscle
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <ScrollArea className="flex-1">
            <div className="px-6 space-y-6 py-4">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <p className="text-muted-foreground">Loading exercises...</p>
                </div>
              ) : (
                <>
                  {selectedTab === "byMuscle" && (
                    <div className="flex flex-wrap gap-2 mb-6">
                      {muscleGroups.map((muscle) => (
                        <Button
                          key={muscle}
                          variant={selectedMuscleGroup === muscle ? "default" : "outline"}
                          onClick={() => setSelectedMuscleGroup(selectedMuscleGroup === muscle ? null : muscle)}
                          className="rounded-full"
                        >
                          {muscle}
                        </Button>
                      ))}
                    </div>
                  )}

                  {selectedTab === "all" ? (
                    <div className="space-y-2">
                      {(filteredExercises as Exercise[]).map((exercise: Exercise) => (
                        <motion.div
                          key={exercise.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                        >
                          <Button
                            variant={selectedExercises.includes(exercise.id) ? "default" : "outline"}
                            onClick={() => onExerciseToggle(exercise.id)}
                            className="w-full justify-start font-normal"
                          >
                            {exercise.name}
                            <span className="ml-auto text-xs text-muted-foreground">
                              {exercise.primary_muscle_group}
                              {exercise.secondary_muscle_group && ` / ${exercise.secondary_muscle_group}`}
                            </span>
                          </Button>
                        </motion.div>
                      ))}</div>
                  ) : (
                    Object.entries(filteredExercises as ExerciseGroup).map(([group, exercises]) => (
                      <div key={group}>
                        <h3 className="font-semibold mb-3">{group}</h3>
                        <div className="space-y-2">
                          {exercises.map((exercise: Exercise) => (
                            <motion.div
                              key={exercise.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                            >
                              <Button
                                variant={selectedExercises.includes(exercise.id) ? "default" : "outline"}
                                onClick={() => onExerciseToggle(exercise.id)}
                                className="w-full justify-start font-normal"
                              >
                                {exercise.name}
                                <span className="ml-auto text-xs text-muted-foreground">
                                  {exercise.primary_muscle_group}
                                  {exercise.secondary_muscle_group && ` / ${exercise.secondary_muscle_group}`}
                                </span>
                              </Button>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </>
              )}
            </div>
          </ScrollArea>

          <div className="px-6 py-4 border-t">
            <Button onClick={onAddExercises} className="w-full">
              Add Selected Exercises
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
