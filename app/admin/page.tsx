import { createClient } from "@/lib/supabase/server"
import { AdminDashboardFull } from "@/components/admin/admin-dashboard-full"

export default async function AdminPage() {
  const supabase = await createClient()

  const { data: courses } = await supabase
    .from("courses")
    .select("*")
    .order("created_at", { ascending: true })

  const { data: units } = await supabase
    .from("units")
    .select("*")
    .order("order_index", { ascending: true })

  const { data: lessons } = await supabase
    .from("lessons")
    .select("*")
    .order("order_index", { ascending: true })

  const { data: exercises } = await supabase
    .from("exercises")
    .select("*")
    .order("order_index", { ascending: true })

  const { data: users } = await supabase
    .from("profiles")
    .select("id, display_name, email, total_xp, current_level, streak_count, hearts, created_at, last_active_at")
    .order("total_xp", { ascending: false })
    .limit(100)

  // Fetch payments for revenue tracking - use service role for admin access
  // This is a fallback if Stripe API doesn't work
  const { data: payments, error: paymentsError } = await supabase
    .from("payments")
    .select("amount, type, status, created_at")
    .eq("status", "succeeded")
    .order("created_at", { ascending: false })
    .limit(100)

  if (paymentsError) {
    console.error("Error fetching payments from database:", paymentsError)
  }

  // Fetch user courses for analytics
  const { data: userCourses } = await supabase.from("user_courses").select("*")

  // Fetch daily goals for activity tracking
  const { data: dailyGoals } = await supabase.from("daily_goals").select("*").order("date", { ascending: false }).limit(100)

  return (
    <AdminDashboardFull
      courses={courses ?? []}
      units={units ?? []}
      lessons={lessons ?? []}
      exercises={exercises ?? []}
      users={users ?? []}
      payments={payments ?? []}
      userCourses={userCourses ?? []}
      dailyGoals={dailyGoals ?? []}
    />
  )
}

