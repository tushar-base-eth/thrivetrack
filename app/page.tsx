"use client"

import { WorkoutTracker } from "@/components/exercise/workout-tracker"
import { BottomNav } from "@/components/navigation/bottom-nav"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <WorkoutTracker />
      <BottomNav />
    </div>
  )
}

