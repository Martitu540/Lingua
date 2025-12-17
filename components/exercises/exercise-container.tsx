"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { X, Heart, Zap, RotateCcw, Sparkles } from "lucide-react"
import type { Exercise, Lesson, Achievement } from "@/types/database"

// V2 components
import { MultipleChoiceExerciseV2 } from "@/components/exercises_v2/multiple-choice-v2"
import { FillBlankExerciseV2 } from "@/components/exercises_v2/fill-blank-v2"
import { TranslationExerciseV2 } from "@/components/exercises_v2/translation-v2"
import { MatchingExerciseV2 } from "@/components/exercises_v2/matching-v2"
import { ReorderSentenceExerciseV2 } from "@/components/exercises_v2/reorder-sentence-v2"
import { ListeningExerciseV2 } from "@/components/exercises_v2/listening-v2"
import { DialogueExerciseV2 } from "@/components/exercises_v2/dialogue-v2"

// keep V1 only for types we didn't upgrade
import { DragDropExercise } from "./drag-drop"
import { SpeakingExercise } from "./speaking-exercise"

import { ExerciseFeedback } from "./exercise-feedback"
import { LessonCompleteModal } from "./lesson-complete-modal"
import { AchievementNotification } from "@/components/achievements/achievement-notification"
import { createClient } from "@/lib/supabase/client"
import { cn } from "@/lib/utils"

interface ExerciseContainerProps {
  lesson: Lesson
  exercises: Exercise[]
  userId: string
  courseId: string
  initialHearts: number
}

