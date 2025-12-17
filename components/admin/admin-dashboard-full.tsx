"use client"

import { useMemo, useEffect, useState } from "react"
import type { Database } from "@/types/database"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Sparkles, Users, DollarSign, TrendingUp, Heart, Gift, BarChart3, Activity, RefreshCw } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, ReferenceLine } from "recharts"
import Link from "next/link"
import { Button } from "@/components/ui/button"

type Course = Database["public"]["Tables"]["courses"]["Row"]
type Unit = Database["public"]["Tables"]["units"]["Row"]
type Lesson = Database["public"]["Tables"]["lessons"]["Row"]
type Exercise = Database["public"]["Tables"]["exercises"]["Row"]
type Profile = Database["public"]["Tables"]["profiles"]["Row"]

interface Payment {
  amount: number
  type: string
  status: string
  created_at?: string
  created?: string
}

interface AdminDashboardFullProps {
  courses: Course[]
  units: Unit[]
  lessons: Lesson[]
  exercises: Exercise[]
  users: Profile[]
  payments: Payment[]
  userCourses: any[]
  dailyGoals: any[]
}

const COLORS = [
  "hsl(262, 83%, 58%)", // Primary purple
  "hsl(142, 76%, 36%)", // Success green
  "hsl(38, 92%, 50%)", // Gold
  "hsl(0, 84%, 60%)", // Hearts red
  "hsl(217, 91%, 60%)", // Blue
]

