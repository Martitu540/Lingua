"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Zap, Trophy, Target, ArrowRight, Sparkles, Flame, RotateCcw } from "lucide-react"
import { useRouter } from "next/navigation"
import confetti from "canvas-confetti"
import { useEffect } from "react"

interface LessonCompleteModalProps {
  xpEarned: number
  correctCount: number
  totalExercises: number
  lessonTitle?: string
  courseId?: string
  maxCombo?: number
  repeatCount?: number
  isReviewMode?: boolean
  onClose?: () => void
}

export function LessonCompleteModal({
  xpEarned,
  correctCount,
  totalExercises,
  lessonTitle = "Review Session",
  courseId,
  maxCombo = 0,
  repeatCount = 0,
  isReviewMode = false,
  onClose,
}: LessonCompleteModalProps) {
  const router = useRouter()
  const accuracy = Math.round((correctCount / totalExercises) * 100)
  const isPerfect = accuracy === 100

  useEffect(() => {
    if (isPerfect) {
      const duration = 3000
      const end = Date.now() + duration
      const colors = ["#a855f7", "#22c55e", "#eab308", "#3b82f6"]
      ;(function frame() {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors,
        })
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors,
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      })()
    } else {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#a855f7", "#22c55e", "#eab308", "#3b82f6"],
      })
    }
  }, [isPerfect])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 backdrop-blur-xl">
      <Card className="w-full max-w-md animate-bounce-in border-2 border-border/50 shadow-2xl overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-primary via-accent to-xp" />

        <CardContent className="p-8 text-center">
          {/* Trophy icon */}
          <div className="relative mx-auto mb-6">
            <div
              className={`flex h-28 w-28 items-center justify-center rounded-3xl shadow-2xl ${
                isPerfect
                  ? "bg-gradient-to-br from-gold via-xp to-streak animate-gradient"
                  : "bg-gradient-to-br from-xp to-gold"
              }`}
            >
              <Trophy className="h-14 w-14 text-white" />
            </div>
            {isPerfect && (
              <div className="absolute -right-2 -top-2 flex h-10 w-10 items-center justify-center rounded-full bg-success shadow-lg shadow-success/30 animate-bounce">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            )}
          </div>

          {/* Title */}
          <h2 className="text-3xl font-bold">{isPerfect ? "Perfect!" : isReviewMode ? "Review Complete!" : "Lesson Complete!"}</h2>
          <p className="mt-1 text-muted-foreground">{lessonTitle}</p>

          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-2xl bg-gradient-to-br from-xp/20 to-xp/5 p-4">
              <div className="flex items-center justify-center gap-2">
                <Zap className="h-7 w-7 text-xp" />
                <span className="text-3xl font-bold text-xp">+{xpEarned}</span>
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">XP Earned</p>
            </div>

            <div
              className={`rounded-2xl p-4 ${
                isPerfect
                  ? "bg-gradient-to-br from-success/20 to-success/5"
                  : "bg-gradient-to-br from-primary/20 to-primary/5"
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Target className={`h-7 w-7 ${isPerfect ? "text-success" : "text-primary"}`} />
                <span className={`text-3xl font-bold ${isPerfect ? "text-success" : "text-primary"}`}>{accuracy}%</span>
              </div>
              <p className="mt-1 text-sm font-medium text-muted-foreground">Accuracy</p>
            </div>

            {maxCombo >= 3 && (
              <div className="rounded-2xl bg-gradient-to-br from-streak/20 to-streak/5 p-4">
                <div className="flex items-center justify-center gap-2">
                  <Flame className="h-7 w-7 text-streak" />
                  <span className="text-3xl font-bold text-streak">{maxCombo}x</span>
                </div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Max Combo</p>
              </div>
            )}

            {repeatCount > 0 && (
              <div className="rounded-2xl bg-gradient-to-br from-muted to-muted/50 p-4">
                <div className="flex items-center justify-center gap-2">
                  <RotateCcw className="h-7 w-7 text-muted-foreground" />
                  <span className="text-3xl font-bold text-muted-foreground">{repeatCount}</span>
                </div>
                <p className="mt-1 text-sm font-medium text-muted-foreground">Reviewed</p>
              </div>
            )}
          </div>

          {/* Perfect score message */}
          {isPerfect && (
            <div className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-success/20 to-accent/20 p-4 text-sm font-semibold">
              <Sparkles className="h-5 w-5 text-success" />
              <span className="bg-gradient-to-r from-success to-accent bg-clip-text text-transparent">
                Perfect score! You&apos;re amazing!
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            {isReviewMode ? (
              <>
                <Button
                  onClick={() => {
                    if (onClose) {
                      onClose()
                    } else {
                      router.push("/review")
                    }
                  }}
                  className="w-full gap-2 h-14 text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-xl"
                  size="lg"
                >
                  Back to Review
                  <ArrowRight className="h-5 w-5" />
                </Button>
                {courseId && (
                  <Button
                    variant="outline"
                    onClick={() => router.push(`/learn/${courseId}`)}
                    className="w-full h-12 bg-transparent"
                    size="lg"
                  >
                    Continue Learning
                  </Button>
                )}
              </>
            ) : (
              <>
                <Button
                  onClick={() => router.push(`/learn/${courseId || ""}`)}
                  className="w-full gap-2 h-14 text-lg font-semibold shadow-lg shadow-primary/25 hover:shadow-xl"
                  size="lg"
                >
                  Continue Learning
                  <ArrowRight className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard")}
                  className="w-full h-12 bg-transparent"
                  size="lg"
                >
                  Back to Dashboard
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
