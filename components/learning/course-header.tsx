import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { Course, Language, Unit, Lesson } from "@/types/database"

interface CourseWithDetails extends Course {
  source_language: Language
  target_language: Language
  units: (Unit & { lessons: Lesson[] })[]
}

interface CourseHeaderProps {
  course: CourseWithDetails
  userXp: number
}

export function CourseHeader({ course, userXp }: CourseHeaderProps) {
  // Calculate total lessons and units
  const totalLessons = course.units.reduce((acc, unit) => acc + (unit.lessons?.length || 0), 0)
  const totalUnits = course.units.length

  // Calculate unlocked units based on XP
  const unlockedUnits = course.units.filter((unit) => userXp >= unit.unlock_xp).length

  // Progress percentage
  const progress = totalUnits > 0 ? Math.round((unlockedUnits / totalUnits) * 100) : 0

  return (
    <div className="rounded-2xl border bg-card p-6">
      <Button variant="ghost" size="sm" className="mb-4 -ml-2 gap-2" asChild>
        <Link href="/learn">
          <ArrowLeft className="h-4 w-4" />
          Back to courses
        </Link>
      </Button>

      <div className="flex items-start gap-6">
        {/* Flag */}
        <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-5xl">
          {course.target_language?.flag_emoji}
        </div>

        {/* Info */}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{course.title}</h1>
          <p className="mt-1 text-muted-foreground">{course.description}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Units:</span>{" "}
              <span className="font-medium">
                {unlockedUnits}/{totalUnits}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Lessons:</span>{" "}
              <span className="font-medium">{totalLessons}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Level:</span>{" "}
              <span className="font-medium capitalize">{course.difficulty_level}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Course Progress</span>
              <span className="font-medium">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>
    </div>
  )
}
