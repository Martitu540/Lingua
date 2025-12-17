"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowRight, BookOpen, Sparkles, Play, Lock } from "lucide-react"
import type { Course, UserCourse, Language } from "@/types/database"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { useState } from "react"

interface CourseWithLanguages extends Course {
  source_language: Language
  target_language: Language
}

interface CourseCardProps {
  course: CourseWithLanguages
  userCourse?: UserCourse
  enrolled?: boolean
}

const languageGradients: Record<string, string> = {
  es: "from-red-500 via-yellow-500 to-red-600",
  fr: "from-blue-500 via-white to-red-500",
  de: "from-gray-900 via-red-500 to-yellow-500",
  ja: "from-red-500 via-pink-200 to-red-400",
  it: "from-green-500 via-white to-red-500",
  pt: "from-green-500 via-yellow-400 to-blue-500",
  zh: "from-red-600 via-yellow-400 to-red-500",
  ko: "from-blue-600 via-red-400 to-blue-500",
}

const languageShadows: Record<string, string> = {
  es: "shadow-red-500/30",
  fr: "shadow-blue-500/30",
  de: "shadow-yellow-500/30",
  ja: "shadow-pink-500/30",
  it: "shadow-green-500/30",
  pt: "shadow-green-500/30",
  zh: "shadow-red-500/30",
  ko: "shadow-blue-500/30",
}

export function CourseCard({ course, userCourse, enrolled }: CourseCardProps) {
  const router = useRouter()
  const [isEnrolling, setIsEnrolling] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const handleEnroll = async () => {
    setIsEnrolling(true)
    const supabase = createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/auth/login")
      return
    }

    await supabase.from("user_courses").insert({
      user_id: user.id,
      course_id: course.id,
    })

    router.push(`/learn/${course.id}`)
  }

  const handleContinue = () => {
    router.push(`/learn/${course.id}`)
  }

  const progress = enrolled ? 35 : 0
  const langCode = course.target_language?.code || "es"
  const gradient = languageGradients[langCode] || "from-primary to-accent"
  const shadow = languageShadows[langCode] || "shadow-primary/30"

  return (
    <Card
      className={`group overflow-hidden border-border/50 transition-all duration-500 hover:border-primary/30 hover:-translate-y-2 hover:shadow-2xl ${shadow}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className={`relative h-36 overflow-hidden bg-gradient-to-br ${gradient}`}>
        {/* Animated overlay patterns */}
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.3),transparent_60%)]" />
        <div
          className={`absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/30 blur-2xl transition-all duration-500 ${isHovered ? "scale-150 opacity-50" : "opacity-30"}`}
        />
        <div
          className={`absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-white/20 blur-2xl transition-all duration-500 ${isHovered ? "scale-150 opacity-40" : "opacity-20"}`}
        />

        {/* Flag emoji with animation */}
        <div className="relative flex h-full flex-col items-center justify-center">
          <span
            className={`text-6xl drop-shadow-lg transition-all duration-500 ${isHovered ? "scale-125 -translate-y-1" : ""}`}
          >
            {course.target_language?.flag_emoji}
          </span>

          {/* Progress badge for enrolled courses */}
          {enrolled && (
            <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-white/90 dark:bg-black/50 px-2.5 py-1 text-xs font-bold shadow-lg backdrop-blur-sm animate-slide-up">
              <Sparkles className="h-3 w-3 text-primary" />
              <span className="text-foreground">{progress}%</span>
            </div>
          )}

          {/* Premium badge */}
          {course.is_premium && !enrolled && (
            <div className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-gold/90 px-2.5 py-1 text-xs font-bold text-white shadow-lg">
              <Lock className="h-3 w-3" />
              Premium
            </div>
          )}

          {/* Play button overlay on hover */}
          <div
            className={`absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm transition-all duration-300 ${isHovered ? "opacity-100" : "opacity-0"}`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/90 shadow-xl transition-transform duration-300 hover:scale-110">
              <Play className="h-6 w-6 text-foreground ml-1" />
            </div>
          </div>
        </div>
      </div>

      <CardContent className="p-4">
        <h3 className="font-bold text-lg group-hover:text-primary transition-colors">{course.title}</h3>
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{course.description}</p>

        {enrolled ? (
          <div className="mt-4 space-y-3">
            <div>
              <div className="mb-1.5 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-bold">{progress}%</span>
              </div>
              <div className="relative">
                <Progress value={progress} className="h-2.5" />
                {progress > 0 && (
                  <div
                    className="absolute top-0 left-0 h-full rounded-full bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer"
                    style={{ width: `${progress}%` }}
                  />
                )}
              </div>
            </div>
            <Button
              className={`w-full gap-2 shadow-lg ${shadow} transition-all duration-300 group-hover:shadow-xl`}
              onClick={handleContinue}
            >
              Continue Learning
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
              <BookOpen className="h-3.5 w-3.5" />
              <span className="capitalize">{course.difficulty_level}</span>
            </div>
            <Button
              size="sm"
              onClick={handleEnroll}
              disabled={isEnrolling}
              className={`shadow-lg ${shadow} transition-all duration-300 hover:shadow-xl hover:scale-105`}
            >
              {isEnrolling ? (
                <span className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Starting...
                </span>
              ) : (
                "Start Learning"
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
