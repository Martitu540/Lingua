"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Exercise, ExerciseContent } from "@/types/database"
import { Check, X, Sparkles } from "lucide-react"
import { SpeakButton } from "./speak-button"
import { TappableText } from "./tappable-text"

interface MultipleChoiceExerciseProps {
  exercise: Exercise
  onSubmit: (answer: number, isCorrect: boolean) => void
  disabled: boolean
  selectedAnswer: unknown
}

export function MultipleChoiceExercise({ exercise, onSubmit, disabled, selectedAnswer }: MultipleChoiceExerciseProps) {
  const [selected, setSelected] = useState<number | null>(selectedAnswer as number | null)
  const [mounted, setMounted] = useState(false)
  const content = exercise.content as ExerciseContent
  const options = content.options || []
  const correctIndex = content.correct_index ?? 0

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSelect = (index: number) => {
    if (disabled) return
    setSelected(index)
  }

  const handleSubmit = () => {
    if (selected === null) return
    onSubmit(selected, selected === correctIndex)
  }

  return (
    <div className="flex flex-col items-center">
      <div
        className={cn(
          "mb-8 w-full max-w-lg rounded-2xl border-2 border-border/50 bg-card p-6 shadow-xl transition-all",
          mounted && "animate-slide-up",
        )}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-primary">Select the correct answer</p>
            <h2 className="mt-2 text-2xl font-bold">
              <TappableText
                text={content.question || ""}
                highlightWords={content.new_words || []}
                highlightQuoted={false}
              />
            </h2>
            {content.translation && <p className="mt-2 text-sm text-muted-foreground">{content.translation}</p>}
          </div>
          {content.question && <SpeakButton text={content.question} size="lg" variant="outline" />}
        </div>
      </div>

      <div className="grid w-full max-w-lg gap-3">
        {options.map((option, index) => {
          const isSelected = selected === index
          const isCorrect = index === correctIndex
          const showResult = disabled && isSelected
          const showCorrectHighlight = disabled && isCorrect && !isSelected

          return (
            <button
              key={index}
              onClick={() => handleSelect(index)}
              disabled={disabled}
              style={{ animationDelay: `${index * 100}ms` }}
              className={cn(
                "group relative flex items-center justify-between rounded-xl border-2 p-4 text-left font-medium transition-all",
                mounted && "animate-slide-up",
                !disabled && "hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:shadow-primary/10",
                isSelected && !disabled && "border-primary bg-primary/10 shadow-lg shadow-primary/20",
                showResult && isCorrect && "border-success bg-success/10 shadow-lg shadow-success/20",
                showResult && !isCorrect && "border-destructive bg-destructive/10 shake",
                showCorrectHighlight && "border-success/50 bg-success/5",
              )}
            >
              {/* Option letter badge */}
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-lg text-sm font-bold transition-colors",
                    isSelected && !disabled && "bg-primary text-primary-foreground",
                    !isSelected && !disabled && "bg-muted text-muted-foreground group-hover:bg-primary/20",
                    showResult && isCorrect && "bg-success text-white",
                    showResult && !isCorrect && "bg-destructive text-white",
                    showCorrectHighlight && "bg-success/20 text-success",
                  )}
                >
                  {String.fromCharCode(65 + index)}
                </span>
                <span className="text-lg">{option}</span>
              </div>

              {/* Result icon */}
              {showResult && (
                <span
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full",
                    isCorrect ? "bg-success text-white" : "bg-destructive text-white",
                  )}
                >
                  {isCorrect ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
                </span>
              )}
              {showCorrectHighlight && (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-success/20">
                  <Check className="h-5 w-5 text-success" />
                </span>
              )}

              {!disabled && !showResult && (
                <SpeakButton text={option} size="sm" className="opacity-0 group-hover:opacity-100" />
              )}
            </button>
          )
        })}
      </div>

      {!disabled && (
        <Button
          onClick={handleSubmit}
          disabled={selected === null}
          className={cn(
            "mt-8 w-full max-w-lg h-14 text-lg font-semibold rounded-xl shadow-lg transition-all",
            selected !== null && "shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
          )}
          size="lg"
        >
          {selected !== null && <Sparkles className="mr-2 h-5 w-5" />}
          Check Answer
        </Button>
      )}
    </div>
  )
}
