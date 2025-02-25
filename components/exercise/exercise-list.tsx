"use client"

import { motion, AnimatePresence } from "framer-motion"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { LocalExercise } from './workout-tracker'

interface ExerciseListProps {
  exercises: LocalExercise[]
  onExerciseSelect: (exercise: LocalExercise) => void
  onRemoveExercise: (index: number) => void
}

export function ExerciseList({ exercises, onExerciseSelect, onRemoveExercise }: ExerciseListProps) {
  return (
    <ScrollArea className="h-[calc(100vh-16rem)]">
      <AnimatePresence initial={false}>
        {exercises.map((exercise, index) => (
          <motion.div
            key={exercise.id || index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            layout
          >
            <motion.div
              drag="x"
              dragConstraints={{ left: -100, right: 0 }}
              dragElastic={0.1}
              onDragEnd={(_, info) => {
                if (info.offset.x < -50) {
                  onRemoveExercise(index)
                }
              }}
              className="cursor-grab active:cursor-grabbing relative"
              whileDrag={{ scale: 1.02 }}
              whileHover={{ scale: 1.01 }}
            >
              <motion.div
                className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-destructive to-transparent flex items-center justify-end pr-4"
                style={{
                  borderTopRightRadius: "0.5rem",
                  borderBottomRightRadius: "0.5rem",
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 0 }}
                whileDrag={{
                  opacity: 1,
                  transition: { duration: 0.2 },
                }}
              >
                <span className="text-sm font-medium text-white">Delete</span>
              </motion.div>

              <Card
                className="overflow-hidden mb-2"
                onClick={() => onExerciseSelect(exercise)}
              >
                <CardContent className="p-3">
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <h3 className="font-medium truncate">
                        {exercise.exercise?.name || exercise.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {exercise.sets.length} sets
                      </p>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {exercise.sets.reduce(
                        (total, set) => total + set.weight_kg * set.reps,
                        0
                      ).toLocaleString()}{" "}
                      kg
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        ))}
      </AnimatePresence>
    </ScrollArea>
  )
}
