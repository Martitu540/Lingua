import { createClient } from "@/lib/supabase/server"
import { DailyGoalCard } from "@/components/dashboard/daily-goal-card"
import { StreakCard } from "@/components/dashboard/streak-card"
import { CourseCard } from "@/components/dashboard/course-card"
import { QuickActions } from "@/components/dashboard/quick-actions"
import { RecentActivity } from "@/components/dashboard/recent-activity"
import type { Course, UserCourse, Language } from "@/types/database"
import { redirect } from "next/navigation"

type CourseWithLanguages = Course & {
  source_language: Language
  target_language: Language
}

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const today = new Date().toLocaleDateString("en-CA")

  const [
    { data: userCourses, error: userCoursesError },
    { data: allCourses, error: allCoursesError },
    { data: dailyGoal, error: dailyGoalError },
    { data: profile, error: profileError },
  ] = await Promise.all([
    supabase
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
      .order("last_practiced_at", { ascending: false }),
    supabase
      .from("courses")
      .select(`
        *,
        source_language:languages!courses_source_language_id_fkey(*),
        target_language:languages!courses_target_language_id_fkey(*)
      `),
    supabase.from("daily_goals").select("*").eq("user_id", user.id).eq("date", today).maybeSingle(),
    supabase.from("profiles").select("*").eq("id", user.id).maybeSingle(),
  ])

  const fetchError = userCoursesError || allCoursesError || dailyGoalError || profileError
  if (fetchError) {
    console.error("Dashboard load failed", fetchError)
    return (
      <div className="mx-auto max-w-3xl rounded-lg border border-destructive/40 bg-destructive/5 p-4 text-destructive">
        Something went wrong loading your dashboard. Please refresh the page.
      </div>
    )
  }

  type UserCourseWithCourse = UserCourse & {
    course: Course & { source_language?: Language; target_language?: Language }
  }

  const enrolledCourseIds = (userCourses ?? []).map((uc) => uc.course_id)
  const availableCourses = (allCourses ?? []).filter((c) => !enrolledCourseIds.includes(c.id))

  const enrolledCoursesWithLang = (userCourses ?? []).filter(
    (uc): uc is UserCourseWithCourse & { course: CourseWithLanguages } =>
      Boolean(uc.course?.source_language && uc.course?.target_language),
  )

  const availableCoursesWithLang = (availableCourses ?? []).filter(
    (c): c is CourseWithLanguages => Boolean(c.source_language && c.target_language),
  )

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* Welcome section */}
      <div className="animate-slide-in-left">
        <h1 className="text-2xl font-bold md:text-3xl">Welcome back, {profile?.display_name || "Learner"}!</h1>
        <p className="text-muted-foreground">Continue your language learning journey</p>
      </div>

      {/* Stats row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="animate-fade-in animation-delay-100">
          <DailyGoalCard
            goal={dailyGoal ?? null}
            userId={user?.id || ""}
            defaultXpGoal={profile?.daily_xp_goal || 50}
            defaultLessonsGoal={((profile?.settings as any)?.daily_lessons_goal as number) || 3}
          />
        </div>
        <div className="animate-fade-in animation-delay-200">
          <StreakCard streak={profile?.streak_count || 0} longestStreak={profile?.longest_streak || 0} />
        </div>
        <div className="animate-fade-in animation-delay-300">
          <QuickActions />
        </div>
      </div>

      {/* Current courses */}
      <div className="animate-fade-in animation-delay-300 space-y-3">
        <h2 className="text-xl font-semibold">Continue Learning</h2>
        {enrolledCoursesWithLang.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            You&apos;re not in a course yet. Pick one below to get started.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {enrolledCoursesWithLang.map((uc, index) => (
              <div key={uc.id} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CourseCard course={uc.course} userCourse={uc} enrolled />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Available courses */}
      <div className="animate-fade-in animation-delay-400 space-y-3">
        <h2 className="text-xl font-semibold">Start a New Course</h2>
        {availableCoursesWithLang.length === 0 ? (
          <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
            No new courses available right now. Check back soon!
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableCoursesWithLang.slice(0, 3).map((course, index) => (
              <div key={course.id} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                <CourseCard course={course} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent activity */}
      <div>
        <RecentActivity userId={user?.id || ""} />
      </div>
    </div>
  )
}
