import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { ExerciseContainer } from "@/components/exercises/exercise-container"
import type { Exercise, Lesson, Profile } from "@/types/database"

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ lessonId: string }>
  searchParams: Promise<{ course?: string }>
}) {
  const { lessonId } = await params
  const { course: courseId } = await searchParams
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch lesson with exercises
  const { data: lesson, error } = await supabase
    .from("lessons")
    .select(`
      *,
      unit:units(*, course:courses(*)),
      exercises(*)
    `)
    .eq("id", lessonId)
    .single()

  if (error || !lesson) {
    notFound()
  }

  // Sort exercises by order_index
  const lessonData = lesson as Lesson & {
    unit: { course: { id: string } }
    exercises: Exercise[]
  }
  lessonData.exercises = lessonData.exercises?.sort((a, b) => a.order_index - b.order_index) || []

  // Get user profile for hearts
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  // Check if user has hearts
  if ((profile as Profile)?.hearts <= 0) {
    redirect(`/learn/${courseId || lessonData.unit?.course?.id}?nohearts=true`)
  }

  return (
    <ExerciseContainer
      lesson={lessonData}
      exercises={lessonData.exercises}
      userId={user.id}
      courseId={courseId || lessonData.unit?.course?.id}
      initialHearts={(profile as Profile)?.hearts ?? 5}
    />
  )
}
