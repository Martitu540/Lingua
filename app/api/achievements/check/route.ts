import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { checkAndUnlockAchievements } from "@/lib/achievements"

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { totalXP, streakCount, lessonsCompleted, mistakesCount, currentHour, hasAIChat } = body

    // Get current user stats if not provided
    let finalTotalXP = totalXP
    let finalStreakCount = streakCount
    let finalLessonsCompleted = lessonsCompleted

    if (totalXP === undefined || streakCount === undefined || lessonsCompleted === undefined) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("total_xp, streak_count")
        .eq("id", user.id)
        .single()

      if (profile) {
        finalTotalXP = finalTotalXP ?? profile.total_xp ?? 0
        finalStreakCount = finalStreakCount ?? profile.streak_count ?? 0
      }

      if (lessonsCompleted === undefined) {
        const { count } = await supabase
          .from("user_lesson_progress")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "completed")

        finalLessonsCompleted = count ?? 0
      }
    }

    const unlocked = await checkAndUnlockAchievements({
      userId: user.id,
      totalXP: finalTotalXP,
      streakCount: finalStreakCount,
      lessonsCompleted: finalLessonsCompleted,
      mistakesCount,
      currentHour: currentHour ?? new Date().getHours(),
      hasAIChat,
    })

    return NextResponse.json({ unlocked })
  } catch (error) {
    console.error("Error checking achievements:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

