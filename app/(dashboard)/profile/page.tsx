import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Flame, Zap, Trophy, Calendar, Target, BookOpen, Moon, Sunrise, MessageSquare, Footprints } from "lucide-react"
import type { Profile, UserAchievement, Achievement } from "@/types/database"

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  const { data: achievements } = await supabase
    .from("user_achievements")
    .select("*, achievement:achievements(*)")
    .eq("user_id", user.id)
    .order("earned_at", { ascending: false })

  const { data: allAchievements } = await supabase.from("achievements").select("*")

  // Calculate XP to next level (100 XP per level)
  const currentLevelXp = ((profile as Profile)?.total_xp || 0) % 100
  const xpToNextLevel = 100 - currentLevelXp

  // Calculate days learning
  const memberSince = new Date((profile as Profile)?.created_at || Date.now())
  const daysLearning = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24))

  const earnedAchievementIds =
    (achievements as (UserAchievement & { achievement: Achievement })[])?.map((ua) => ua.achievement_id) || []

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Profile</h1>
        <p className="text-muted-foreground">View your stats and achievements</p>
      </div>

      {/* Profile header */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-start gap-6">
            {/* Avatar */}
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 text-3xl font-bold text-primary">
              {(profile as Profile)?.display_name?.[0]?.toUpperCase() || "U"}
            </div>

            {/* Info */}
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{(profile as Profile)?.display_name || "User"}</h2>
              <p className="text-muted-foreground">{user.email}</p>

              {/* Level progress */}
              <div className="mt-4">
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-medium">Level {(profile as Profile)?.current_level || 1}</span>
                  <span className="text-muted-foreground">
                    {xpToNextLevel} XP to Level {((profile as Profile)?.current_level || 1) + 1}
                  </span>
                </div>
                <Progress value={currentLevelXp} className="h-3" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.75_0.18_55)]/10">
              <Zap className="h-6 w-6 text-[oklch(0.75_0.18_55)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{((profile as Profile)?.total_xp || 0).toLocaleString()}</p>
              <p className="text-sm text-muted-foreground">Total XP</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.7_0.2_40)]/10">
              <Flame className="h-6 w-6 text-[oklch(0.7_0.2_40)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(profile as Profile)?.streak_count || 0}</p>
              <p className="text-sm text-muted-foreground">Day Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{(profile as Profile)?.longest_streak || 0}</p>
              <p className="text-sm text-muted-foreground">Best Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="flex items-center gap-4 p-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[oklch(0.7_0.18_145)]/10">
              <Calendar className="h-6 w-6 text-[oklch(0.7_0.18_145)]" />
            </div>
            <div>
              <p className="text-2xl font-bold">{daysLearning}</p>
              <p className="text-sm text-muted-foreground">Days Learning</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5" />
            Achievements
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(allAchievements as Achievement[])?.map((achievement) => {
              const isEarned = earnedAchievementIds.includes(achievement.id)
              return (
                <div
                  key={achievement.id}
                  className={`flex items-center gap-3 rounded-lg border p-4 ${isEarned ? "border-[oklch(0.75_0.18_55)]/50 bg-[oklch(0.75_0.18_55)]/5" : "opacity-50"}`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-full ${isEarned ? "bg-[oklch(0.75_0.18_55)]/20" : "bg-muted"}`}
                  >
                    {achievement.icon === "flame" && (
                      <Flame
                        className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`}
                      />
                    )}
                    {achievement.icon === "star" && (
                      <Zap className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`} />
                    )}
                    {achievement.icon === "trophy" && (
                      <Trophy
                        className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`}
                      />
                    )}
                    {achievement.icon === "check-circle" && (
                      <Target
                        className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`}
                      />
                    )}
                    {achievement.icon === "moon" && (
                      <Moon
                        className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`}
                      />
                    )}
                    {achievement.icon === "sunrise" && (
                      <Sunrise
                        className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`}
                      />
                    )}
                    {achievement.icon === "message-square" && (
                      <MessageSquare
                        className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`}
                      />
                    )}
                    {achievement.icon === "footprints" && (
                      <Footprints
                        className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`}
                      />
                    )}
                    {!["flame", "star", "trophy", "check-circle", "moon", "sunrise", "message-square", "footprints"].includes(achievement.icon) && (
                      <BookOpen
                        className={`h-6 w-6 ${isEarned ? "text-[oklch(0.75_0.18_55)]" : "text-muted-foreground"}`}
                      />
                    )}
                  </div>
                  <div>
                    <p className="font-medium">{achievement.title}</p>
                    <p className="text-sm text-muted-foreground">{achievement.description}</p>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
