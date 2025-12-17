"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import type { Exercise, ExerciseContent } from "@/types/database"
import { cn } from "@/lib/utils"
import { SpeakButton } from "./speak-button"
import { TappableText } from "./tappable-text"
import { Lightbulb, Sparkles } from "lucide-react"

interface FillBlankExerciseProps {
  exercise: Exercise
  onSubmit: (answer: string, isCorrect: boolean) => void
  disabled: boolean
  selectedAnswer: unknown
}

export function FillBlankExercise({ exercise, onSubmit, disabled, selectedAnswer }: FillBlankExerciseProps) {
  const [answer, setAnswer] = useState((selectedAnswer as string) || "")
  const [showHint, setShowHint] = useState(false)
  const [mounted, setMounted] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const content = exercise.content as ExerciseContent
  const correctAnswers = content.correct_answers || []
  const sentence = content.sentence || ""
  const hint = content.hint
  const newWords = content.new_words || []

  useEffect(() => {
    setMounted(true)
    inputRef.current?.focus()
  }, [])

  const handleSubmit = () => {
    if (!answer.trim()) return
    const isCorrect = correctAnswers.some((correct) => correct.toLowerCase().trim() === answer.toLowerCase().trim())
    onSubmit(answer, isCorrect)
  }

  const isCorrect = correctAnswers.some((correct) => correct.toLowerCase().trim() === answer.toLowerCase().trim())

  const parts = sentence.split("___")

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "mb-8 w-full max-w-lg rounded-2xl border-2 border-border/50 bg-card p-6 shadow-xl",
          mounted && "animate-slide-up",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Complete the sentence</p>
            {content.translation && <p className="mt-2 text-muted-foreground">&quot;{content.translation}&quot;</p>}
          </div>
          <SpeakButton text={sentence.replace("___", correctAnswers[0] || "")} size="lg" variant="outline" />
        </div>
      </div>

      <div
        className={cn(
          "mb-8 flex flex-wrap items-center justify-center gap-2 text-2xl font-bold",
          mounted && "animate-slide-up",
        )}
        style={{ animationDelay: "100ms" }}
      >
        <TappableText text={parts[0]} highlightWords={newWords} highlightQuoted={true} />
        <div className="relative">
          <Input
            ref={inputRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            disabled={disabled}
            placeholder="..."
            className={cn(
              "h-14 w-44 text-center text-xl font-bold rounded-xl border-2 transition-all",
              !disabled && "border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/20",
              disabled && isCorrect && "border-success bg-success/10 text-success",
              disabled && !isCorrect && "border-destructive bg-destructive/10 text-destructive shake",
            )}
            onKeyDown={(e) => e.key === "Enter" && !disabled && handleSubmit()}
          />
        </div>
        <TappableText text={parts[1] || ""} highlightWords={newWords} highlightQuoted={true} />
      </div>

      {hint && !disabled && (
        <button
          onClick={() => setShowHint(!showHint)}
          className="mb-4 flex items-center gap-2 rounded-full bg-xp/10 px-4 py-2 text-sm font-medium text-xp transition-all hover:bg-xp/20"
        >
          <Lightbulb className="h-4 w-4" />
          {showHint ? "Hide hint" : "Need a hint?"}
        </button>
      )}
      {showHint && hint && !disabled && (
        <div className="mb-4 animate-slide-up rounded-xl bg-xp/10 p-4 text-sm text-xp">
          <p>{hint}</p>
        </div>
      )}

      {disabled && !isCorrect && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-success/10 p-4">
          <span className="text-sm text-muted-foreground">Correct answer:</span>
          <span className="font-bold text-success">{correctAnswers[0]}</span>
          <SpeakButton text={correctAnswers[0]} size="sm" />
        </div>
      )}

      {!disabled && (
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className={cn(
            "w-full max-w-lg h-14 text-lg font-semibold rounded-xl shadow-lg transition-all",
            answer.trim() && "shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
          )}
          size="lg"
        >
          {answer.trim() && <Sparkles className="mr-2 h-5 w-5" />}
          Check Answer
        </Button>
      )}
    </div>
  )
}
