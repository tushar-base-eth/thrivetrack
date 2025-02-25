"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion } from "framer-motion"
import { exerciseGroups } from "@/lib/exercises"

interface ExerciseSelectorProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  selectedExercises: string[]
  onExerciseToggle: (id: string) => void
  onAddExercises: () => void
}

export function ExerciseSelector({
  open,
  onOpenChange,
  selectedExercises,
  onExerciseToggle,
  onAddExercises,
}: ExerciseSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTab, setSelectedTab] = useState<"all" | "byMuscle">("all")
  const [selectedMuscleGroup, setSelectedMuscleGroup] = useState<string | null>(null)

  const muscleGroups = Array.from(
    new Set(
      Object.values(exerciseGroups)
        .flat()
        .map((ex) => ex.primary_muscle_group),
    ),
  )

  const filteredExercises = Object.entries(exerciseGroups).reduce(
    (acc, [group, exercises]) => {
      const filtered = exercises.filter(
        (ex) =>
          ex.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
          (selectedTab === "all" || !selectedMuscleGroup || ex.primary_muscle_group === selectedMuscleGroup),
      )
      if (filtered.length > 0) {
        acc[group] = filtered
      }
      return acc
    },
    {} as typeof exerciseGroups,
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
              onValueChange={(value: "all" | "byMuscle") => {
                setSelectedTab(value)
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
              {selectedTab === "byMuscle" && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {muscleGroups.map((muscle) => (
                    <Button
                      key={muscle}
                      variant={selectedMuscleGroup === muscle ? "default" : "outline"}
                      onClick={() => setSelectedMuscleGroup(selectedMuscleGroup === muscle ? null : muscle)}
                      className="rounded-full"
                      size="sm"
                    >
                      {muscle}
                    </Button>
                  ))}
                </div>
              )}

              {Object.entries(filteredExercises).map(([group, exercises]) => (
                <div key={group}>
                  <h3 className="font-semibold mb-2">{group}</h3>
                  <div className="space-y-2">
                    {exercises.map((exercise) => (
                      <motion.div key={exercise.id} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
                        <div
                          className="flex items-center gap-4 p-4 rounded-xl border cursor-pointer hover:bg-accent/5 transition-colors"
                          onClick={() => onExerciseToggle(exercise.id)}
                        >
                          <div className="flex-1">
                            <div>{exercise.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {exercise.primary_muscle_group}
                              {exercise.secondary_muscle_group && `, ${exercise.secondary_muscle_group}`}
                            </div>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-md border flex items-center justify-center transition-colors
                              ${
                                selectedExercises.includes(exercise.id)
                                  ? "bg-[#4B7BFF] border-[#4B7BFF] text-white"
                                  : "border-input"
                              }`}
                          >
                            {selectedExercises.includes(exercise.id) && "✓"}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <div className="p-4 bg-background/80 backdrop-blur-sm border-t">
            <Button
              onClick={onAddExercises}
              disabled={selectedExercises.length === 0}
              className="w-full bg-[#4B7BFF] hover:bg-[#4B7BFF]/90 text-white rounded-xl h-12"
            >
              Add {selectedExercises.length} Exercise{selectedExercises.length !== 1 ? "s" : ""}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}

