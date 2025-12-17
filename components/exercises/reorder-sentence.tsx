"use client"

import { useState } from "react"
import type { Exercise } from "@/types/database"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Sparkles } from "lucide-react"

interface ReorderSentenceExerciseProps {
  exercise: Exercise
  onSubmit: (answer: string[], isCorrect: boolean) => void
  disabled: boolean
  selectedAnswer: unknown
}

export function ReorderSentenceExercise({
  exercise,
  onSubmit,
  disabled,
  selectedAnswer,
}: ReorderSentenceExerciseProps) {
  const content = exercise.content as any
  const words: string[] = content.words || []
  const correct: string[] = content.correct || []

  const initial = (selectedAnswer as string[]) || []
  const [chosen, setChosen] = useState<string[]>(initial)
  const [available, setAvailable] = useState<string[]>(
    initial.length ? words.filter((w) => !initial.includes(w)) : words,
  )

  const handleWordClick = (w: string) => {
    if (disabled) return
    setChosen((prev) => [...prev, w])
    setAvailable((prev) => prev.filter((x) => x !== w))
  }

  const handleChosenClick = (w: string, index: number) => {
    if (disabled) return
    setChosen((prev) => prev.filter((_, i) => i != index))
    setAvailable((prev) => [...prev, w])
  }

  const handleCheck = () => {
    const isCorrect =
      chosen.length === correct.length &&
      chosen.every((w, i) => w === correct[i])

    onSubmit(chosen, isCorrect)
  }

  return (
    <div className="flex flex-col items-center">
      <div className="mb-6 w-full max-w-lg rounded-2xl border-2 border-border/50 bg-card p-6 shadow-xl">
        <p className="text-sm font-medium text-primary">
          {content.question || "Reorder the words to form a sentence"}
        </p>
      </div>

      <div className="mb-4 flex min-h-[56px] w-full max-w-lg flex-wrap gap-2 rounded-xl border border-dashed border-border bg-muted/40 px-3 py-2">
        {chosen.length === 0 && (
          <span className="text-sm text-muted-foreground">
            Tap words below to build the sentence
          </span>
        )}
        {chosen.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => handleChosenClick(w, i)}
            disabled={disabled}
            className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary hover:bg-primary/20"
          >
            {w}
          </button>
        ))}
      </div>

      <div className="flex w-full max-w-lg flex-wrap gap-2">
        {available.map((w, i) => (
          <button
            key={`${w}-${i}`}
            type="button"
            onClick={() => handleWordClick(w)}
            disabled={disabled}
            className={cn(
              "rounded-full border border-border bg-card px-3 py-1 text-sm transition-all hover:border-primary hover:bg-primary/5",
            )}
          >
            {w}
          </button>
        ))}
      </div>

      {!disabled && (
        <Button
          onClick={handleCheck}
          disabled={chosen.length === 0}
          className="mt-6 h-12 w-full max-w-lg rounded-xl text-lg font-semibold shadow-lg"
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Check Sentence
        </Button>
      )}
    </div>
  )
}
