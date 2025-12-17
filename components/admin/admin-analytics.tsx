"use client"

import { useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, Users, BookOpen, Target, Flame, Zap, DollarSign, Activity } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, AreaChart, Area } from "recharts"

interface AnalyticsData {
  users: any[]
  userCourses: any[]
  dailyGoals: any[]
  courses: any[]
  lessons: any[]
  exercises: any[]
}

export function AdminAnalytics({ users, userCourses, dailyGoals, courses, lessons, exercises }: AnalyticsData) {
  // User growth over time
  const userGrowth = useMemo(() => {
    const growth: Record<string, number> = {}
    users.forEach((user) => {
      const date = new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      growth[date] = (growth[date] || 0) + 1
    })
    return Object.entries(growth)
      .map(([date, count]) => ({ date, users: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  }, [users])

  // XP distribution
  const xpDistribution = useMemo(() => {
    const ranges = [
      { range: "0-100", min: 0, max: 100 },
      { range: "101-500", min: 101, max: 500 },
      { range: "501-1000", min: 501, max: 1000 },
      { range: "1001-5000", min: 1001, max: 5000 },
      { range: "5000+", min: 5001, max: Infinity },
    ]
    return ranges.map((r) => ({
      range: r.range,
      count: users.filter((u) => u.total_xp >= r.min && u.total_xp <= r.max).length,
    }))
  }, [users])

  // Course popularity
  const coursePopularity = useMemo(() => {
    const popularity: Record<string, number> = {}
    userCourses.forEach((uc) => {
      const course = courses.find((c) => c.id === uc.course_id)
      if (course) {
        popularity[course.title] = (popularity[course.title] || 0) + 1
      }
    })
    return Object.entries(popularity)
      .map(([name, count]) => ({ name, students: count }))
      .sort((a, b) => b.students - a.students)
      .slice(0, 10)
  }, [userCourses, courses])

  // Daily activity
  const dailyActivity = useMemo(() => {
    const activity: Record<string, number> = {}
    dailyGoals.forEach((goal) => {
      const date = new Date(goal.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      activity[date] = (activity[date] || 0) + (goal.xp_earned || 0)
    })
    return Object.entries(activity)
      .map(([date, xp]) => ({ date, xp }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
  }, [dailyGoals])

  // Key metrics
  const totalUsers = users.length
  const activeUsers = users.filter((u) => {
    const lastActive = u.last_active_at ? new Date(u.last_active_at) : new Date(u.created_at)
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceActive <= 30
  }).length
  const totalXp = users.reduce((sum, u) => sum + (u.total_xp || 0), 0)
  const avgLevel = users.length > 0 ? users.reduce((sum, u) => sum + (u.current_level || 1), 0) / users.length : 0
  const premiumUsers = users.filter((u) => u.is_premium).length
  const avgStreak = users.length > 0 ? users.reduce((sum, u) => sum + (u.streak_count || 0), 0) / users.length : 0
  const totalLessons = lessons.length
  const totalExercises = exercises.length

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
        <p className="text-muted-foreground">Comprehensive insights into your learning platform</p>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalUsers}</div>
            <p className="text-xs text-muted-foreground">{activeUsers} active (30 days)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total XP</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalXp.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Avg level: {avgLevel.toFixed(1)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Premium Users</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{premiumUsers}</div>
            <p className="text-xs text-muted-foreground">{((premiumUsers / totalUsers) * 100).toFixed(1)}% conversion</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Streak</CardTitle>
            <Flame className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgStreak.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">days</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">User Growth</TabsTrigger>
          <TabsTrigger value="xp">XP Distribution</TabsTrigger>
          <TabsTrigger value="courses">Course Popularity</TabsTrigger>
          <TabsTrigger value="activity">Daily Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <Card className="border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">User Growth Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorUsersGrowth" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(262, 83%, 58%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="users" 
                    stroke="hsl(262, 83%, 58%)" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorUsersGrowth)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="xp" className="space-y-4">
          <Card className="border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">XP Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={xpDistribution} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis 
                    dataKey="range" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="count" 
                    fill="url(#colorXP)" 
                    radius={[4, 4, 0, 0]}
                    animationDuration={600}
                    maxBarSize={60}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="courses" className="space-y-4">
          <Card className="border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Most Popular Courses</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={coursePopularity} layout="vertical" margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorCourses" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="5%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(38, 92%, 50%)" stopOpacity={0.2}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis 
                    type="number" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px'
                    }}
                  />
                  <Bar 
                    dataKey="students" 
                    fill="url(#colorCourses)" 
                    radius={[0, 4, 4, 0]}
                    animationDuration={600}
                    maxBarSize={50}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity" className="space-y-4">
          <Card className="border shadow-md">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">Daily Activity (Last 30 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={320}>
                <AreaChart data={dailyActivity} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.2} />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    tickLine={{ stroke: 'hsl(var(--border))' }}
                    width={60}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '6px',
                      padding: '6px 10px',
                      fontSize: '12px'
                    }}
                    formatter={(value: number) => [value.toLocaleString(), "XP"]}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="xp" 
                    stroke="hsl(142, 76%, 36%)" 
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#colorActivity)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Content Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Courses</span>
                <span className="font-semibold">{courses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Lessons</span>
                <span className="font-semibold">{totalLessons}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Exercises</span>
                <span className="font-semibold">{totalExercises}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Engagement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Enrollments</span>
                <span className="font-semibold">{userCourses.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Daily Goals Set</span>
                <span className="font-semibold">{dailyGoals.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Active Rate</span>
                <span className="font-semibold">{((activeUsers / totalUsers) * 100).toFixed(1)}%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">New Users (30d)</span>
                <span className="font-semibold">
                  {users.filter((u) => {
                    const created = new Date(u.created_at)
                    const daysAgo = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
                    return daysAgo <= 30
                  }).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">XP Growth (30d)</span>
                <span className="font-semibold">
                  {dailyGoals
                    .filter((g) => {
                      const date = new Date(g.date)
                      const daysAgo = (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
                      return daysAgo <= 30
                    })
                    .reduce((sum, g) => sum + (g.xp_earned || 0), 0)
                    .toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Retention</span>
                <span className="font-semibold">
                  {users.length > 0
                    ? (
                        (users.filter((u) => {
                          const lastActive = u.last_active_at ? new Date(u.last_active_at) : new Date(u.created_at)
                          const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
                          return daysSinceActive <= 7
                        }).length /
                          users.length) *
                        100
                      ).toFixed(1)
                    : 0}
                  %
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

