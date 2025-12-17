import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Course, Language, UserCourse } from "@/types/database"
import { CourseCard } from "@/components/dashboard/course-card"

interface CourseWithLanguages extends Course {
  source_language: Language
  target_language: Language
}

export default async function LearnPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("settings").eq("id", user.id).maybeSingle()
  const mainCourseId = (profile?.settings as any)?.onboarding?.mainCourseId
  if (typeof mainCourseId === "string" && mainCourseId.length > 0) {
    redirect(`/learn/${mainCourseId}`)
  }

  // Fetch user's enrolled courses
  const { data: userCourses } = await supabase
    .from("user_courses")
    .select(`
      *,
      course:courses(
        *,
        source_language:languages!courses_source_language_id_fkey(*),
        target_language:languages!courses_target_language_id_fkey(*)
      )
    `)
    .eq("user_id", user.id)
    .order("last_practiced_at", { ascending: false })

  // Fetch all available courses
  const { data: allCourses } = await supabase.from("courses").select(`
      *,
      source_language:languages!courses_source_language_id_fkey(*),
      target_language:languages!courses_target_language_id_fkey(*)
    `)

  const enrolledCourseIds =
    (userCourses as (UserCourse & { course: CourseWithLanguages })[])?.map((uc) => uc.course_id) || []
  const availableCourses = (allCourses as CourseWithLanguages[])?.filter((c) => !enrolledCourseIds.includes(c.id)) || []

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Learn</h1>
        <p className="text-muted-foreground">Continue your courses or start a new one</p>
      </div>

      {/* Enrolled courses */}
      {userCourses && userCourses.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Your Courses</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {(userCourses as (UserCourse & { course: CourseWithLanguages })[]).map((uc) => (
              <CourseCard key={uc.id} course={uc.course} userCourse={uc} enrolled />
            ))}
          </div>
        </section>
      )}

      {/* Available courses */}
      {availableCourses.length > 0 && (
        <section>
          <h2 className="mb-4 text-xl font-semibold">Explore New Languages</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableCourses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!userCourses || userCourses.length === 0) && availableCourses.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <p className="text-lg font-medium">No courses available yet</p>
          <p className="text-muted-foreground">Check back soon for new languages!</p>
        </div>
      )}
    </div>
  )
}