export function AdminDashboardFull({
  courses,
  units,
  lessons,
  exercises,
  users,
  payments: initialPayments,
  userCourses,
  dailyGoals,
}: AdminDashboardFullProps) {
  const [payments, setPayments] = useState(initialPayments)
  const [loadingPayments, setLoadingPayments] = useState(false)

  // Fetch payments from Stripe
  useEffect(() => {
    const fetchStripePayments = async () => {
      setLoadingPayments(true)
      try {
        const response = await fetch("/api/admin/stripe-payments")
        const data = await response.json()
        
        if (response.ok && data.payments) {
          console.log(`✅ Fetched ${data.payments.length} payments from ${data.source || 'unknown'}`)
          if (data.payments.length > 0) {
            setPayments(data.payments)
          }
          // If no payments from API but we have initial payments, keep them
        } else {
          console.warn("⚠️ API response not OK, using initial payments:", data.error || "Unknown error")
        }
      } catch (error) {
        console.error("❌ Error fetching Stripe payments:", error)
        // Keep using initial payments from database
      } finally {
        setLoadingPayments(false)
      }
    }
    fetchStripePayments()
  }, [])
  // Revenue calculations
  const revenue = useMemo(() => {
    const total = payments.reduce((sum, p) => {
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount || 0)
      return sum + amount
    }, 0)
    const donations = payments
      .filter((p) => p.type === "donation")
      .reduce((sum, p) => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount || 0)
        return sum + amount
      }, 0)
    const hearts = payments
      .filter((p) => p.type === "hearts")
      .reduce((sum, p) => {
        const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount || 0)
        return sum + amount
      }, 0)
    return { total, donations, hearts }
  }, [payments])

  // Revenue over time
  const revenueChart = useMemo(() => {
    const revenueByDate: Record<string, number> = {}
    payments.forEach((p) => {
      const dateStr = (p as any).created || p.created_at
      const date = new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" })
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount || 0)
      revenueByDate[date] = (revenueByDate[date] || 0) + amount
    })
    const chartData = Object.entries(revenueByDate)
      .map(([date, amount]) => ({ date, revenue: amount }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30)
    
    // If no data, return empty array with a placeholder
    if (chartData.length === 0) {
      return [{ date: "No data", revenue: 0 }]
    }
    return chartData
  }, [payments])

  const revenueAverage = useMemo(() => {
    if (!revenueChart.length) return 0
    const total = revenueChart.reduce((sum, point) => sum + (point.revenue || 0), 0)
    return total / revenueChart.length
  }, [revenueChart])

  // Payment types distribution
  const paymentTypes = useMemo(() => {
    const types: Record<string, number> = {}
    payments.forEach((p) => {
      const amount = typeof p.amount === 'string' ? parseFloat(p.amount) : Number(p.amount || 0)
      types[p.type] = (types[p.type] || 0) + amount
    })
    const data = Object.entries(types).map(([name, value]) => ({ name, value }))
    // If no data, return placeholder
    if (data.length === 0) {
      return [{ name: "No payments", value: 0 }]
    }
    return data
  }, [payments])

  // User growth
  const userGrowth = useMemo(() => {
    const growth: Record<string, number> = {}
    users.forEach((user) => {
      const date = new Date(user.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })
      growth[date] = (growth[date] || 0) + 1
    })
    return Object.entries(growth)
      .map(([date, count]) => ({ date, users: count }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-12)
  }, [users])

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

  const dailyAverage = useMemo(() => {
    if (!dailyActivity.length) return 0
    const total = dailyActivity.reduce((sum, point) => sum + (point.xp || 0), 0)
    return total / dailyActivity.length
  }, [dailyActivity])

  const totalUsers = users.length
  const activeUsers = users.filter((u) => {
    const lastActive = u.last_active_at ? new Date(u.last_active_at) : new Date(u.created_at)
    const daysSinceActive = (Date.now() - lastActive.getTime()) / (1000 * 60 * 60 * 24)
    return daysSinceActive <= 30
  }).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your platform</p>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${revenue.total.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              {payments.length} transaction{payments.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{totalUsers}</p>
            <p className="text-sm text-muted-foreground">{activeUsers} active (30d)</p>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Donations</CardTitle>
            <Gift className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${revenue.donations.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              {payments.filter((p) => p.type === "donation").length} donations
            </p>
          </CardContent>
        </Card>
        <Card className="card-interactive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Hearts Sales</CardTitle>
            <Heart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">${revenue.hearts.toFixed(2)}</p>
            <p className="text-sm text-muted-foreground">
              {payments.filter((p) => p.type === "hearts").length} purchases
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-base font-semibold">
                <TrendingUp className="h-4 w-4 text-primary" />
                Revenue Over Time
              </CardTitle>
              {loadingPayments && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={revenueChart} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                  tickFormatter={(value) => `$${value}`}
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
                  formatter={(value: number) => [`$${value.toFixed(2)}`, "Revenue"]}
                />
                <ReferenceLine
                  y={revenueAverage}
                  stroke="hsl(217, 91%, 60%)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg $${revenueAverage.toFixed(0)}`,
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                    position: "left",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(262, 83%, 58%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <BarChart3 className="h-4 w-4 text-accent" />
              Payment Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie
                  data={paymentTypes.filter(p => p.value > 0)}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => 
                    percent > 0.05 ? `${(percent * 100).toFixed(0)}%` : ''
                  }
                  outerRadius={85}
                  innerRadius={40}
                  fill="#8884d8"
                  dataKey="value"
                  animationDuration={600}
                >
                  {paymentTypes.filter(p => p.value > 0).map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={COLORS[index % COLORS.length]}
                      stroke="hsl(var(--background))"
                      strokeWidth={1.5}
                    />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    padding: '6px 10px',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [`$${value.toFixed(2)}`, ""]}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 flex flex-wrap gap-3 justify-center">
              {paymentTypes.filter(p => p.value > 0).map((entry, index) => (
                <div key={entry.name} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-xs text-muted-foreground capitalize">{entry.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Users className="h-4 w-4 text-success" />
              User Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={userGrowth} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="hsl(142, 76%, 36%)" stopOpacity={0.2}/>
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
                <Bar 
                  dataKey="users" 
                  fill="url(#colorUsers)" 
                  radius={[4, 4, 0, 0]}
                  animationDuration={600}
                  maxBarSize={60}
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border shadow-md hover:shadow-lg transition-shadow bg-gradient-to-br from-card to-muted/30">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-semibold">
              <Activity className="h-4 w-4 text-hearts" />
              Daily Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={dailyActivity} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <defs>
                  <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(0, 84%, 60%)" stopOpacity={0}/>
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
                <ReferenceLine
                  y={dailyAverage}
                  stroke="hsl(217, 91%, 60%)"
                  strokeDasharray="4 4"
                  label={{
                    value: `Avg ${dailyAverage.toFixed(0)} XP`,
                    fill: "hsl(var(--muted-foreground))",
                    fontSize: 11,
                    position: "left",
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="xp" 
                  stroke="hsl(0, 84%, 60%)" 
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorActivity)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{courses.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Units</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{units.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lessons</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{lessons.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Exercises</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{exercises.length}</p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-4">
          <Link href="/admin/courses">
            <Button className="w-full" variant="outline">
              Manage Courses
            </Button>
          </Link>
          <Link href="/admin/units">
            <Button className="w-full" variant="outline">
              Manage Units
            </Button>
          </Link>
          <Link href="/admin/lessons">
            <Button className="w-full" variant="outline">
              Manage Lessons
            </Button>
          </Link>
          <Link href="/admin/users">
            <Button className="w-full" variant="outline">
              Manage Users
            </Button>
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}
