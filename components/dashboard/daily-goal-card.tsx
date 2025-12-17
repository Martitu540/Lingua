"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Target, Check, Sparkles, Zap, BookOpen } from "lucide-react"
import type { DailyGoal } from "@/types/database"
import { createClient } from "@/lib/supabase/client"
import { useEffect, useState } from "react"

interface DailyGoalCardProps {
  goal: DailyGoal | null
  userId: string
  defaultXpGoal?: number
  defaultLessonsGoal?: number
}

export function DailyGoalCard({ goal: initialGoal, userId, defaultXpGoal = 50, defaultLessonsGoal = 3 }: DailyGoalCardProps) {
  const [goal, setGoal] = useState<DailyGoal | null>(initialGoal)
  const [animatedXP, setAnimatedXP] = useState(0)
  const [animatedLessons, setAnimatedLessons] = useState(0)

  useEffect(() => {
    setGoal(initialGoal)
  }, [initialGoal])

  useEffect(() => {
    if (!initialGoal || !userId) {
      if (!userId) return
      const createGoal = async () => {
        const supabase = createClient()
        const today = new Date().toLocaleDateString("en-CA")
        const { data, error } = await supabase
          .from("daily_goals")
          .upsert(
            {
              user_id: userId,
              date: today,
              xp_goal: defaultXpGoal,
              xp_earned: 0,
              lessons_goal: defaultLessonsGoal,
              lessons_completed: 0,
            },
            { onConflict: "user_id,date" },
          )
          .select()
          .single()
        if (error) {
          console.error("Failed to create daily goal", error)
          return
        }
        if (data) {
          setGoal(data as DailyGoal)
        }
      }
      createGoal()
    }
  }, [initialGoal, userId, defaultXpGoal, defaultLessonsGoal])

  // Animate progress values
  useEffect(() => {
    if (goal) {
      const xpTimer = setInterval(() => {
        setAnimatedXP((prev) => {
          if (prev < goal.xp_earned) return Math.min(prev + 2, goal.xp_earned)
          return prev
        })
      }, 20)
      const lessonsTimer = setInterval(() => {
        setAnimatedLessons((prev) => {
          if (prev < goal.lessons_completed) return prev + 1
          return prev
        })
      }, 100)
      return () => {
        clearInterval(xpTimer)
        clearInterval(lessonsTimer)
      }
    }
  }, [goal])

  const xpProgress = goal ? Math.min((animatedXP / goal.xp_goal) * 100, 100) : 0
  const lessonsProgress = goal ? Math.min((animatedLessons / goal.lessons_goal) * 100, 100) : 0
  const isComplete = goal?.is_completed || (xpProgress >= 100 && lessonsProgress >= 100)

  return (
    <Card
      className={`overflow-hidden transition-all duration-500 relative group ${
        isComplete
          ? "border-success bg-gradient-to-br from-success/10 to-transparent shadow-lg shadow-success/20"
          : "border-border/50 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5"
      }`}
    >
      {/* Background decoration */}
      {isComplete && (
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-success/20 blur-3xl animate-pulse" />
          <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-success/10 blur-2xl" />
        </div>
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Daily Goal
          {isComplete && <span className="text-success text-xs font-bold animate-bounce-in">Complete!</span>}
        </CardTitle>
        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-500 ${
            isComplete
              ? "bg-gradient-to-br from-success to-emerald-600 shadow-lg shadow-success/30 scale-110"
              : "bg-primary/10 group-hover:bg-primary/20 group-hover:scale-105"
          }`}
        >
          {isComplete ? (
            <Check className="h-5 w-5 text-white animate-bounce-in" />
          ) : (
            <Target className="h-5 w-5 text-primary" />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 relative">
        {/* XP Progress */}
        <div className="group/xp">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-xp/15">
                <Zap className="h-3 w-3 text-xp" />
              </div>
              XP Earned
            </span>
            <span className="font-bold tabular-nums">
              <span className={xpProgress >= 100 ? "text-success" : "text-xp"}>{animatedXP}</span>
              <span className="text-muted-foreground">/{goal?.xp_goal || 50}</span>
            </span>
          </div>
          <div className="relative">
            <Progress value={xpProgress} className="h-3" />
            {xpProgress >= 100 && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-success/0 via-success/30 to-success/0 animate-shimmer" />
            )}
          </div>
        </div>

        {/* Lessons Progress */}
        <div className="group/lessons">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-2">
              <div className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/15">
                <BookOpen className="h-3 w-3 text-primary" />
              </div>
              Lessons Completed
            </span>
            <span className="font-bold tabular-nums">
              <span className={lessonsProgress >= 100 ? "text-success" : "text-foreground"}>{animatedLessons}</span>
              <span className="text-muted-foreground">/{goal?.lessons_goal || 3}</span>
            </span>
          </div>
          <div className="relative">
            <Progress value={lessonsProgress} className="h-3" />
            {lessonsProgress >= 100 && (
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-success/0 via-success/30 to-success/0 animate-shimmer" />
            )}
          </div>
        </div>

        {/* Completion celebration */}
        {isComplete && (
          <div className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-success/20 to-emerald-500/20 py-3 text-sm font-bold text-success animate-bounce-in">
            <Sparkles className="h-4 w-4 animate-pulse" />
            Amazing! Goal completed!
            <Sparkles className="h-4 w-4 animate-pulse" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
