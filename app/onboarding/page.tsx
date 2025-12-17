import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import type { Course, Language } from "@/types/database"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"

type CourseWithLanguages = Course & {
  source_language: Language
  target_language: Language
}

function isOnboardingComplete(profile: any) {
  const completedAt = profile?.settings?.onboarding?.completedAt
  return typeof completedAt === "string" && completedAt.length > 0
}

export default async function OnboardingPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const [{ data: profile }, { data: courses }] = await Promise.all([
    supabase.from("profiles").select("id, settings, daily_xp_goal").eq("id", user.id).maybeSingle(),
    supabase.from("courses").select(`
      *,
      source_language:languages!courses_source_language_id_fkey(*),
      target_language:languages!courses_target_language_id_fkey(*)
    `),
  ])

  if (profile && isOnboardingComplete(profile)) {
    redirect("/dashboard")
  }

  const availableCourses = (courses ?? []) as CourseWithLanguages[]
  const uniqueTargets = new Map<string, CourseWithLanguages>()
  for (const course of availableCourses) {
    const targetId = course.target_language?.id
    if (!targetId) continue
    if (!uniqueTargets.has(targetId)) uniqueTargets.set(targetId, course)
  }

  const options = Array.from(uniqueTargets.values()).sort((a, b) =>
    (a.target_language?.name || "").localeCompare(b.target_language?.name || ""),
  )

  return (
    <div className="min-h-svh bg-muted/30">
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/4 top-0 h-[520px] w-[520px] rounded-full bg-primary/10 blur-[140px]" />
        <div className="absolute bottom-0 right-1/4 h-[420px] w-[420px] rounded-full bg-accent/10 blur-[140px]" />
      </div>

      <div className="mx-auto max-w-3xl px-4 py-10">
        <OnboardingWizard
          initialDailyXpGoal={profile?.daily_xp_goal ?? 50}
          courseOptions={options}
        />
      </div>
    </div>
  )
}

