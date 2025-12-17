"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { X, Heart, Zap, RotateCcw, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { LessonCompleteModal } from "@/components/exercises/lesson-complete-modal"
import { AchievementNotification } from "@/components/achievements/achievement-notification"
import { ExerciseFeedback } from "@/components/exercises/exercise-feedback"
import type { Achievement, Exercise } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { renderReviewExercise } from "./render-review-exercise"

interface ReviewSessionContainerProps {
  exercises: Exercise[]
  userId: string
  reviewTitle: string
  initialHearts: number
}

export function ReviewSessionContainer({
  exercises,
  userId,
  reviewTitle,
  initialHearts,
}: ReviewSessionContainerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hearts, setHearts] = useState(initialHearts)
  const [xpEarned, setXpEarned] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect">("correct")
  const [currentExplanation, setCurrentExplanation] = useState("")
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<unknown>(undefined)
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const submissionLockedRef = useRef(false)

  const currentExercise = exercises[currentIndex]
  const totalCount = exercises.length
  const progress = ((currentIndex + (hasSubmitted ? 1 : 0)) / totalCount) * 100

  const getCorrectAnswerText = (exercise: Exercise) => {
    const content = (exercise?.content ?? {}) as any
    const type = (exercise as any)?.type as string | undefined

    if (Array.isArray(content.correct_answers) && content.correct_answers[0]) {
      return String(content.correct_answers[0])
    }

    if (type === "multiple_choice") {
      const options = Array.isArray(content.options) ? content.options : []
      const idx = typeof content.correct_index === "number" ? content.correct_index : -1
      if (idx >= 0 && idx < options.length) return String(options[idx])
    }

    if (type === "reorder" || type === "reorder_sentence") {
      const correct = Array.isArray(content.correct) ? content.correct : []
      if (correct.length > 0) return correct.join(" ")
    }

    if (type === "dialogue") {
      const turns = Array.isArray(content.turns) ? content.turns : []
      const choiceTurn = turns.find((t: any) => t && Array.isArray(t.options) && t.options.length > 0)
      const options = Array.isArray(choiceTurn?.options) ? choiceTurn.options : []
      const idx = typeof choiceTurn?.correct_index === "number" ? choiceTurn.correct_index : -1
      if (idx >= 0 && idx < options.length) return String(options[idx])
    }

    return undefined
  }

  // Debug: Log exercise structure on mount and when exercise changes
  useEffect(() => {
    if (currentExercise) {
      console.log(`[Review Container] Current exercise:`, {
        id: currentExercise.id,
        type: currentExercise.type,
        hasContent: !!currentExercise.content,
        contentType: typeof currentExercise.content,
        contentKeys: currentExercise.content ? Object.keys(currentExercise.content) : [],
        hasOptions: currentExercise.type === "multiple_choice" ? !!currentExercise.content?.options : "N/A",
        optionsLength: currentExercise.type === "multiple_choice" ? currentExercise.content?.options?.length : "N/A",
        options: currentExercise.type === "multiple_choice" ? currentExercise.content?.options : "N/A",
      })
    }
  }, [currentExercise])

  const handleSubmit = async (answer: unknown, isCorrect: boolean) => {
    if (submissionLockedRef.current || hasSubmitted || !currentExercise) return

    submissionLockedRef.current = true
    setHasSubmitted(true)
    setLastSubmittedAnswer(answer)
    setFeedbackType(isCorrect ? "correct" : "incorrect")
    setCurrentExplanation((currentExercise as any)?.explanation || "")
    setShowFeedback(true)

    try {
      const supabase = createClient()

      // Save exercise attempt
      await supabase.from("user_exercise_history").insert({
        user_id: userId,
        exercise_id: currentExercise.id,
        is_correct: isCorrect,
        user_answer: { answer },
      })

      if (isCorrect) {
        setCorrectCount((prev) => prev + 1)
        setXpEarned((prev) => prev + 2)
      } else {
        const newHearts = Math.max(0, hearts - 1)
        setHearts(newHearts)
        await supabase.from("profiles").update({ hearts: newHearts }).eq("id", userId)

        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("profile-updated"))
        }

        if (newHearts <= 0) {
          setTimeout(() => router.push("/learn?nohearts=true"), 2000)
        }
      }
    } finally {
      submissionLockedRef.current = false
    }
  }

  const handleContinue = async () => {
    // Ensure we can submit the next question even if a previous save is still in-flight.
    submissionLockedRef.current = false
    setShowFeedback(false)
    setHasSubmitted(false)
    setLastSubmittedAnswer(undefined)

    if (currentIndex < totalCount - 1) {
      setIsLoading(true)
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1)
        setIsLoading(false)
      }, 300)
    } else {
      // Review session complete
      setIsLoading(true)
      setShowComplete(true)

      // Process completion asynchronously
      ;(async () => {
        const supabase = createClient()
        const totalXp = xpEarned

        try {
          // Update XP and level
          const { data: profile } = await supabase
            .from("profiles")
            .select("total_xp, current_level")
            .eq("id", userId)
            .single()

          if (profile) {
            const newTotalXp = (profile.total_xp || 0) + totalXp
            const newLevel = Math.floor(newTotalXp / 100) + 1

            await supabase
              .from("profiles")
              .update({
                total_xp: newTotalXp,
                current_level: newLevel,
                last_active_at: new Date().toISOString(),
              })
              .eq("id", userId)

            // Update daily goals
            const today = new Date().toISOString().split("T")[0]
            const { data: dailyGoal } = await supabase
              .from("daily_goals")
              .select("*")
              .eq("user_id", userId)
              .eq("date", today)
              .single()

            if (dailyGoal) {
              await supabase
                .from("daily_goals")
                .update({
                  xp_earned: (dailyGoal.xp_earned || 0) + totalXp,
                })
                .eq("id", dailyGoal.id)
            } else {
              await supabase.from("daily_goals").insert({
                user_id: userId,
                date: today,
                xp_earned: totalXp,
                lessons_completed: 0,
                xp_goal: 50,
                lessons_goal: 1,
                is_completed: false,
              })
            }

            // Check for achievements
            try {
              const response = await fetch("/api/achievements/check", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  totalXP: newTotalXp,
                  level: newLevel,
                }),
              })

              if (response.ok) {
                const { unlocked } = await response.json()
                if (unlocked && unlocked.length > 0) {
                  setUnlockedAchievement(unlocked[0])
                }
              }
            } catch (error) {
              console.error("Error checking achievements:", error)
            }

            // Dispatch event to update header
            if (typeof window !== "undefined") {
              window.dispatchEvent(new CustomEvent("profile-updated"))
            }
          }
        } finally {
          setIsLoading(false)
        }
      })()
    }
  }

  const handleExit = () => {
    if (confirm("Are you sure you want to exit the review session?")) {
      router.push("/review")
    }
  }

  if (!currentExercise) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg text-muted-foreground">No exercises to review</p>
          <Button onClick={() => router.push("/review")} className="mt-4">
            Back to Review
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 flex flex-col bg-background">
      <header className="relative flex items-center justify-between border-b-2 border-primary/20 bg-gradient-to-r from-card via-card/95 to-card px-4 py-4 backdrop-blur-xl shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-accent/5 to-primary/10 animate-gradient" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(120,119,198,0.1),transparent_50%)]" />
        <Button
          variant="ghost"
          size="icon"
          onClick={handleExit}
          className="relative rounded-xl hover:bg-destructive/20 hover:scale-110 transition-all z-10 border border-border/50 hover:border-destructive/50"
        >
          <X className="h-5 w-5" />
        </Button>

        <div className="relative mx-4 flex-1 max-w-md z-10">
          <div className="relative">
            <div className="mb-2 text-center">
              <h2 className="text-lg font-bold text-primary">{reviewTitle}</h2>
            </div>
            {/* Progress bar with glow effect (match lessons) */}
            <div className="relative h-5 rounded-full bg-muted/50 overflow-hidden border border-primary/20 shadow-inner">
              <Progress value={progress} className="h-full rounded-full bg-transparent" />
              {progress > 0 && (
                <>
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-all duration-700 shadow-lg"
                    style={{ width: `${progress}%` }}
                  />
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-primary/80 via-accent/80 to-primary/80 opacity-50 blur-sm transition-all duration-700 animate-shimmer"
                    style={{ width: `${progress}%` }}
                  />
                  {/* Progress shine effect */}
                  {progress > 5 && (
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"
                      style={{ width: `${progress}%` }}
                    />
                  )}
                </>
              )}
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 shadow-sm">
                <span className="font-bold text-primary text-sm">
                  Question {currentIndex + 1}
                </span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground font-medium text-sm">{totalCount}</span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-streak/20 border border-streak/30 text-streak animate-pulse">
                <RotateCcw className="h-3 w-3" />
                <span className="font-semibold text-xs">Review</span>
              </div>
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2.5 z-10">
          <div
            className={cn(
              "flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all border-2 shadow-md",
              hearts <= 1
                ? "animate-pulse bg-hearts/30 border-hearts/50 shadow-hearts/30"
                : "bg-hearts/15 border-hearts/30 hover:scale-105"
            )}
          >
            <Heart className={cn("h-5 w-5 fill-hearts text-hearts drop-shadow-sm", hearts <= 1 && "animate-wiggle")} />
            <span className="font-bold text-hearts text-lg drop-shadow-sm">{hearts}</span>
          </div>

          <div className="relative flex items-center gap-2 rounded-xl bg-gradient-to-br from-xp/20 to-xp/10 px-3.5 py-2 border-2 border-xp/30 shadow-md hover:scale-105 transition-all">
            <Zap className="h-5 w-5 text-xp drop-shadow-sm" />
            <span className="font-bold text-xp text-lg drop-shadow-sm">+{xpEarned}</span>
          </div>
        </div>
      </header>

      {/* Exercise content (match the lesson layout) */}
      <main className="relative flex-1 overflow-auto">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        {/* Animated background particles (match lessons) */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-primary/10 animate-float"
              style={{
                left: `${(i * 7) % 100}%`,
                top: `${(i * 11) % 100}%`,
                width: `${20 + (i % 5) * 10}px`,
                height: `${20 + (i % 5) * 10}px`,
                animationDelay: `${i * 0.3}s`,
                animationDuration: `${3 + (i % 3)}s`,
              }}
            />
          ))}
        </div>

        <div className="relative mx-auto max-w-2xl p-6 transition-all duration-300">
          <div className="relative">
            {currentExercise && currentExercise.content ? (
              <div
                className={cn(
                  "transition-all duration-500 ease-in-out",
                  (hasSubmitted || submissionLockedRef.current) && "pointer-events-none",
                )}
              >
                <div key={currentExercise?.id} className="animate-fade-in">
                  {renderReviewExercise({
                    exercise: currentExercise,
                    onSubmit: handleSubmit,
                    disabled: hasSubmitted || submissionLockedRef.current,
                    onContinue: hasSubmitted ? handleContinue : undefined,
                  })}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                  <p className="text-lg text-muted-foreground mb-4">Exercise data is incomplete</p>
                  <Button onClick={() => router.push("/review")}>Back to Review</Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Full-page loading overlay (match lessons) */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-semibold text-foreground">Loading...</p>
            <p className="text-sm text-muted-foreground">
              {currentIndex === totalCount - 1 ? "Completing review..." : "Loading next question..."}
            </p>
          </div>
        </div>
      )}

      {/* Completion modal */}
      {showComplete && (
        <LessonCompleteModal
          onClose={() => {
            setShowComplete(false)
            setIsLoading(false)
            router.push("/review")
          }}
          xpEarned={xpEarned}
          correctCount={correctCount}
          totalExercises={totalCount}
          lessonTitle={reviewTitle}
          isReviewMode={true}
        />
      )}

      {/* Achievement notification */}
      <AchievementNotification
        achievement={unlockedAchievement}
        onClose={() => setUnlockedAchievement(null)}
      />

      {showFeedback && currentExercise && (
        <ExerciseFeedback
          type={feedbackType}
          explanation={currentExplanation}
          onContinue={handleContinue}
          heartsLeft={hearts}
          correctAnswer={feedbackType === "incorrect" ? getCorrectAnswerText(currentExercise) : undefined}
          willRepeat={false}
          userAnswer={lastSubmittedAnswer}
          exerciseType={(currentExercise as any)?.type}
        />
      )}
    </div>
  )
}
