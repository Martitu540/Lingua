"use client"

import { useState } from "react"
import type { Exercise } from "@/types/database"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

interface MatchingExerciseProps {
  exercise: Exercise
  onSubmit: (answer: { pairs: [string, string][] }, isCorrect: boolean) => void
  disabled: boolean
  selectedAnswer: unknown
}

export function MatchingExercise({
  exercise,
  onSubmit,
  disabled,
  selectedAnswer,
}: MatchingExerciseProps) {
  const content = exercise.content as any

  const [selectedLeft, setSelectedLeft] = useState<string | null>(null)
  const [pairs, setPairs] = useState<[string, string][]>(
    ((selectedAnswer as { pairs: [string, string][] } | null)?.pairs) || [],
  )

  const left: string[] = content.left || []
  const right: string[] = content.right || []
  const correctPairs: [string, string][] = content.correct_pairs || []

  const usedRight = new Set(pairs.map(([, r]) => r))
  const usedLeft = new Set(pairs.map(([l]) => l))

  const handleLeftClick = (l: string) => {
    if (disabled || usedLeft.has(l)) return
    setSelectedLeft(l === selectedLeft ? null : l)
  }

  const handleRightClick = (r: string) => {
    if (disabled || usedRight.has(r) || !selectedLeft) return
    const newPairs: [string, string][] = [...pairs, [selectedLeft, r]]
    setPairs(newPairs)
    setSelectedLeft(null)
  }

  const handleCheck = () => {
    const norm = (arr: [string, string][]) =>
      [...arr].sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1]))

    const correct = norm(correctPairs)
    const user = norm(pairs)

    const isCorrect =
      user.length === correct.length &&
      user.every(([a, b], idx) => a === correct[idx][0] && b === correct[idx][1])

    onSubmit({ pairs }, isCorrect)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 w-full max-w-lg rounded-2xl border-2 border-border/50 bg-card p-6 shadow-xl">
        <p className="text-sm font-medium text-primary">
          {content.question || "Match the pairs"}
        </p>
      </div>

      <div className="grid w-full max-w-lg grid-cols-2 gap-4">
        <div className="space-y-2">
          {left.map((l) => (
            <button
              key={l}
              type="button"
              disabled={disabled || usedLeft.has(l)}
              onClick={() => handleLeftClick(l)}
              className={cn(
                "w-full rounded-xl border-2 px-3 py-2 text-left text-sm transition-all",
                usedLeft.has(l)
                  ? "bg-muted text-muted-foreground"
                  : selectedLeft === l
                  ? "border-primary bg-primary/10"
                  : "hover:border-primary hover:bg-primary/5",
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="space-y-2">
          {right.map((r) => (
            <button
              key={r}
              type="button"
              disabled={disabled || usedRight.has(r)}
              onClick={() => handleRightClick(r)}
              className={cn(
                "w-full rounded-xl border-2 px-3 py-2 text-left text-sm transition-all",
                usedRight.has(r)
                  ? "bg-muted text-muted-foreground"
                  : "hover:border-primary hover:bg-primary/5",
              )}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {!disabled && (
        <Button
          onClick={handleCheck}
          disabled={pairs.length === 0}
          className="mt-6 h-12 w-full max-w-lg rounded-xl text-lg font-semibold shadow-lg"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Check Matches
        </Button>
      )}
    </div>
  )
}
