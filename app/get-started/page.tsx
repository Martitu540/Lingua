import type { Course, Language } from "@/types/database"
import { createClient } from "@/lib/supabase/server"
import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard"
import { redirect } from "next/navigation"

type CourseWithLanguages = Course & {
  source_language: Language
  target_language: Language
}

export default async function GetStartedPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Only show this wizard before registration (Duolingo-style).
  // If already logged in, send them to the real app (or onboarding if needed).
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("settings").eq("id", user.id).maybeSingle()
    const completedAt = (profile?.settings as any)?.onboarding?.completedAt
    if (typeof completedAt === "string" && completedAt.length > 0) {
      redirect("/dashboard")
    }
    redirect("/onboarding")
  }

  const { data: courses } = await supabase.from("courses").select(`
      *,
      source_language:languages!courses_source_language_id_fkey(*),
      target_language:languages!courses_target_language_id_fkey(*)
    `)

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
        <OnboardingWizard initialDailyXpGoal={50} courseOptions={options} mode="public" enableDraftAutofill />
      </div>
    </div>
  )
}
