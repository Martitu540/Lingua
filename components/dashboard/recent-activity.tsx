import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/lib/supabase/server"
import { BookOpen, Trophy, Sparkles } from "lucide-react"

interface RecentActivityProps {
  userId: string
}

export async function RecentActivity({ userId }: RecentActivityProps) {
  const supabase = await createClient()

  // Fetch recent exercise history
  const { data: recentExercises } = await supabase
    .from("user_exercise_history")
    .select("*, exercise:exercises(*, lesson:lessons(title))")
    .eq("user_id", userId)
    .order("attempted_at", { ascending: false })
    .limit(5)

  // Fetch recent achievements
  const { data: recentAchievements } = await supabase
    .from("user_achievements")
    .select("*, achievement:achievements(*)")
    .eq("user_id", userId)
    .order("earned_at", { ascending: false })
    .limit(3)

  type ActivityItem = {
    type: "exercise" | "achievement"
    title: string
    subtitle: string
    timestamp: string
    icon: typeof BookOpen | typeof Trophy
    success?: boolean
  }

  const activities: ActivityItem[] = []

  if (recentExercises) {
    recentExercises.forEach((ex: Record<string, unknown>) => {
      const exercise = ex.exercise as { lesson: { title: string } } | null
      activities.push({
        type: "exercise",
        title: exercise?.lesson?.title || "Practice",
        subtitle: (ex.is_correct as boolean) ? "Answered correctly" : "Keep practicing",
        timestamp: ex.attempted_at as string,
        icon: BookOpen,
        success: ex.is_correct as boolean,
      })
    })
  }

  if (recentAchievements) {
    recentAchievements.forEach((ua: Record<string, unknown>) => {
      const achievement = ua.achievement as { title: string } | null
      activities.push({
        type: "achievement",
        title: achievement?.title || "Achievement",
        subtitle: "Achievement unlocked!",
        timestamp: ua.earned_at as string,
        icon: Trophy,
      })
    })
  }

  activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  if (activities.length === 0) {
    return (
      <Card className="border-border/50">
        <CardHeader>
          <CardTitle className="text-lg">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="font-semibold">No activity yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Start a lesson to see your progress here</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.slice(0, 5).map((activity, i) => (
            <div
              key={i}
              className="flex items-center gap-4 rounded-xl bg-muted/30 p-3 transition-colors hover:bg-muted/50"
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-xl ${
                  activity.type === "achievement" ? "bg-gold/15" : activity.success ? "bg-success/15" : "bg-muted"
                }`}
              >
                <activity.icon
                  className={`h-5 w-5 ${
                    activity.type === "achievement"
                      ? "text-gold"
                      : activity.success
                        ? "text-success"
                        : "text-muted-foreground"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{activity.title}</p>
                <p className="text-sm text-muted-foreground">{activity.subtitle}</p>
              </div>
              <span className="whitespace-nowrap text-xs text-muted-foreground">
                {formatRelativeTime(activity.timestamp)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

function formatRelativeTime(timestamp: string): string {
  const now = new Date()
  const date = new Date(timestamp)
  const diff = now.getTime() - date.getTime()

  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString()
}
