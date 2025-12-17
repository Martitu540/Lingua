import { createClient } from "@/lib/supabase/server"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Medal, Flame, Zap } from "lucide-react"

export default async function LeaderboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Fetch top users by XP
  const { data: topByXp } = await supabase
    .from("profiles")
    .select("id, display_name, total_xp, current_level, streak_count")
    .order("total_xp", { ascending: false })
    .limit(20)

  // Fetch top users by streak
  const { data: topByStreak } = await supabase
    .from("profiles")
    .select("id, display_name, total_xp, current_level, streak_count")
    .order("streak_count", { ascending: false })
    .limit(20)

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />
    if (index === 2) return <Medal className="h-5 w-5 text-amber-600" />
    return <span className="w-5 text-center font-medium text-muted-foreground">{index + 1}</span>
  }

  type Profile = {
    id: string
    display_name: string
    total_xp: number
    current_level: number
    streak_count: number
  }

  const LeaderboardList = ({ users, metric }: { users: Profile[] | null; metric: "xp" | "streak" }) => (
    <div className="space-y-2">
      {users?.map((profile, index) => (
        <div
          key={profile.id}
          className={`flex items-center gap-4 rounded-lg border p-4 ${profile.id === user?.id ? "border-primary bg-primary/5" : ""}`}
        >
          {/* Rank */}
          <div className="flex w-8 items-center justify-center">{getRankIcon(index)}</div>

          {/* Avatar */}
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">
            {profile.display_name?.[0]?.toUpperCase() || "U"}
          </div>

          {/* Info */}
          <div className="flex-1">
            <p className="font-medium">{profile.display_name || "Anonymous"}</p>
            <p className="text-sm text-muted-foreground">Level {profile.current_level}</p>
          </div>

          {/* Stat */}
          <div className="flex items-center gap-2">
            {metric === "xp" ? (
              <>
                <Zap className="h-5 w-5 text-[oklch(0.75_0.18_55)]" />
                <span className="font-bold text-[oklch(0.75_0.18_55)]">{profile.total_xp.toLocaleString()}</span>
              </>
            ) : (
              <>
                <Flame className="h-5 w-5 text-[oklch(0.7_0.2_40)]" />
                <span className="font-bold text-[oklch(0.7_0.2_40)]">{profile.streak_count}</span>
              </>
            )}
          </div>
        </div>
      ))}

      {(!users || users.length === 0) && (
        <div className="py-12 text-center text-muted-foreground">No users to display yet</div>
      )}
    </div>
  )

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Leaderboard</h1>
        <p className="text-muted-foreground">See how you rank against other learners</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Top Learners</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="xp">
            <TabsList className="mb-4">
              <TabsTrigger value="xp" className="gap-2">
                <Zap className="h-4 w-4" />
                By XP
              </TabsTrigger>
              <TabsTrigger value="streak" className="gap-2">
                <Flame className="h-4 w-4" />
                By Streak
              </TabsTrigger>
            </TabsList>
            <TabsContent value="xp">
              <LeaderboardList users={topByXp as Profile[]} metric="xp" />
            </TabsContent>
            <TabsContent value="streak">
              <LeaderboardList users={topByStreak as Profile[]} metric="streak" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
