"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Exercise, ExerciseContent } from "@/types/database"
import { Mic, MicOff, Sparkles, MessageCircle } from "lucide-react"
import { SpeakButton } from "./speak-button"
import type { SpeechRecognition, SpeechRecognitionEvent } from "web-speech-api-types"

interface SpeakingExerciseProps {
  exercise: Exercise
  onSubmit: (answer: string, isCorrect: boolean) => void
  disabled: boolean
  selectedAnswer: unknown
}

export function SpeakingExercise({ exercise, onSubmit, disabled, selectedAnswer }: SpeakingExerciseProps) {
  const [isRecording, setIsRecording] = useState(false)
  const [transcript, setTranscript] = useState((selectedAnswer as string) || "")
  const [mounted, setMounted] = useState(false)
  const [isSupported, setIsSupported] = useState(false)
  const content = exercise.content as ExerciseContent
  const correctAnswers = content.correct_answers || []
  const targetPhrase = content.target_phrase || content.question || ""

  useEffect(() => {
    setMounted(true)
    // Check for speech recognition support
    const SpeechRecognition =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognition
          webkitSpeechRecognition?: new () => SpeechRecognition
        }
      ).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
    setIsSupported(!!SpeechRecognition)
  }, [])

  const startRecording = () => {
    const SpeechRecognition =
      (
        window as unknown as {
          SpeechRecognition?: new () => SpeechRecognition
          webkitSpeechRecognition?: new () => SpeechRecognition
        }
      ).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition
    if (!SpeechRecognition) return

    const recognition = new SpeechRecognition()
    recognition.lang = "es-ES"
    recognition.continuous = false
    recognition.interimResults = false

    recognition.onstart = () => setIsRecording(true)
    recognition.onend = () => setIsRecording(false)
    recognition.onerror = () => setIsRecording(false)

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const result = event.results[0][0].transcript
      setTranscript(result)
    }

    recognition.start()
  }

  const handleSubmit = () => {
    if (!transcript.trim()) return
    // Fuzzy matching - check if transcript is similar enough to correct answers
    const normalizedTranscript = transcript.toLowerCase().trim()
    const isCorrect = correctAnswers.some((correct) => {
      const normalizedCorrect = correct.toLowerCase().trim()
      // Simple similarity check
      return (
        normalizedTranscript === normalizedCorrect ||
        normalizedTranscript.includes(normalizedCorrect) ||
        normalizedCorrect.includes(normalizedTranscript)
      )
    })
    onSubmit(transcript, isCorrect)
  }

  const isCorrect = correctAnswers.some((correct) => {
    const normalizedTranscript = transcript.toLowerCase().trim()
    const normalizedCorrect = correct.toLowerCase().trim()
    return (
      normalizedTranscript === normalizedCorrect ||
      normalizedTranscript.includes(normalizedCorrect) ||
      normalizedCorrect.includes(normalizedTranscript)
    )
  })

  return (
    <div className="flex flex-col items-center">
      {/* Header */}
      <div className={cn("mb-6 flex items-center gap-2 text-primary", mounted && "animate-slide-up")}>
        <MessageCircle className="h-5 w-5" />
        <p className="text-sm font-medium">Say this phrase out loud</p>
      </div>

      {/* Target phrase card */}
      <div
        className={cn(
          "mb-8 w-full max-w-lg rounded-2xl border-2 border-border/50 bg-card p-6 shadow-xl",
          mounted && "animate-slide-up",
        )}
        style={{ animationDelay: "100ms" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl font-bold">{targetPhrase}</p>
            {content.translation && <p className="mt-2 text-muted-foreground">{content.translation}</p>}
          </div>
          <SpeakButton text={targetPhrase} size="lg" variant="outline" />
        </div>
      </div>

      {/* Microphone button */}
      <div
        className={cn("mb-8 flex flex-col items-center gap-4", mounted && "animate-slide-up")}
        style={{ animationDelay: "200ms" }}
      >
        {isSupported ? (
          <button
            onClick={startRecording}
            disabled={disabled || isRecording}
            className={cn(
              "group relative flex h-28 w-28 items-center justify-center rounded-full transition-all",
              isRecording
                ? "bg-destructive shadow-2xl shadow-destructive/30"
                : "bg-gradient-to-br from-primary to-primary/70 shadow-2xl shadow-primary/30",
              !disabled && !isRecording && "hover:scale-105 hover:shadow-primary/50",
            )}
          >
            {/* Recording animation */}
            {isRecording && (
              <>
                <span className="absolute inset-0 animate-ping rounded-full bg-destructive/30" />
                <span className="absolute inset-4 animate-pulse rounded-full bg-destructive/50" />
              </>
            )}
            {isRecording ? (
              <MicOff className="relative h-10 w-10 text-white" />
            ) : (
              <Mic className="relative h-10 w-10 text-white" />
            )}
          </button>
        ) : (
          <div className="rounded-xl bg-muted p-4 text-center text-muted-foreground">
            <p>Speech recognition is not supported in your browser.</p>
            <p className="mt-2 text-sm">Try using Chrome or Edge.</p>
          </div>
        )}

        {isRecording && <p className="animate-pulse text-sm text-destructive">Listening...</p>}
      </div>

      {/* Transcript display */}
      {transcript && (
        <div
          className={cn(
            "mb-6 w-full max-w-lg rounded-xl border-2 p-4 text-center",
            !disabled && "border-primary/50 bg-primary/5",
            disabled && isCorrect && "border-success bg-success/10",
            disabled && !isCorrect && "border-destructive bg-destructive/10",
          )}
        >
          <p className="text-sm text-muted-foreground mb-1">You said:</p>
          <p className="text-xl font-semibold">{transcript}</p>
        </div>
      )}

      {/* Correct answer if wrong */}
      {disabled && !isCorrect && (
        <div className="mb-4 w-full max-w-lg rounded-xl bg-success/10 p-4 text-center">
          <p className="text-sm text-muted-foreground">Expected:</p>
          <p className="mt-1 font-bold text-success">{correctAnswers[0]}</p>
        </div>
      )}

      {/* Submit button */}
      {!disabled && isSupported && (
        <Button
          onClick={handleSubmit}
          disabled={!transcript.trim()}
          className={cn(
            "mt-4 w-full max-w-lg h-14 text-lg font-semibold rounded-xl shadow-lg transition-all",
            transcript.trim() && "shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
          )}
          size="lg"
        >
          {transcript.trim() && <Sparkles className="mr-2 h-5 w-5" />}
          Check Pronunciation
        </Button>
      )}
    </div>
  )
}
