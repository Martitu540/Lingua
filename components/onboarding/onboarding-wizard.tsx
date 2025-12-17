"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import type { Course, Language } from "@/types/database"
import { ArrowRight, Check, Compass, Target, Zap } from "lucide-react"
import { toast } from "@/hooks/use-toast"

type CourseWithLanguages = Course & {
  source_language: Language
  target_language: Language
}

type LevelKey = "new" | "some" | "advanced"

const ONBOARDING_DRAFT_KEY = "linguaflow:onboardingDraft"

const levelOptions: Array<{
  key: LevelKey
  title: string
  description: string
}> = [
  { key: "new", title: "I’m new", description: "Start from the basics" },
  { key: "some", title: "I know some", description: "A few words and phrases" },
  { key: "advanced", title: "I’m advanced", description: "Jump into harder lessons" },
]

const goalOptions: Array<{
  xpGoal: number
  label: string
  caption: string
}> = [
  { xpGoal: 20, label: "Casual", caption: "~5 min/day" },
  { xpGoal: 35, label: "Regular", caption: "~10 min/day" },
  { xpGoal: 50, label: "Serious", caption: "~15 min/day" },
  { xpGoal: 80, label: "Intense", caption: "~25 min/day" },
]

const referralOptions = ["TikTok", "Instagram", "YouTube", "Friend", "Search", "Other"] as const

type OnboardingDraft = {
  courseId: string
  level: LevelKey
  dailyXpGoal: number
  referralSource: string | null
}

