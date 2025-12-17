"use client"

import { useState, useEffect, useRef } from "react"
import { cn } from "@/lib/utils"
import { Sparkles, Check, X } from "lucide-react"

export function FillBlankExerciseV2({ exercise, onSubmit, disabled }) {
  const { sentence, correct_answers, hint } = exercise.content || {}

  // Ensure sentence is a valid string
  const safeSentence = typeof sentence === "string" ? sentence : ""
  const safeHint = typeof hint === "string" ? hint : null
  const safeCorrectAnswers = Array.isArray(correct_answers) ? correct_answers : []
  
  // Split at the blank
  const parts = safeSentence.split("____")
  const before = parts[0] || ""
  const after = parts[1] || ""

  const [value, setValue] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [showHint, setShowHint] = useState(false)
  const [startTime] = useState(Date.now())

  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setValue("")
    setSubmitted(false)
    setIsCorrect(false)
    setShowHint(false)
    setTimeout(() => inputRef.current?.focus(), 100)
  }, [exercise.id])

  // Keyboard navigation
  useEffect(() => {
    if (submitted || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && value.trim() && !submitted) {
        e.preventDefault();
        handleSubmit();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [value, submitted, disabled]);

  const normalize = (str: string) =>
    str
      .replace(/[.,!?¡¿]/g, "")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .trim()
      .toLowerCase()

  const handleSubmit = () => {
    if (!value.trim() || safeCorrectAnswers.length === 0) return
    
    const valid = safeCorrectAnswers.some((a: string) => normalize(a) === normalize(value))

    setIsCorrect(valid)
    setSubmitted(true)
    onSubmit(value, valid)
  }

  const handleKey = (e: any) => {
    if (e.key === "Enter") handleSubmit()
  }

  // Get correct answer for display
  const correctAnswer = safeCorrectAnswers.length > 0 ? safeCorrectAnswers[0] : ""
  const correctSentence = correctAnswer ? `${before}${correctAnswer}${after}` : safeSentence

  return (
    <div className="text-center max-w-xl mx-auto pt-20">
      {/* Hint button */}
      {safeHint && !submitted && (
        <div className="mb-4 flex justify-center">
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-2 rounded-full bg-xp/10 px-4 py-2 text-sm font-medium text-xp transition-all hover:bg-xp/20 hover:scale-105"
          >
            <Sparkles className="h-4 w-4" />
            {showHint ? "Hide hint" : "Need a hint?"}
          </button>
        </div>
      )}

      {/* Hint display */}
      {showHint && safeHint && !submitted && (
        <div className="mb-6 animate-slide-up rounded-xl bg-xp/10 p-4 text-sm text-xp border border-xp/20">
          <p className="font-semibold">💡 Hint:</p>
          <p className="mt-1">{safeHint}</p>
        </div>
      )}

      {/* Show user's answer prominently when submitted */}
      {submitted && value && (
        <div className={cn(
          "mb-6 p-6 rounded-2xl border-2 shadow-lg",
          isCorrect 
            ? "border-success/40 bg-success/10 shadow-success/10 shadow-lg animate-success-pop" 
            : "border-destructive/40 bg-destructive/10 shadow-destructive/10 shadow-lg animate-error-shake"
        )}>
          <p className="text-sm font-semibold mb-2 uppercase tracking-wide flex items-center gap-2">
            {isCorrect ? (
              <>
                <Check className="h-5 w-5 text-success drop-shadow-sm animate-scale-in" />
                <span className="text-success">Your Answer (Correct!)</span>
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-destructive drop-shadow-sm animate-scale-in" />
                <span className="text-destructive">Your Answer</span>
              </>
            )}
          </p>
          <p className={cn(
            "text-2xl font-bold leading-relaxed",
            isCorrect ? "text-success" : "text-destructive",
          )}>
            {before}<span className="underline decoration-4">{value}</span>{after}
          </p>
        </div>
      )}

      {/* Show correct sentence when submitted and wrong */}
      {submitted && !isCorrect && (
        <div className="mb-6 p-4 rounded-2xl bg-success/10 border-2 border-success/30 shadow-lg animate-scale-in">
          <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2 font-semibold">
            <Check className="h-4 w-4 text-success" />
            Correct answer:
          </p>
          <p className="text-2xl font-bold text-success leading-relaxed">
            {correctSentence}
          </p>
        </div>
      )}

      {/* Sentence - becomes a completed card after submit */}
      <div
        className={cn(
          "relative mb-6 rounded-3xl px-4 py-4",
          !submitted && "bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/20 transition-all duration-500",
          submitted && "border-2 shadow-lg pointer-events-none",
          submitted && isCorrect && "border-success/40 bg-success/10",
          submitted && !isCorrect && "border-destructive/40 bg-destructive/10",
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

        <h1 className="text-3xl font-bold leading-relaxed relative z-10">
          {before}
          <span
            className={cn(
              "inline-block mx-2 min-w-[100px] border-b-2 font-bold text-lg",
              !submitted && "transition-all duration-300 text-foreground border-primary/40",
              submitted && isCorrect && "border-success text-success bg-success/10 px-2 py-1 rounded-xl",
              submitted && !isCorrect && "border-destructive text-destructive bg-destructive/10 px-2 py-1 rounded-xl",
            )}
          >
            {/* Use the underline as the blank (Duolingo-like), avoid showing bright underscore text */}
            {value ? value : "\u00A0"}
          </span>
          {after}
        </h1>
      </div>

      {/* Typing input - user's answer stays visible */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          disabled={submitted}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Type here"
          readOnly={submitted}
          className={cn(
            "w-full p-5 text-lg border-2 rounded-2xl shadow-lg text-center font-medium text-base relative overflow-hidden",
            !submitted &&
              !disabled &&
              "transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:border-primary/60 focus:scale-[1.02] hover:bg-gradient-to-r hover:from-primary/15 hover:to-accent/10 hover:scale-[1.02] hover:shadow-xl hover:border-primary/50 cursor-pointer active:scale-[0.98] bg-card/50 border-border/50",
            submitted && "cursor-default pointer-events-none",
            submitted && isCorrect && "border-success bg-success/10 text-success shadow-lg animate-success-pop",
            submitted && !isCorrect && "border-destructive bg-destructive/10 text-destructive shadow-lg animate-error-shake"
          )}
        />
      </div>

      {/* Continue button */}
      {!submitted && (
        <button
          onClick={handleSubmit}
          disabled={!value.trim()}
          className="w-full mt-6 py-3 bg-primary text-white rounded-xl text-lg font-semibold disabled:opacity-50 hover:scale-105 transition-all"
        >
          Continue
        </button>
      )}
    </div>
  )
}
