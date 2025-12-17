import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { UnitTree } from "@/components/learning/unit-tree"
import { CourseHeader } from "@/components/learning/course-header"
import type { Course, Unit, Lesson, UserLessonProgress, Language } from "@/types/database"

interface CourseWithDetails extends Course {
  source_language: Language
  target_language: Language
  units: (Unit & { lessons: Lesson[] })[]
}

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch course with units and lessons
  const { data: course, error } = await supabase
    .from("courses")
    .select(`
      *,
      source_language:languages!courses_source_language_id_fkey(*),
      target_language:languages!courses_target_language_id_fkey(*),
      units(*, lessons(*))
    `)
    .eq("id", courseId)
    .single()

  if (error || !course) {
    notFound()
  }

  // Sort units and lessons by order_index
  const courseData = course as CourseWithDetails
  courseData.units = courseData.units?.sort((a, b) => a.order_index - b.order_index) || []
  courseData.units.forEach((unit) => {
    unit.lessons = unit.lessons?.sort((a, b) => a.order_index - b.order_index) || []
  })

  // Check if user is enrolled
  const { data: userCourse } = await supabase
    .from("user_courses")
    .select("*")
    .eq("user_id", user.id)
    .eq("course_id", courseId)
    .single()

  // If not enrolled, enroll them
  if (!userCourse) {
    await supabase.from("user_courses").insert({
      user_id: user.id,
      course_id: courseId,
    })
  }

  // Update last practiced at
  await supabase
    .from("user_courses")
    .update({ last_practiced_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .eq("course_id", courseId)

  // Fetch user's lesson progress
  const lessonIds = courseData.units.flatMap((u) => u.lessons.map((l) => l.id))
  const { data: lessonProgress } = await supabase
    .from("user_lesson_progress")
    .select("*")
    .eq("user_id", user.id)
    .in("lesson_id", lessonIds)

  // Fetch user profile for XP
  const { data: profile } = await supabase.from("profiles").select("total_xp").eq("id", user.id).single()

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <CourseHeader course={courseData} userXp={profile?.total_xp || 0} />
      <UnitTree
        units={courseData.units}
        lessonProgress={(lessonProgress as UserLessonProgress[]) || []}
        userXp={profile?.total_xp || 0}
        courseId={courseId}
      />
    </div>
  )
}
