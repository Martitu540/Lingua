import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { RefreshCw, Brain, Clock, ArrowRight } from "lucide-react"
import Link from "next/link"

export default async function ReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ empty?: string }>
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const params = await searchParams

  // Fetch lessons with mistakes
  const { data: lessonsWithMistakes } = await supabase
    .from("user_lesson_progress")
    .select(
      `
      *,
      lesson:lessons(*, unit:units(course_id, course:courses(title)))
    `,
    )
    .eq("user_id", user.id)
    .gt("mistakes_count", 0)
    .order("last_attempted_at", { ascending: false })
    .limit(10)

  // Fetch exercise history with incorrect answers
  const { data: incorrectExercises } = await supabase
    .from("user_exercise_history")
    .select(
      `
      *,
      exercise:exercises(*, lesson:lessons(title, unit:units(course_id)))
    `,
    )
    .eq("user_id", user.id)
    .eq("is_correct", false)
    .order("attempted_at", { ascending: false })
    .limit(20)

  // Check if there are any incorrect exercises for smart review
  const hasIncorrectExercises = (incorrectExercises?.length || 0) > 0

  type MistakeItem = {
    id: string
    lessonTitle: string
    mistakesCount: number
    lastAttempted: string
    courseId: string
    lessonId: string
  }

  const reviewItems: MistakeItem[] =
    lessonsWithMistakes?.map((item: Record<string, unknown>) => {
      const lesson = item.lesson as {
        title: string
        id: string
        unit: { course_id: string; course: { title: string } }
      }
      return {
        id: item.id as string,
        lessonTitle: lesson?.title || "Unknown Lesson",
        mistakesCount: item.mistakes_count as number,
        lastAttempted: item.last_attempted_at as string,
        courseId: lesson?.unit?.course_id,
        lessonId: lesson?.id,
      }
      }) || []

  const isEmpty = params?.empty === "true"

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Review</h1>
        <p className="text-muted-foreground">Practice lessons you&apos;ve struggled with to improve retention</p>
      </div>

      {isEmpty && (
        <Card className="border-yellow-500/50 bg-yellow-500/10">
          <CardContent className="p-4">
            <p className="text-sm text-yellow-700 dark:text-yellow-400">
              No exercises available for review. Complete some lessons first!
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review cards */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-2 border-primary/20 bg-primary/5">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/20">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle>Spaced Repetition</CardTitle>
                <CardDescription>Review based on memory science</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Our system tracks what you&apos;ve learned and brings back items right before you&apos;d forget them.
            </p>
            <Button 
              className="w-full gap-2" 
              disabled={!hasIncorrectExercises}
              asChild={hasIncorrectExercises}
            >
              {hasIncorrectExercises ? (
                <Link href="/review/session?type=smart">
                  <RefreshCw className="h-4 w-4" />
                  Start Smart Review
                </Link>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  Start Smart Review
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <Clock className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <CardTitle>Recent Mistakes</CardTitle>
                <CardDescription>{incorrectExercises?.length || 0} exercises to review</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="mb-4 text-sm text-muted-foreground">
              Focus on exercises you got wrong recently to strengthen weak areas.
            </p>
            <Button 
              variant="outline" 
              className="w-full gap-2 bg-transparent" 
              disabled={!incorrectExercises?.length}
              asChild={!!incorrectExercises?.length}
            >
              {incorrectExercises?.length ? (
                <Link href="/review/session?type=mistakes">
                  Review Mistakes
                </Link>
              ) : (
                <>Review Mistakes</>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Lessons to review */}
      {reviewItems.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Lessons to Practice</CardTitle>
            <CardDescription>These lessons had some mistakes - practice makes perfect!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reviewItems.map((item) => (
                <Link
                  key={item.id}
                  href={`/review/session?lessonId=${item.lessonId}`}
                  className="flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-muted"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                      <span className="font-bold text-destructive">{item.mistakesCount}</span>
                    </div>
                    <div>
                      <p className="font-medium">{item.lessonTitle}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.mistakesCount} mistake{item.mistakesCount !== 1 ? "s" : ""} to review
                      </p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground" />
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[oklch(0.7_0.18_145)]/10">
              <RefreshCw className="h-8 w-8 text-[oklch(0.7_0.18_145)]" />
            </div>
            <h3 className="text-lg font-medium">Nothing to review yet</h3>
            <p className="mt-1 text-muted-foreground">
              Complete some lessons and we&apos;ll track what needs practice!
            </p>
            <Button asChild className="mt-4">
              <Link href="/learn">Start Learning</Link>
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
