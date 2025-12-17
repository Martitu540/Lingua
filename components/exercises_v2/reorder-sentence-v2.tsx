"use client"

import { useCallback, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { Check, X, Sparkles } from "lucide-react"

// Normalize for matching (ignore accents, punctuation, casing)
function normalize(str: string) {
  return str
    .replace(/[.,!?‚õ‚ö]/g, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
}

interface ReorderSentenceExerciseV2Props {
  exercise: any
  onSubmit: (answer: string, isCorrect: boolean) => void
  disabled?: boolean
}

export function ReorderSentenceExerciseV2({ exercise, onSubmit, disabled }: ReorderSentenceExerciseV2Props) {
  const { words, correct, question, hint } = exercise.content || {}

  // Ensure all values are valid
  const safeWords = Array.isArray(words) ? words : []
  const safeCorrect = Array.isArray(correct) ? correct : []
  const safeQuestion = typeof question === "string" ? question : ""
  const safeHint = typeof hint === "string" ? hint : null

  const [bank, setBank] = useState<string[]>([])
  const [answer, setAnswer] = useState<string[]>([])
  const [submitted, setSubmitted] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)
  const [lastAdded, setLastAdded] = useState<string | null>(null)
  const [lastReturned, setLastReturned] = useState<string | null>(null)
  const [showHint, setShowHint] = useState(false)

  // Reset between exercises
  useEffect(() => {
    setBank([...safeWords].sort(() => Math.random() - 0.5)) // shuffle
    setAnswer([])
    setSubmitted(false)
    setIsCorrect(false)
    setLastAdded(null)
    setLastReturned(null)
    setShowHint(false)
  }, [exercise.id, safeWords])

  const handleSelect = (word: string) => {
    if (submitted || disabled) return
    setAnswer((prev) => {
      const next = [...prev, word]
      setLastAdded(`${word}-${next.length}-${Date.now()}`)
      return next
    })
    setBank((prev) => prev.filter((w) => w !== word))
  }

  const handleRemove = (word: string, index: number) => {
    if (submitted || disabled) return
    setAnswer((prev) => prev.filter((_, i) => i !== index))
    setBank((prev) => {
      const next = [...prev, word]
      setLastReturned(`${word}-${next.length}-${Date.now()}`)
      return next
    })
  }

  const submitSentence = () => {
    if (submitted) return

    const user = answer.map(normalize)
    const key = safeCorrect.map(normalize)

    const match = user.length === key.length && user.every((w, i) => w === key[i])

    setIsCorrect(match)
    setSubmitted(true)
    onSubmit(answer.join(" "), match)
  }

  const handleKey = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !submitted) submitSentence()
    },
    [submitted, answer],
  )

  useEffect(() => {
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [handleKey])

  return (
    <div className="pt-24 px-4 max-w-xl mx-auto animate-[fadeIn_0.35s_ease]">
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
        <h1 className="text-2xl font-bold text-center">{safeQuestion}</h1>
      </div>

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

      {/* Show user's sentence prominently when submitted */}
      {submitted && answer.length > 0 && (
        <div className={cn(
          "mb-6 p-6 rounded-2xl border-2 shadow-lg animate-bounce-in-enhanced",
          isCorrect 
            ? "border-success/40 bg-success/10 shadow-success/10 shadow-lg" 
            : "border-destructive/40 bg-destructive/10 shadow-destructive/10 shadow-lg animate-error-shake"
        )}>
          <p className="text-sm font-semibold mb-3 uppercase tracking-wide flex items-center gap-2">
            {isCorrect ? (
              <>
                <Check className="h-5 w-5 text-success animate-success-pop" />
                Your Sentence (Correct!)
              </>
            ) : (
              <>
                <X className="h-5 w-5 text-destructive" />
                Your Sentence
              </>
            )}
          </p>
          <p className={cn(
            "text-2xl font-bold leading-relaxed",
            isCorrect ? "text-success" : "text-destructive"
          )}>
            {answer.join(" ")}
          </p>
        </div>
      )}

      {/* Answer area - stays visible with user's answer after submission */}
      <div
        className={cn(
          "min-h-[90px] p-4 rounded-xl border-2 shadow-md bg-card transition-all",
          submitted && isCorrect && "border-success/40 bg-success/5",
          submitted && !isCorrect && "border-destructive/40 bg-destructive/5",
          submitted && "pointer-events-none"
        )}
      >
        {answer.length === 0 ? (
          <p className="text-muted-foreground text-center">Tap words to build the sentence</p>
        ) : (
          <div className="flex flex-wrap gap-3 justify-center">
            {answer.map((w, idx) => {
              const key = `${w}-${idx}`
              return (
                <button
                  key={key}
                  disabled={submitted}
                  onClick={() => handleRemove(w, idx)}
                  className={cn(
                    "px-4 py-2 border-2 rounded-xl shadow-sm font-semibold text-base",
                    !submitted && "bg-primary/10 border-primary transition-all hover:bg-primary/20 active:scale-[0.96] animate-[scaleIn_0.15s_ease-out]",
                    submitted && isCorrect && "bg-success/10 border-success/30 text-success cursor-default pointer-events-none",
                    submitted && !isCorrect && "bg-destructive/10 border-destructive/30 text-destructive cursor-default pointer-events-none",
                    !submitted && lastAdded?.startsWith(`${w}-${answer.length}`) && "animate-word-flight-in"
                  )}
                >
                  {w}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Word Bank - stays visible after submission */}
      <div className="mt-6 flex flex-wrap gap-3 justify-center">
        {bank.map((w, idx) => {
          const key = `${w}-${idx}`
          return (
            <button
              key={key}
              onClick={() => handleSelect(w)}
              disabled={submitted || disabled}
              className={cn(
                "px-4 py-2 rounded-xl border shadow-sm bg-card",
                !submitted && "transition-all hover:bg-accent/10 active:scale-[0.95] cursor-pointer animate-[fadeIn_0.2s_ease-out]",
                submitted && "cursor-default pointer-events-none opacity-40",
                !submitted && lastReturned?.startsWith(`${w}-${bank.length}`) && "animate-word-return"
              )}
            >
              {w}
            </button>
          )
        })}
      </div>

      {/* Show correct sentence only when wrong */}
      {submitted && !isCorrect && (
        <div className="mb-6 p-4 rounded-2xl bg-success/10 border-2 border-success/30">
          <p className="text-sm text-muted-foreground mb-2">Correct sentence:</p>
          <p className="text-xl font-bold text-success">{safeCorrect.join(" ")}</p>
        </div>
      )}

      {/* Post-submit feedback uses shared bottom bar in lessons; cards above cover review mode too. */}

      {/* Continue Button */}
      {!submitted && (
        <button
          onClick={submitSentence}
          disabled={answer.length === 0}
          className={cn(
            "mt-6 w-full py-3 rounded-xl bg-primary text-white font-semibold text-lg shadow-md",
            !submitted && "transition-transform duration-200 hover:translate-y-[-1px] hover:shadow-lg",
            answer.length === 0 && "opacity-40 cursor-default"
          )}
        >
          Continue
        </button>
      )}

      <style jsx global>{`
        @keyframes word-flight-in {
          0% {
            transform: translateY(16px) scale(0.9);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-word-flight-in {
          animation: word-flight-in 0.28s ease-out;
        }

        @keyframes word-return {
          0% {
            transform: translateY(-12px) scale(0.92);
            opacity: 0;
          }
          100% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }
        .animate-word-return {
          animation: word-return 0.22s ease-out;
        }
      `}</style>
    </div>
  )
}
