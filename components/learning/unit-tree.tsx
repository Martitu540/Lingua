"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Lock, Check, Play, ChevronDown, ChevronUp, BookOpen, MessageSquare, RefreshCw, Brain } from "lucide-react"
import type { Unit, Lesson, UserLessonProgress } from "@/types/database"
import Link from "next/link"
import { cn } from "@/lib/utils"

interface UnitTreeProps {
  units: (Unit & { lessons: Lesson[] })[]
  lessonProgress: UserLessonProgress[]
  userXp: number
  courseId: string
}

const lessonTypeIcons: Record<string, typeof BookOpen> = {
  vocabulary: BookOpen,
  grammar: Brain,
  conversation: MessageSquare,
  review: RefreshCw,
}

const themeColors: Record<string, string> = {
  emerald: "bg-emerald-500",
  blue: "bg-blue-500",
  orange: "bg-orange-500",
  sky: "bg-sky-500",
  pink: "bg-pink-500",
  purple: "bg-purple-500",
  red: "bg-red-500",
}

export function UnitTree({ units, lessonProgress, userXp, courseId }: UnitTreeProps) {
  const [expandedUnits, setExpandedUnits] = useState<Set<string>>(() => {
    // Auto-expand first unlocked unit that has incomplete lessons
    const firstIncomplete = units.find((unit) => {
      if (userXp < unit.unlock_xp) return false
      const unitLessons = unit.lessons || []
      return unitLessons.some((lesson) => {
        const progress = lessonProgress.find((p) => p.lesson_id === lesson.id)
        return !progress || progress.status !== "completed"
      })
    })
    return new Set(firstIncomplete ? [firstIncomplete.id] : units[0] ? [units[0].id] : [])
  })

  const toggleUnit = (unitId: string) => {
    setExpandedUnits((prev) => {
      const next = new Set(prev)
      if (next.has(unitId)) {
        next.delete(unitId)
      } else {
        next.add(unitId)
      }
      return next
    })
  }

  const getLessonStatus = (lessonId: string): "locked" | "available" | "completed" => {
    const progress = lessonProgress.find((p) => p.lesson_id === lessonId)
    if (progress?.status === "completed") return "completed"
    return "available"
  }

  return (
    <div className="space-y-4">
      {units.map((unit, unitIndex) => {
        const isUnlocked = userXp >= unit.unlock_xp
        const isExpanded = expandedUnits.has(unit.id)
        const completedLessons = unit.lessons.filter((l) => getLessonStatus(l.id) === "completed").length
        const totalLessons = unit.lessons.length
        const isUnitComplete = completedLessons === totalLessons && totalLessons > 0

        return (
          <Card
            key={unit.id}
            className={cn(
              "overflow-hidden transition-all",
              !isUnlocked && "opacity-60",
              isUnitComplete && "border-[oklch(0.7_0.18_145)]",
            )}
          >
            <CardHeader
              className={cn(
                "cursor-pointer select-none transition-colors hover:bg-muted/50",
                !isUnlocked && "cursor-not-allowed",
              )}
              onClick={() => isUnlocked && toggleUnit(unit.id)}
            >
              <div className="flex items-center gap-4">
                {/* Unit number badge */}
                <div
                  className={cn(
                    "flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white",
                    isUnlocked ? themeColors[unit.theme_color] || "bg-primary" : "bg-muted-foreground",
                  )}
                >
                  {isUnitComplete ? <Check className="h-6 w-6" /> : unitIndex + 1}
                </div>

                {/* Unit info */}
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {unit.title}
                    {!isUnlocked && <Lock className="h-4 w-4 text-muted-foreground" />}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">{unit.description}</p>
                </div>

                {/* Progress & expand */}
                <div className="flex items-center gap-4">
                  {isUnlocked && (
                    <span className="text-sm text-muted-foreground">
                      {completedLessons}/{totalLessons} lessons
                    </span>
                  )}
                  {!isUnlocked && <span className="text-sm text-muted-foreground">Unlock at {unit.unlock_xp} XP</span>}
                  {isUnlocked &&
                    (isExpanded ? (
                      <ChevronUp className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ))}
                </div>
              </div>
            </CardHeader>

            {/* Lessons */}
            {isUnlocked && isExpanded && (
              <CardContent className="border-t bg-muted/30 p-4">
                <div className="space-y-2">
                  {unit.lessons.map((lesson, lessonIndex) => {
                    const status = getLessonStatus(lesson.id)
                    const Icon = lessonTypeIcons[lesson.type] || BookOpen
                    const isCompleted = status === "completed"

                    return (
                      <Link
                        key={lesson.id}
                        href={`/lesson/${lesson.id}?course=${courseId}`}
                        className={cn(
                          "flex items-center gap-4 rounded-lg border bg-card p-4 transition-all hover:shadow-md",
                          isCompleted && "border-[oklch(0.7_0.18_145)]/50",
                        )}
                      >
                        {/* Lesson number/status */}
                        <div
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-full text-sm font-medium",
                            isCompleted ? "bg-[oklch(0.7_0.18_145)] text-white" : "bg-primary/10 text-primary",
                          )}
                        >
                          {isCompleted ? <Check className="h-5 w-5" /> : lessonIndex + 1}
                        </div>

                        {/* Lesson info */}
                        <div className="flex-1">
                          <p className="font-medium">{lesson.title}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1 capitalize">
                              <Icon className="h-3.5 w-3.5" />
                              {lesson.type}
                            </span>
                            <span>{lesson.estimated_minutes} min</span>
                            <span className="text-[oklch(0.75_0.18_55)]">+{lesson.xp_reward} XP</span>
                          </div>
                        </div>

                        {/* Action */}
                        <Button
                          size="sm"
                          variant={isCompleted ? "outline" : "default"}
                          className={isCompleted ? "bg-transparent" : ""}
                        >
                          {isCompleted ? (
                            <>
                              <RefreshCw className="mr-1 h-4 w-4" />
                              Practice
                            </>
                          ) : (
                            <>
                              <Play className="mr-1 h-4 w-4" />
                              Start
                            </>
                          )}
                        </Button>
                      </Link>
                    )
                  })}
                </div>
              </CardContent>
            )}
          </Card>
        )
      })}
    </div>
  )
}