export function ExerciseContainer({
  lesson,
  exercises,
  userId,
  courseId,
  initialHearts,
}: ExerciseContainerProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [hearts, setHearts] = useState(initialHearts)
  const [xpEarned, setXpEarned] = useState(0)
  const [correctCount, setCorrectCount] = useState(0)
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<"correct" | "incorrect">("correct")
  const [currentExplanation, setCurrentExplanation] = useState("")
  const [unlockedAchievement, setUnlockedAchievement] = useState<Achievement | null>(null)
  const [showComplete, setShowComplete] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [lastSubmittedAnswer, setLastSubmittedAnswer] = useState<unknown>(undefined)
  const [wrongAnswerQueue, setWrongAnswerQueue] = useState<Exercise[]>([])
  const [isRepeatMode, setIsRepeatMode] = useState(false)
  const [comboCount, setComboCount] = useState(0)
  const [showCombo, setShowCombo] = useState(false)
  const [xpPopAnimation, setXpPopAnimation] = useState(false)
  const [autoAdvanceMs, setAutoAdvanceMs] = useState<number | null>(null)
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const submissionLockedRef = useRef(false)
  const [isLoading, setIsLoading] = useState(false)
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  // combine original exercises + wrong-answer review queue
  const allExercises = [...exercises, ...wrongAnswerQueue]
  const currentExercise = allExercises[currentIndex]
  const totalCount = allExercises.length
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

  const handleSubmit = async (answer: unknown, isCorrect: boolean) => {
    if (submissionLockedRef.current || hasSubmitted || !currentExercise) return

    submissionLockedRef.current = true

    setLastSubmittedAnswer(answer)
    setHasSubmitted(true)
    setFeedbackType(isCorrect ? "correct" : "incorrect")
    setCurrentExplanation(currentExercise.explanation || "")
    setShowFeedback(true)
    setAutoAdvanceMs(null) // Always show continue button

    const supabase = createClient()

    // save exercise attempt
    await supabase.from("user_exercise_history").insert({
      user_id: userId,
      exercise_id: currentExercise.id,
      is_correct: isCorrect,
      user_answer: { answer },
    })

    if (isCorrect) {
      setCorrectCount((prev) => prev + 1)

      const newCombo = comboCount + 1
      setComboCount(newCombo)

      const bonusXp = newCombo >= 3 ? Math.min(newCombo, 5) : 0
      setXpEarned((prev) => prev + 2 + bonusXp)

      setXpPopAnimation(true)
      setTimeout(() => setXpPopAnimation(false), 800)

      if (newCombo >= 3) {
        setShowCombo(true)
        setTimeout(() => setShowCombo(false), 1500)
      }
    } else {
      setComboCount(0)
      const newHearts = Math.max(0, hearts - 1)
      setHearts(newHearts)

      // enqueue for review if not already in queue
      if (!wrongAnswerQueue.find((e) => e.id === currentExercise.id)) {
        setWrongAnswerQueue((prev) => [...prev, currentExercise])
      }

      const supabase2 = createClient()
      await supabase2.from("profiles").update({ hearts: newHearts }).eq("id", userId)

      // Dispatch event to update header
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("profile-updated"))
      }

      if (newHearts <= 0) {
        setTimeout(() => router.push(`/learn/${courseId}?nohearts=true`), 2000)
      }
    }
  }

  // Track question start time
  useEffect(() => {
    if (currentExercise) {
      setQuestionStartTime(Date.now())
    }
  }, [currentExercise?.id])

  const handleContinue = async () => {
    submissionLockedRef.current = false

    if (autoAdvanceTimeoutRef.current) {
      clearTimeout(autoAdvanceTimeoutRef.current)
      autoAdvanceTimeoutRef.current = null
    }
    setAutoAdvanceMs(null)
    // close feedback and re-enable exercise
    setShowFeedback(false)
    setHasSubmitted(false)
    setLastSubmittedAnswer(undefined)

    // not last exercise → go to next one
    if (currentIndex < totalCount - 1) {
      setIsLoading(true)
      setCurrentIndex((prev) => prev + 1)

      if (currentIndex + 1 >= exercises.length && wrongAnswerQueue.length > 0) {
        setIsRepeatMode(true)
      }

      // Small delay for smooth transition
      setTimeout(() => {
        setIsLoading(false)
      }, 300)

      return
    }

    // ===== LESSON COMPLETE =====
    // Immediately show loading and completion modal to prevent showing last question
    setIsLoading(true)
    setShowComplete(true)
    
    // Process completion in background (async)
    ;(async () => {
      const totalXp = xpEarned + lesson.xp_reward
      const supabase = createClient()

      // 1) lesson progress
      await supabase.from("user_lesson_progress").upsert(
        {
          user_id: userId,
          lesson_id: lesson.id,
          status: "completed",
          score: Math.round((correctCount / exercises.length) * 100),
          attempts: 1,
          completed_at: new Date().toISOString(),
          last_attempted_at: new Date().toISOString(),
          mistakes_count: exercises.length - correctCount,
        },
        { onConflict: "user_id,lesson_id" },
      )

      // 2) streak (once per day)
      const today = new Date().toISOString().split("T")[0]
      const { data: streakInfo } = await supabase
        .from("profiles")
        .select("last_active_at, streak_count, longest_streak")
        .eq("id", userId)
        .single()

      const lastActive = streakInfo?.last_active_at ? streakInfo.last_active_at.split("T")[0] : null
      let newStreak = streakInfo?.streak_count ?? 0

      if (lastActive !== today) {
        const yesterday = new Date()
        yesterday.setDate(yesterday.getDate() - 1)
        const y = yesterday.toISOString().split("T")[0]

        if (lastActive === y) {
          newStreak += 1
        } else {
          newStreak = 1
        }

        await supabase
          .from("profiles")
          .update({
            streak_count: newStreak,
            longest_streak: Math.max(newStreak, streakInfo?.longest_streak ?? 0),
            last_active_at: new Date().toISOString(),
          })
          .eq("id", userId)
      }

      // 3) XP + level
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp, current_level")
        .eq("id", userId)
        .single()

      let newTotalXp = (profile?.total_xp || 0) + totalXp
      if (profile) {
        const newLevel = Math.floor(newTotalXp / 100) + 1

        await supabase
          .from("profiles")
          .update({
            total_xp: newTotalXp,
            current_level: newLevel,
            last_active_at: new Date().toISOString(),
          })
          .eq("id", userId)

        // Dispatch event to update header
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("profile-updated"))
        }
      }

      // 4) daily goals
      const todayGoal = today
      const { data: dailyGoal } = await supabase
        .from("daily_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("date", todayGoal)
        .single()

      if (dailyGoal) {
        await supabase
          .from("daily_goals")
          .update({
            xp_earned: (dailyGoal.xp_earned || 0) + totalXp,
            lessons_completed: (dailyGoal.lessons_completed || 0) + 1,
            is_completed:
              (dailyGoal.xp_earned || 0) + totalXp >= dailyGoal.xp_goal &&
              (dailyGoal.lessons_completed || 0) + 1 >= dailyGoal.lessons_goal,
          })
          .eq("id", dailyGoal.id)
      }

      // 5) Check for achievements
      const currentHour = new Date().getHours()
      const mistakesCount = exercises.length - correctCount
      
      try {
        const response = await fetch("/api/achievements/check", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            totalXP: newTotalXp,
            streakCount: newStreak,
            lessonsCompleted: undefined, // Will be calculated server-side
            mistakesCount: mistakesCount === 0 ? 0 : undefined, // Only check perfect lesson if no mistakes
            currentHour,
          }),
        })

        if (response.ok) {
          const { unlocked } = await response.json()
          if (unlocked && unlocked.length > 0) {
            // Show the first unlocked achievement
            setUnlockedAchievement(unlocked[0])
          }
        }
      } catch (error) {
        console.error("Error checking achievements:", error)
      }

      // 6) show complete modal
      setXpEarned(totalXp)
      setIsLoading(false) // Hide loading once everything is processed
    })() // End async IIFE
  }

  useEffect(() => {
    if (!autoAdvanceMs || !showFeedback) return
    autoAdvanceTimeoutRef.current = setTimeout(() => {
      handleContinue()
    }, autoAdvanceMs)
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current)
        autoAdvanceTimeoutRef.current = null
      }
    }
  }, [autoAdvanceMs, showFeedback])

  const handleExit = () => router.push(`/learn/${courseId}`)

  const renderExercise = () => {
    if (!currentExercise) return null

    const commonProps = {
      exercise: currentExercise,
      onSubmit: handleSubmit,
      disabled: hasSubmitted || submissionLockedRef.current,
      onContinue: hasSubmitted ? handleContinue : undefined,
    }

    // Simple wrapper without duplicate animations
    const ExerciseWrapper = ({ children }: { children: React.ReactNode }) => (
      <div key={currentExercise.id}>{children}</div>
    )

    switch (currentExercise.type) {
      case "multiple_choice":
        return (
          <ExerciseWrapper>
            <MultipleChoiceExerciseV2 {...commonProps} />
          </ExerciseWrapper>
        )

      case "fill_blank":
        return (
          <ExerciseWrapper>
            <FillBlankExerciseV2 {...commonProps} />
          </ExerciseWrapper>
        )

      case "translation":
        return (
          <ExerciseWrapper>
            <TranslationExerciseV2 {...commonProps} />
          </ExerciseWrapper>
        )

      case "matching":
        return (
          <ExerciseWrapper>
            <MatchingExerciseV2 {...commonProps} />
          </ExerciseWrapper>
        )

      case "reorder":
        return (
          <ExerciseWrapper>
            <ReorderSentenceExerciseV2 {...commonProps} />
          </ExerciseWrapper>
        )

      case "listening":
        return (
          <ExerciseWrapper>
            <ListeningExerciseV2 {...commonProps} />
          </ExerciseWrapper>
        )

      case "dialogue":
        return (
          <ExerciseWrapper>
            <DialogueExerciseV2 {...commonProps} />
          </ExerciseWrapper>
        )

      // Legacy types (still using old components)
      case "drag_drop":
        return (
          <ExerciseWrapper>
            <DragDropExercise {...commonProps} />
          </ExerciseWrapper>
        )

      case "speaking":
        return (
          <ExerciseWrapper>
            <SpeakingExercise {...commonProps} />
          </ExerciseWrapper>
        )

      default:
        return (
          <ExerciseWrapper>
            <MultipleChoiceExerciseV2 {...commonProps} />
          </ExerciseWrapper>
        )
    }
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
            {/* Progress bar with glow effect */}
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
              {isRepeatMode && (
                <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-streak/20 border border-streak/30 text-streak animate-pulse">
                  <RotateCcw className="h-3 w-3" />
                  <span className="font-semibold text-xs">Review</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="relative flex items-center gap-2.5 z-10">
          {showCombo && (
            <div className="absolute -left-24 top-1/2 -translate-y-1/2 animate-bounce-in">
              <div className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-xp via-gold to-xp px-4 py-1.5 text-sm font-bold text-white shadow-xl border-2 border-gold/50 animate-pulse">
                <Sparkles className="h-4 w-4 animate-spin" />
                <span className="drop-shadow-lg">{comboCount}x Combo!</span>
                <Sparkles className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

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
            {xpPopAnimation && (
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 animate-xp-pop text-sm font-bold text-xp drop-shadow-lg">
                +2
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="relative flex-1 overflow-auto">
        <div className="absolute inset-0 mesh-gradient opacity-60" />
        {/* Animated background particles */}
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
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-muted-foreground text-sm">Loading next question...</p>
                </div>
              </div>
            ) : (
              <div className={cn(
                "transition-all duration-500 ease-in-out",
                (hasSubmitted || submissionLockedRef.current) && "pointer-events-none"
              )}>
                <div key={currentExercise?.id} className="animate-fade-in">
                  {renderExercise()}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Full-page loading overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-lg font-semibold text-foreground">Loading...</p>
            <p className="text-sm text-muted-foreground">
              {showComplete ? "Completing lesson..." : "Loading next question..."}
            </p>
          </div>
        </div>
      )}

      {/* Achievement Notification */}
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
          willRepeat={feedbackType === "incorrect"}
          autoAdvanceMs={autoAdvanceMs ?? undefined}
          hideButton={Boolean(autoAdvanceMs)}
          userAnswer={lastSubmittedAnswer}
          exerciseType={currentExercise.type}
        />
      )}

      {showComplete && (
        <LessonCompleteModal
          xpEarned={xpEarned}
          correctCount={correctCount}
          totalExercises={exercises.length}
          lessonTitle={lesson.title}
          courseId={courseId}
          maxCombo={comboCount}
          repeatCount={wrongAnswerQueue.length}
        />
      )}
    </div>
  )
}
