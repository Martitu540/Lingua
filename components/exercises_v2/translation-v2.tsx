"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Check, X } from "lucide-react"
import { suggestAnswer } from "@/lib/suggestion"


// Normalize: remove punctuation, accents, casing
function normalize(str: string) {
  return str
    .replace(/[.,!?¿¡]/g, "")       // punctuation
    .normalize("NFD")               // split accents
    .replace(/[\u0300-\u036f]/g, "") // remove accents
    .trim()
    .toLowerCase()
}

export function TranslationExerciseV2({ exercise, onSubmit, disabled }) {
  const { question, correct_answers, hint } = exercise.content || {}
  
  // Ensure question is a valid string
  const safeQuestion = typeof question === "string" ? question : ""
  const primaryCorrect =
    Array.isArray(correct_answers) && correct_answers[0] ? String(correct_answers[0]) : ""

  const [text, setText] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)

  // Reset when exercise changes
  useEffect(() => {
    setText("")
    setSubmitted(false)
    setIsCorrect(false)
    setSuggestion(null)
    setTimeout(() => inputRef.current?.focus(), 80)
  }, [exercise.id])

  const handleSubmit = () => {
    if (submitted || disabled) return

    const userClean = normalize(text)
    const correctClean = correct_answers.map((a: string) => normalize(a))

    const correct = correctClean.includes(userClean)

    setIsCorrect(correct)
    setSubmitted(true)

    // Suggest closest correct answer (Levenshtein distance)
    if (!correct) {
      const humanSuggestion = suggestAnswer(userClean, correct_answers)
      setSuggestion(humanSuggestion)
    }

    onSubmit(text, correct)
  }

  const handleEnter = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit()
  }

  return (
    <div className="pt-24 px-4 max-w-xl mx-auto">

      {/* Question */}
      <div
        className={cn(
          "relative mb-6 rounded-3xl px-5 py-4 border shadow-sm",
          !submitted && "bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20",
          submitted && isCorrect && "border-success/40 bg-success/10 shadow-success/10",
          submitted && !isCorrect && "border-destructive/40 bg-destructive/10 shadow-destructive/10",
        )}
      >
        {submitted && (
          <div className="absolute -top-3 right-4">
            <div
              className={cn(
                "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold bg-background/60 backdrop-blur shadow-sm",
                isCorrect ? "border-success/30 text-success" : "border-destructive/30 text-destructive",
              )}
            >
              {isCorrect ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
              Completed
            </div>
          </div>
        )}

        <h1 className="text-2xl font-bold text-center leading-tight">
          {safeQuestion}
        </h1>
        {hint && !submitted && (
          <p className="mt-2 text-sm text-center text-muted-foreground">{hint}</p>
        )}
      </div>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={text}
        disabled={submitted || disabled}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={handleEnter}
        className={cn(
          "w-full p-4 text-lg border rounded-xl bg-card shadow-md transition-all duration-300",
          "focus:outline-none focus:ring-2 focus:ring-primary focus:scale-[1.02]",
          submitted && "pointer-events-none",
          submitted && isCorrect && "border-success bg-success/5 text-success",
          submitted && !isCorrect && "border-destructive bg-destructive/5 text-destructive"
        )}
        placeholder="Type your translation"
      />

      {/* Post-submit recap */}
      {submitted && (
        <div className="mt-5 rounded-2xl border bg-background/50 p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Your translation</p>
          <p className={cn("mt-2 text-xl font-bold break-words", isCorrect ? "text-success" : "text-destructive")}>
            {text.trim() ? text : "—"}
          </p>

          {!isCorrect && primaryCorrect && (
            <p className="mt-3 text-sm text-muted-foreground">
              Correct: <span className="font-semibold text-success">{primaryCorrect}</span>
            </p>
          )}

          {!isCorrect && suggestion && (
            <p className="mt-1 text-sm text-muted-foreground">
              Did you mean: <span className="font-semibold text-primary">{suggestion}</span>?
            </p>
          )}
        </div>
      )}

      {/* Continue button */}
      {!submitted && (
        <button
          disabled={!text.trim()}
          onClick={handleSubmit}
          className={cn(
            "w-full mt-6 py-3 bg-primary text-white text-lg font-semibold rounded-xl shadow-md",
            !text.trim() && "opacity-40 cursor-default"
          )}
        >
          Continue
        </button>
      )}

      {/* Post-submit feedback uses shared bottom bar in lessons; recap above covers review mode too. */}
    </div>
  )
}
