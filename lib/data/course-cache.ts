import { unstable_cache } from "next/cache"
import { createPublicClient } from "@/lib/supabase/public"
import type { Course, Language, Lesson, Unit } from "@/types/database"

type CourseWithDetails = Course & {
  source_language: Language
  target_language: Language
  units: (Unit & { lessons: Lesson[] })[]
}

async function fetchCourseWithUnits(courseId: string): Promise<CourseWithDetails | null> {
  const supabase = createPublicClient()
  const { data: course, error } = await supabase
    .from("courses")
    .select(
      `
      *,
      source_language:languages!courses_source_language_id_fkey(*),
      target_language:languages!courses_target_language_id_fkey(*),
      units(*, lessons(*))
    `,
    )
    .eq("id", courseId)
    .maybeSingle()

  if (error || !course) return null

  const courseData = course as CourseWithDetails
  courseData.units = courseData.units?.sort((a, b) => a.order_index - b.order_index) || []
  courseData.units.forEach((unit) => {
    unit.lessons = unit.lessons?.sort((a, b) => a.order_index - b.order_index) || []
  })

  return courseData
}

export const getCourseWithUnitsCached = (courseId: string) =>
  unstable_cache(() => fetchCourseWithUnits(courseId), ["course-details", courseId], { revalidate: 60 * 60 })()