function readDraft(): OnboardingDraft | null {
  try {
    const raw = window.localStorage.getItem(ONBOARDING_DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as Partial<OnboardingDraft>
    if (!parsed.courseId || !parsed.level || typeof parsed.dailyXpGoal !== "number") return null
    return {
      courseId: parsed.courseId,
      level: parsed.level,
      dailyXpGoal: parsed.dailyXpGoal,
      referralSource: typeof parsed.referralSource === "string" ? parsed.referralSource : null,
    }
  } catch {
    return null
  }
}

function writeDraft(draft: OnboardingDraft) {
  try {
    window.localStorage.setItem(ONBOARDING_DRAFT_KEY, JSON.stringify(draft))
  } catch {}
}

function clearDraft() {
  try {
    window.localStorage.removeItem(ONBOARDING_DRAFT_KEY)
  } catch {}
}

function ProgressPill({ step, total }: { step: number; total: number }) {
  const pct = Math.round((step / total) * 100)
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          Question {step} / {total}
        </span>
        <span>{pct}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-border/60">
        <div
          className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-primary transition-[width] duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

export function OnboardingWizard({
  courseOptions,
  initialDailyXpGoal,
  mode = "authenticated",
  enableDraftAutofill = true,
}: {
  courseOptions: CourseWithLanguages[]
  initialDailyXpGoal: number
  mode?: "authenticated" | "public"
  enableDraftAutofill?: boolean
}) {
  const router = useRouter()
  const totalSteps = 4

  const [step, setStep] = useState(1)
  const [courseId, setCourseId] = useState<string | null>(null)
  const [level, setLevel] = useState<LevelKey | null>(null)
  const [xpGoal, setXpGoal] = useState<number>(initialDailyXpGoal)
  const [referral, setReferral] = useState<string>("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!enableDraftAutofill) return
    const draft = readDraft()
    if (!draft) return
    setCourseId(draft.courseId)
    setLevel(draft.level)
    setXpGoal(draft.dailyXpGoal)
    setReferral(draft.referralSource ?? "")
  }, [enableDraftAutofill])

  const selectedCourse = useMemo(
    () => courseOptions.find((c) => c.id === courseId) ?? null,
    [courseOptions, courseId],
  )

  const canContinue =
    (step === 1 && Boolean(courseId)) ||
    (step === 2 && Boolean(level)) ||
    (step === 3 && Boolean(xpGoal)) ||
    step === 4

  const submitAuthenticated = async () => {
    if (!courseId || !level) return
    setSaving(true)
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          level,
          dailyXpGoal: xpGoal,
          referralSource: referral || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || "Failed to save onboarding")
      }

      clearDraft()
      toast({ title: "You’re all set!", description: "Let’s start your first lesson." })
      router.replace(`/learn/${courseId}`)
      router.refresh()
    } catch (e) {
      toast({
        title: "Couldn’t save your choices",
        description: e instanceof Error ? e.message : "Please try again.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const goNext = async () => {
    if (!canContinue) return
    if (step < totalSteps) {
      setStep((s) => s + 1)
      return
    }

    if (!courseId || !level) return

    if (mode === "public") {
      writeDraft({
        courseId,
        level,
        dailyXpGoal: xpGoal,
        referralSource: referral || null,
      })
      router.push("/auth/sign-up")
      return
    }

    await submitAuthenticated()
  }

  useEffect(() => {
    if (mode !== "authenticated") return
    const params = new URLSearchParams(window.location.search)
    if (params.get("auto") !== "1") return
    const draft = readDraft()
    if (!draft) return
    // If a draft exists and we're authenticated, apply and submit immediately.
    setCourseId(draft.courseId)
    setLevel(draft.level)
    setXpGoal(draft.dailyXpGoal)
    setReferral(draft.referralSource ?? "")
    // Delay one tick to ensure state is applied before submission.
    setTimeout(() => {
      submitAuthenticated()
    }, 0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode])

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-xl">
        <ProgressPill step={step} total={totalSteps} />
      </div>

      <Card className="mx-auto max-w-3xl overflow-hidden border-2 border-border/50 shadow-xl">
        <div className="relative border-b bg-gradient-to-r from-primary/8 to-accent/8 p-6">
          <div className="pointer-events-none absolute inset-0 opacity-60">
            <div className="absolute -left-24 -top-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl" />
            <div className="absolute -bottom-24 -right-24 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
          </div>

          {step === 1 && (
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Compass className="h-4 w-4" />
                Pick your main language
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">What do you want to learn?</h1>
              <p className="text-sm text-muted-foreground">
                You can add more later, but let’s start with one course.
              </p>
            </div>
          )}

          {step === 2 && (
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Check className="h-4 w-4" />
                Set your level
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">
                How much do you know{selectedCourse?.target_language?.name ? ` in ${selectedCourse.target_language.name}` : ""}?
              </h1>
              <p className="text-sm text-muted-foreground">This helps us start you at the right pace.</p>
            </div>
          )}

          {step === 3 && (
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Target className="h-4 w-4" />
                Choose a daily goal
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">How much can you study per day?</h1>
              <p className="text-sm text-muted-foreground">You can change this anytime in Settings.</p>
            </div>
          )}

          {step === 4 && (
            <div className="relative space-y-2">
              <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                <Zap className="h-4 w-4" />
                One last thing
              </div>
              <h1 className="text-2xl font-extrabold tracking-tight md:text-3xl">Where did you find this app?</h1>
              <p className="text-sm text-muted-foreground">Optional, but it helps us improve.</p>
            </div>
          )}
        </div>

        <div className="p-6">
          {step === 1 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {courseOptions.map((course) => {
                const active = courseId === course.id
                return (
                  <button
                    key={course.id}
                    type="button"
                    onClick={() => setCourseId(course.id)}
                    className={cn(
                      "group flex items-center justify-between rounded-2xl border-2 p-4 text-left transition-all",
                      "bg-card/70 hover:bg-card shadow-sm hover:shadow-md",
                      active ? "border-primary ring-2 ring-primary/25" : "border-border/60 hover:border-primary/50",
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={cn(
                          "flex h-12 w-12 items-center justify-center rounded-2xl text-2xl shadow-inner",
                          active ? "bg-primary/15" : "bg-muted/60 group-hover:bg-primary/10",
                        )}
                      >
                        <span aria-hidden>{course.target_language?.flag_emoji || "🌍"}</span>
                      </div>
                      <div>
                        <div className="font-bold">{course.target_language?.name || course.title}</div>
                        <div className="text-xs text-muted-foreground">{course.title}</div>
                      </div>
                    </div>
                    <div
                      className={cn(
                        "flex h-9 w-9 items-center justify-center rounded-full border transition-all",
                        active ? "border-primary bg-primary text-primary-foreground" : "border-border/70",
                      )}
                    >
                      <ArrowRight className={cn("h-4 w-4 transition-transform", active && "translate-x-0.5")} />
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {step === 2 && (
            <div className="grid gap-3">
              {levelOptions.map((opt) => {
                const active = level === opt.key
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setLevel(opt.key)}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-left transition-all",
                      active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60 hover:border-primary/50 hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{opt.title}</div>
                        <div className="text-sm text-muted-foreground">{opt.description}</div>
                      </div>
                      <div
                        className={cn(
                          "mt-0.5 flex h-6 w-6 items-center justify-center rounded-full border",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border/70",
                        )}
                      >
                        {active ? <Check className="h-4 w-4" /> : null}
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {step === 3 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {goalOptions.map((opt) => {
                const active = xpGoal === opt.xpGoal
                return (
                  <button
                    key={opt.xpGoal}
                    type="button"
                    onClick={() => setXpGoal(opt.xpGoal)}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-left transition-all",
                      active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60 hover:border-primary/50 hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold">{opt.label}</div>
                        <div className="text-sm text-muted-foreground">{opt.caption}</div>
                      </div>
                      <div className="rounded-xl bg-xp/15 px-2 py-1 text-xs font-bold text-xp tabular-nums">
                        {opt.xpGoal} XP
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          )}

          {step === 4 && (
            <div className="grid gap-3 sm:grid-cols-2">
              {referralOptions.map((opt) => {
                const active = referral === opt
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setReferral(opt)}
                    className={cn(
                      "rounded-2xl border-2 p-4 text-left transition-all",
                      active ? "border-primary bg-primary/5 ring-2 ring-primary/20" : "border-border/60 hover:border-primary/50 hover:bg-muted/30",
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-bold">{opt}</div>
                      <div
                        className={cn(
                          "flex h-6 w-6 items-center justify-center rounded-full border",
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border/70",
                        )}
                      >
                        {active ? <Check className="h-4 w-4" /> : null}
                      </div>
                    </div>
                  </button>
                )
              })}

              <button
                type="button"
                onClick={() => setReferral("")}
                className={cn(
                  "rounded-2xl border-2 p-4 text-left transition-all sm:col-span-2",
                  referral === "" ? "border-border/60 bg-muted/20" : "border-dashed border-border/60 hover:bg-muted/20",
                )}
              >
                <div className="text-sm text-muted-foreground">Skip for now</div>
              </button>
            </div>
          )}

          <div className="mt-6 flex items-center justify-end gap-3">
            <Button onClick={goNext} disabled={!canContinue || saving} className="gap-2">
              {step === totalSteps
                ? saving
                  ? mode === "public"
                    ? "Opening sign up..."
                    : "Saving..."
                  : mode === "public"
                    ? "Create account"
                    : "Start learning"
                : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
