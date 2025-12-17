import { createClient } from "@/lib/supabase/server"
import { redirect, notFound } from "next/navigation"
import { UnitTree } from "@/components/learning/unit-tree"
import { CourseHeader } from "@/components/learning/course-header"
import type { Course, Unit, Lesson, UserLessonProgress, Language } from "@/types/database"
import { getCourseWithUnitsCached } from "@/lib/data/course-cache"

export default async function CoursePage({ params }: { params: Promise<{ courseId: string }> }) {
  const { courseId } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const courseData = await getCourseWithUnitsCached(courseId)
  if (!courseData) {
    notFound()
  }

  // Enroll (if needed) and record activity in a single query.
  await supabase.from("user_courses").upsert(
    {
      user_id: user.id,
      course_id: courseId,
      last_practiced_at: new Date().toISOString(),
    },
    { onConflict: "user_id,course_id" },
  )

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
