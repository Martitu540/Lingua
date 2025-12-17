import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

type LevelKey = "new" | "some" | "advanced"

function isLevelKey(value: unknown): value is LevelKey {
  return value === "new" || value === "some" || value === "advanced"
}

function clampInt(value: unknown, min: number, max: number, fallback: number) {
  const num = typeof value === "number" ? value : typeof value === "string" ? parseInt(value, 10) : NaN
  if (!Number.isFinite(num)) return fallback
  return Math.max(min, Math.min(max, Math.trunc(num)))
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as {
      courseId?: string
      level?: unknown
      dailyXpGoal?: unknown
      referralSource?: string | null
    }

    if (!body.courseId) {
      return NextResponse.json({ error: "Missing courseId" }, { status: 400 })
    }

    if (!isLevelKey(body.level)) {
      return NextResponse.json({ error: "Invalid level" }, { status: 400 })
    }

    const dailyXpGoal = clampInt(body.dailyXpGoal, 10, 200, 50)
    const referralSource =
      typeof body.referralSource === "string" && body.referralSource.trim().length > 0
        ? body.referralSource.trim()
        : null

    const { data: existingProfile } = await supabase.from("profiles").select("settings").eq("id", user.id).maybeSingle()
    const existingSettings = (existingProfile?.settings ?? {}) as Record<string, unknown>

    const onboarding = {
      completedAt: new Date().toISOString(),
      mainCourseId: body.courseId,
      level: body.level,
      dailyXpGoal,
      referralSource,
    }

    const newSettings = {
      ...existingSettings,
      onboarding,
    }

    const { error: profileUpdateError } = await supabase
      .from("profiles")
      .update({
        daily_xp_goal: dailyXpGoal,
        settings: newSettings,
      })
      .eq("id", user.id)

    if (profileUpdateError) {
      return NextResponse.json({ error: profileUpdateError.message }, { status: 500 })
    }

    // Enroll user into the chosen course if they aren't enrolled yet.
    const { data: existingCourse } = await supabase
      .from("user_courses")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", body.courseId)
      .maybeSingle()

    if (!existingCourse) {
      const { error: enrollError } = await supabase.from("user_courses").insert({
        user_id: user.id,
        course_id: body.courseId,
        started_at: new Date().toISOString(),
        last_practiced_at: new Date().toISOString(),
      })

      if (enrollError) {
        return NextResponse.json({ error: enrollError.message }, { status: 500 })
      }
    }

    // Update (or create) today's daily goal to match the new XP target.
    const today = new Date().toLocaleDateString("en-CA")
    await supabase
      .from("daily_goals")
      .upsert(
        {
          user_id: user.id,
          date: today,
          xp_goal: dailyXpGoal,
          lessons_goal: 3,
          xp_earned: 0,
          lessons_completed: 0,
        },
        { onConflict: "user_id,date" },
      )

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("Onboarding completion failed:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to complete onboarding" },
      { status: 500 },
    )
  }
}
