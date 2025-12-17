"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Exercise, ExerciseContent } from "@/types/database"
import { Volume2, VolumeX, Sparkles, Headphones, RotateCcw } from "lucide-react"
import { useSpeech } from "@/hooks/use-speech"
import { TappableText } from "./tappable-text"

interface ListeningExerciseProps {
  exercise: Exercise
  onSubmit: (answer: string, isCorrect: boolean) => void
  disabled: boolean
  selectedAnswer: unknown
}

export function ListeningExercise({ exercise, onSubmit, disabled, selectedAnswer }: ListeningExerciseProps) {
  const [answer, setAnswer] = useState((selectedAnswer as string) || "")
  const [mounted, setMounted] = useState(false)
  const [playCount, setPlayCount] = useState(0)
  const content = exercise.content as ExerciseContent
  const correctAnswers = content.correct_answers || []
  const audioText = content.audio_text || content.question || ""
  const { speak, stop, isSpeaking, isSupported } = useSpeech({
    lang: content.language === "en" ? "en-US" : "es-ES",
    rate: 0.8,
  })

  useEffect(() => {
    setMounted(true)
    // Auto-play on mount
    if (isSupported && audioText) {
      const timer = setTimeout(() => {
        speak(audioText)
        setPlayCount(1)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [audioText, isSupported])

  const handlePlay = () => {
    if (isSpeaking) {
      stop()
    } else {
      speak(audioText)
      setPlayCount((prev) => prev + 1)
    }
  }

  const handleSlowPlay = () => {
    if (isSupported && typeof window !== "undefined") {
      window.speechSynthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(audioText)
      utterance.lang = "es-ES"
      utterance.rate = 0.5
      window.speechSynthesis.speak(utterance)
      setPlayCount((prev) => prev + 1)
    }
  }

  const handleSubmit = () => {
    if (!answer.trim()) return
    const isCorrect = correctAnswers.some((correct) => correct.toLowerCase().trim() === answer.toLowerCase().trim())
    onSubmit(answer, isCorrect)
  }

  const isCorrect = correctAnswers.some((correct) => correct.toLowerCase().trim() === answer.toLowerCase().trim())

  return (
    <div className="flex flex-col items-center">
      <div className={cn("mb-6 flex items-center gap-2 text-primary", mounted && "animate-slide-up")}>
        <Headphones className="h-5 w-5" />
        <p className="text-sm font-medium">Listen and type what you hear</p>
      </div>

      <div
        className={cn("mb-8 flex flex-col items-center gap-4", mounted && "animate-slide-up")}
        style={{ animationDelay: "100ms" }}
      >
        <button
          onClick={handlePlay}
          disabled={disabled}
          className={cn(
            "group relative flex h-32 w-32 items-center justify-center rounded-full transition-all",
            "bg-gradient-to-br from-primary to-primary/70 shadow-2xl shadow-primary/30",
            isSpeaking && "animate-pulse",
            !disabled && "hover:scale-105 hover:shadow-primary/50",
          )}
        >
          {/* Ripple effect */}
          {isSpeaking && (
            <>
              <span className="absolute inset-0 animate-ping rounded-full bg-primary/30" />
              <span
                className="absolute inset-2 animate-ping rounded-full bg-primary/20"
                style={{ animationDelay: "150ms" }}
              />
            </>
          )}
          {isSpeaking ? (
            <VolumeX className="relative h-12 w-12 text-white" />
          ) : (
            <Volume2 className="relative h-12 w-12 text-white" />
          )}
        </button>

        {/* Slow playback button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleSlowPlay}
          disabled={disabled}
          className="gap-2 bg-transparent"
        >
          <RotateCcw className="h-4 w-4" />
          Play Slowly
        </Button>

        {/* Play count */}
        <p className="text-xs text-muted-foreground">
          Played {playCount} time{playCount !== 1 ? "s" : ""}
        </p>
      </div>

      <div className={cn("w-full max-w-lg", mounted && "animate-slide-up")} style={{ animationDelay: "200ms" }}>
        <Input
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          disabled={disabled}
          placeholder="Type what you heard..."
          className={cn(
            "h-14 text-lg text-center rounded-xl border-2 transition-all",
            !disabled && "border-primary/50 focus:border-primary focus:ring-4 focus:ring-primary/20",
            disabled && isCorrect && "border-success bg-success/10 text-success",
            disabled && !isCorrect && "border-destructive bg-destructive/10 text-destructive shake",
          )}
          onKeyDown={(e) => e.key === "Enter" && !disabled && handleSubmit()}
        />
      </div>

      {disabled && !isCorrect && (
        <div className="mt-4 w-full max-w-lg rounded-xl bg-success/10 p-4 text-center">
          <p className="text-sm text-muted-foreground">Correct answer:</p>
          <p className="mt-1 font-bold text-success">
            <TappableText text={correctAnswers[0]} language="es" />
          </p>
        </div>
      )}

      {/* Submit button */}
      {!disabled && (
        <Button
          onClick={handleSubmit}
          disabled={!answer.trim()}
          className={cn(
            "mt-8 w-full max-w-lg h-14 text-lg font-semibold rounded-xl shadow-lg transition-all",
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
