"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import type { Exercise, ExerciseContent } from "@/types/database"
import { cn } from "@/lib/utils"
import { X, Sparkles, MoveHorizontal } from "lucide-react"
import { SpeakButton } from "./speak-button"
import { TappableText } from "./tappable-text"

interface DragDropExerciseProps {
  exercise: Exercise
  onSubmit: (answer: number[], isCorrect: boolean) => void
  disabled: boolean
  selectedAnswer: unknown
}

export function DragDropExercise({ exercise, onSubmit, disabled, selectedAnswer }: DragDropExerciseProps) {
  const content = exercise.content as ExerciseContent
  const items = content.items || []
  const correctOrder = content.correct_order || []
  const translation = content.translation
  const [mounted, setMounted] = useState(false)

  // Track selected items in order
  const [selectedItems, setSelectedItems] = useState<number[]>((selectedAnswer as number[]) || [])

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSelectItem = (index: number) => {
    if (disabled) return
    setSelectedItems((prev) => [...prev, index])
  }

  const handleRemoveItem = (position: number) => {
    if (disabled) return
    setSelectedItems((prev) => prev.filter((_, i) => i !== position))
  }

  const handleSubmit = () => {
    if (selectedItems.length !== items.length) return
    const isCorrect = JSON.stringify(selectedItems) === JSON.stringify(correctOrder)
    onSubmit(selectedItems, isCorrect)
  }

  const isCorrect = JSON.stringify(selectedItems) === JSON.stringify(correctOrder)
  const builtSentence = selectedItems.map((i) => items[i]).join(" ")

  return (
    <div className="flex flex-col items-center">
      <div className={cn("mb-6 flex items-center gap-2 text-primary", mounted && "animate-slide-up")}>
        <MoveHorizontal className="h-5 w-5" />
        <p className="text-sm font-medium">Arrange the words in the correct order</p>
      </div>

      {translation && (
        <div
          className={cn("mb-6 w-full max-w-lg rounded-xl bg-muted/50 p-4 text-center", mounted && "animate-slide-up")}
          style={{ animationDelay: "100ms" }}
        >
          <p className="text-muted-foreground">
            &quot;
            <TappableText text={translation} language="en" />
            &quot;
          </p>
        </div>
      )}

      <div
        className={cn(
          "mb-8 flex min-h-[80px] w-full max-w-lg flex-wrap items-center justify-center gap-2 rounded-2xl border-2 border-dashed p-4 transition-all",
          !disabled && selectedItems.length === 0 && "border-primary/30 bg-primary/5",
          !disabled && selectedItems.length > 0 && "border-primary bg-primary/10",
          disabled && isCorrect && "border-success bg-success/10",
          disabled && !isCorrect && "border-destructive bg-destructive/10 shake",
          mounted && "animate-slide-up",
        )}
        style={{ animationDelay: "150ms" }}
      >
        {selectedItems.length === 0 ? (
          <span className="text-muted-foreground">Tap words below to build the sentence</span>
        ) : (
          <>
            {selectedItems.map((itemIndex, position) => (
              <button
                key={position}
                onClick={() => handleRemoveItem(position)}
                disabled={disabled}
                className={cn(
                  "group flex items-center gap-1.5 rounded-xl px-4 py-2.5 font-medium text-white shadow-lg transition-all",
                  !disabled && "bg-gradient-to-br from-primary to-primary/80 hover:scale-105 hover:shadow-xl",
                  disabled && isCorrect && "bg-gradient-to-br from-success to-success/80",
                  disabled && !isCorrect && "bg-gradient-to-br from-destructive to-destructive/80",
                )}
              >
                {items[itemIndex]}
                {!disabled && <X className="h-4 w-4 opacity-0 transition-opacity group-hover:opacity-100" />}
              </button>
            ))}
            {/* Speech button for built sentence */}
            {selectedItems.length > 0 && <SpeakButton text={builtSentence} size="sm" className="ml-2" />}
          </>
        )}
      </div>

      <div
        className={cn("flex flex-wrap justify-center gap-2", mounted && "animate-slide-up")}
        style={{ animationDelay: "200ms" }}
      >
        {items.map((item, index) => {
          const isUsed = selectedItems.includes(index)
          return (
            <button
              key={index}
              onClick={() => handleSelectItem(index)}
              disabled={disabled || isUsed}
              style={{ animationDelay: `${250 + index * 50}ms` }}
              className={cn(
                "rounded-xl border-2 px-4 py-2.5 font-medium transition-all",
                mounted && "animate-slide-up",
                isUsed
                  ? "border-transparent bg-muted/50 text-muted-foreground/50"
                  : "border-border bg-card shadow-md hover:border-primary hover:bg-primary/5 hover:shadow-lg hover:-translate-y-1",
                disabled && "cursor-default",
              )}
            >
              <TappableText text={item} language="es" />
            </button>
          )
        })}
      </div>

      {/* Correct answer if wrong */}
      {disabled && !isCorrect && (
        <div className="mt-6 w-full max-w-lg rounded-xl bg-success/10 p-4">
          <p className="text-sm text-muted-foreground">Correct order:</p>
          <p className="mt-1 font-bold text-success">{correctOrder.map((i) => items[i]).join(" ")}</p>
        </div>
      )}

      {!disabled && (
        <Button
          onClick={handleSubmit}
          disabled={selectedItems.length !== items.length}
          className={cn(
            "mt-8 w-full max-w-lg h-14 text-lg font-semibold rounded-xl shadow-lg transition-all",
            selectedItems.length === items.length && "shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
          )}
          size="lg"
        >
          {selectedItems.length === items.length && <Sparkles className="mr-2 h-5 w-5" />}
          Check Answer
        </Button>
      )}
    </div>
  )
}
