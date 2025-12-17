import { createClient } from "@/lib/supabase/server"
import { AdminAnalytics } from "@/components/admin/admin-analytics"

export default async function AdminAnalyticsPage() {
  const supabase = await createClient()

  // Fetch all users
  const { data: users } = await supabase
    .from("profiles")
    .select("id, display_name, total_xp, current_level, streak_count, hearts, created_at, is_premium")
    .order("total_xp", { ascending: false })

  // Fetch user courses
  const { data: userCourses } = await supabase.from("user_courses").select("*")

  // Fetch daily goals
  const { data: dailyGoals } = await supabase.from("daily_goals").select("*")

  // Fetch courses
  const { data: courses } = await supabase.from("courses").select("*")

  // Fetch lessons
  const { data: lessons } = await supabase.from("lessons").select("*")

  // Fetch exercises
  const { data: exercises } = await supabase.from("exercises").select("*")

  return (
    <AdminAnalytics
      users={users ?? []}
      userCourses={userCourses ?? []}
      dailyGoals={dailyGoals ?? []}
      courses={courses ?? []}
      lessons={lessons ?? []}
      exercises={exercises ?? []}
    />
  )
}

