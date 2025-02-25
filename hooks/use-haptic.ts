"use client"

export function useHaptic() {
  const trigger = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate(10)
    }
  }

  const success = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([10, 50, 10])
    }
  }

  const error = () => {
    if ("vibrate" in navigator) {
      navigator.vibrate([50, 100, 50])
    }
  }

  return { trigger, success, error }
}

