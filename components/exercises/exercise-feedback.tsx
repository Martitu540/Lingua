"use client"

import { useEffect } from "react"
import { Button } from "@/components/ui/button"
import { ArrowRight, Check, Heart, Lightbulb, RotateCcw, Sparkles, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { SpeakButton } from "./speak-button"
import { TappableText } from "./tappable-text"

interface ExerciseFeedbackProps {
  type: "correct" | "incorrect"
  explanation: string
  onContinue: () => void
  heartsLeft: number
  correctAnswer?: string
  willRepeat?: boolean
  autoAdvanceMs?: number
  hideButton?: boolean
  userAnswer?: unknown
  exerciseType?: string
}

export function ExerciseFeedback({
  type,
  explanation,
  onContinue,
  heartsLeft,
  correctAnswer,
  willRepeat,
  autoAdvanceMs,
  hideButton = false,
  userAnswer,
  exerciseType,
}: ExerciseFeedbackProps) {
  const isCorrect = type === "correct"

  useEffect(() => {
    if (!autoAdvanceMs) return
    const t = setTimeout(onContinue, autoAdvanceMs)
    return () => clearTimeout(t)
  }, [autoAdvanceMs, onContinue])

  const label =
    exerciseType === "matching"
      ? "Your matches"
      : exerciseType === "reorder" || exerciseType === "reorder_sentence"
        ? "Your sentence"
        : exerciseType === "multiple_choice" || exerciseType === "dialogue"
          ? "Your choice"
          : exerciseType === "translation"
            ? "Your translation"
            : exerciseType === "listening"
              ? "Your answer"
              : "Your answer"

  const renderAnswer = (answer: unknown) => {
    if (answer === null || answer === undefined) {
      return <span className="text-sm text-muted-foreground italic">No answer recorded</span>
    }

    if (typeof answer === "string") {
      const trimmed = answer.trim()
      if (!trimmed) {
        return <span className="text-sm text-muted-foreground italic">Empty answer</span>
      }

      return (
        <div className="flex items-center gap-2 flex-wrap">
          <div className="rounded-xl border bg-background/70 px-3 py-2 shadow-sm max-w-full">
            <span className="text-sm font-semibold whitespace-pre-wrap break-words">
              <TappableText text={trimmed} language="auto" />
            </span>
          </div>
          <SpeakButton text={trimmed} size="sm" />
        </div>
      )
    }

    if (typeof answer === "number" || typeof answer === "boolean") {
      return (
        <span className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1.5 text-sm font-semibold">
          {String(answer)}
        </span>
      )
    }

    if (Array.isArray(answer)) {
      const looksLikePairs =
        answer.length > 0 &&
        answer.every(
          (v) =>
            Array.isArray(v) &&
            v.length === 2 &&
            typeof v[0] === "string" &&
            typeof v[1] === "string",
        )

      if (looksLikePairs) {
        const pairs = answer as [string, string][]
        return (
          <div className="grid gap-2">
            {pairs.map(([left, right], idx) => (
              <div
                key={`${left}-${right}-${idx}`}
                className="flex items-center gap-2 rounded-xl border bg-background/60 px-3 py-2 shadow-sm"
              >
                <span className="flex-1 text-sm font-semibold break-words">
                  <TappableText text={left} language="auto" />
                </span>
                <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0" />
                <span className="flex-1 text-sm font-semibold break-words text-right">
                  <TappableText text={right} language="auto" />
                </span>
              </div>
            ))}
          </div>
        )
      }

      const items = answer
        .map((v) => (typeof v === "string" ? v.trim() : String(v)))
        .filter(Boolean)
        .slice(0, 12)

      return (
        <div className="flex flex-wrap gap-2">
          {items.map((v, idx) => (
            <span
              key={`${v}-${idx}`}
              className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1.5 text-sm font-semibold"
            >
              <TappableText text={v} language="auto" />
            </span>
          ))}
          {Array.isArray(answer) && answer.length > 12 && (
            <span className="text-xs text-muted-foreground self-center">+{answer.length - 12} more</span>
          )}
        </div>
      )
    }

    if (typeof answer === "object") {
      const obj = answer as Record<string, unknown>

      if ("answer" in obj) {
        return renderAnswer(obj.answer)
      }

      if ("pairs" in obj) {
        const misses = typeof obj.wrongAttempts === "number" ? obj.wrongAttempts : undefined
        return (
          <div className="grid gap-2">
            {renderAnswer(obj.pairs)}
            {misses !== undefined && (
              <p className="text-xs text-muted-foreground">
                Misses: <span className={cn("font-semibold", misses ? "text-destructive" : "text-muted-foreground")}>{misses}</span>
              </p>
            )}
          </div>
        )
      }

      try {
        const json = JSON.stringify(answer, null, 2)
        return (
          <pre className="max-h-40 overflow-auto rounded-xl border bg-background/60 p-3 text-xs text-foreground/90">
            {json}
          </pre>
        )
      } catch {
        return (
          <span className="text-sm text-muted-foreground">
            {Object.prototype.toString.call(answer)}
          </span>
        )
      }
    }

    return <span className="text-sm text-muted-foreground">{String(answer)}</span>
  }

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 border-t-2 p-6 backdrop-blur-xl animate-slide-up z-50",
        isCorrect
          ? "border-success bg-gradient-to-t from-success/20 to-success/5"
          : "border-destructive bg-gradient-to-t from-destructive/20 to-destructive/5",
      )}
    >
      <div className="mx-auto max-w-2xl">
        <div className="flex items-start gap-4">
          <div
            className={cn(
              "flex h-16 w-16 items-center justify-center rounded-2xl shadow-xl animate-bounce-in",
              isCorrect
                ? "bg-gradient-to-br from-success to-success/80 shadow-success/30"
                : "bg-gradient-to-br from-destructive to-destructive/80 shadow-destructive/30",
            )}
          >
            {isCorrect ? <Check className="h-8 w-8 text-white" /> : <X className="h-8 w-8 text-white" />}
          </div>

          {/* Content */}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className={cn("text-xl font-bold", isCorrect ? "text-success" : "text-destructive")}>
                {isCorrect ? "Excellent!" : "Not quite right"}
              </h3>
              {isCorrect && <Sparkles className="h-5 w-5 text-xp animate-wiggle" />}
            </div>

            {!isCorrect && correctAnswer && (
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="text-sm text-muted-foreground">Correct:</span>
                <span className="font-semibold text-success">
                  <TappableText text={correctAnswer} language="auto" />
                </span>
                <SpeakButton text={correctAnswer} size="sm" />
              </div>
            )}

            {userAnswer !== undefined && (
              <div className="mt-3 rounded-2xl border bg-background/50 p-4 backdrop-blur">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-xl shadow-sm",
                        isCorrect ? "bg-success/15 text-success" : "bg-primary/15 text-primary",
                      )}
                    >
                      <Sparkles className="h-5 w-5" />
                    </div>
                    <div className="leading-tight">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">Saved to your history</p>
                    </div>
                  </div>
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold",
                      isCorrect
                        ? "border-success/30 bg-success/10 text-success"
                        : "border-destructive/30 bg-destructive/10 text-destructive",
                    )}
                  >
                    {isCorrect ? "✔ logged" : "✖ logged"}
                  </span>
                </div>

                <div className="mt-3">{renderAnswer(userAnswer)}</div>
              </div>
            )}

            {willRepeat && (
              <div className="mt-2 flex items-center gap-2 text-sm text-streak">
                <RotateCcw className="h-4 w-4" />
                <span>This will come back for review</span>
              </div>
            )}

            {explanation && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-background/60 p-3 text-sm backdrop-blur">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-xp" />
                <p className="text-foreground">
                  <TappableText text={explanation} language="auto" />
                </p>
              </div>
            )}

            {!isCorrect && (
              <div className="mt-3 flex items-center gap-2 text-sm">
                <Heart className={cn("h-4 w-4 fill-hearts text-hearts", heartsLeft <= 1 && "animate-wiggle")} />
                <span className="text-muted-foreground">
                  {heartsLeft > 0 ? `${heartsLeft} heart${heartsLeft !== 1 ? "s" : ""} remaining` : "No hearts left!"}
                </span>
              </div>
            )}

            {autoAdvanceMs && (
              <p className="mt-2 text-xs font-medium text-muted-foreground">
                Next question in {(autoAdvanceMs / 1000).toFixed(1)}s
              </p>
            )}
          </div>

          {!hideButton && (
            <Button
              onClick={onContinue}
              className={cn(
                "h-14 rounded-xl px-8 text-lg font-semibold shadow-xl transition-all hover:scale-105",
                isCorrect
                  ? "bg-gradient-to-r from-success to-success/80 shadow-success/30 hover:shadow-success/50"
                  : "bg-gradient-to-r from-primary to-primary/80 shadow-primary/30",
              )}
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
