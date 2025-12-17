"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Exercise } from "@/types/database"
import { Sparkles } from "lucide-react"
import { SpeakButton } from "./speak-button"
import { TappableText } from "./tappable-text"

interface TranslationExerciseProps {
  exercise: Exercise
  onSubmit: (answer: string, isCorrect: boolean) => void
  disabled: boolean
  selectedAnswer: unknown
}

function normalize(str: string): string {
  return str
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .replace(/\s+/g, " ")
}

function similarity(a: string, b: string): number {
  if (!a || !b) return 0
  const len = Math.max(a.length, b.length)
  let same = 0
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    if (a[i] === b[i]) same++
  }
  return same / len
}

export function TranslationExercise({
  exercise,
  onSubmit,
  disabled,
  selectedAnswer,
}: TranslationExerciseProps) {
  const content = exercise.content as any

  const [value, setValue] = useState<string>((selectedAnswer as string) || "")

  const correctAnswers: string[] =
    (Array.isArray(content.correct_answers) && content.correct_answers.length > 0
      ? content.correct_answers
      : content.correct_answer
      ? [content.correct_answer]
      : []
    ).filter(Boolean)

  const handleSubmit = () => {
    if (!value.trim()) return

    const userNorm = normalize(value)
    const isCorrect = correctAnswers.some((ans) => {
      const norm = normalize(ans)
      if (userNorm === norm) return true
      return similarity(userNorm, norm) >= 0.8
    })

    onSubmit(value, isCorrect)
  }

  return (
    
    <div className="flex flex-col items-center">
      <div className="pt-20 px-4"></div>
      
      <div className="mb-8 w-full max-w-lg rounded-2xl border-2 border-border/50 bg-card p-6 shadow-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Translate this sentence</p>
            <h2 className="mt-2 text-2xl font-bold">
              <TappableText text={content.question || ""} highlightQuoted />
            </h2>
            {content.translation && (
              <p className="mt-2 text-sm text-muted-foreground">{content.translation}</p>
            )}
          </div>
          {content.question && (
            <SpeakButton text={content.question} size="lg" variant="outline" />
          )}
        </div>
      </div>

      <div className="w-full max-w-lg space-y-3">
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={disabled}
          placeholder="Type your translation..."
          className="h-12 rounded-xl text-base"
        />
      </div>

      {!disabled && (
        <Button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className={cn("mt-6 h-12 w-full max-w-lg rounded-xl text-lg font-semibold shadow-lg")}
        >
          <Sparkles className="mr-2 h-5 w-5" />
          Check Answer
        </Button>
      )}
    </div>
  )
}
