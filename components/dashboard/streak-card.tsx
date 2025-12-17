"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Flame, Trophy, Calendar, Sparkles } from "lucide-react"
import { useState, useEffect, useMemo } from "react"

interface StreakCardProps {
  streak: number
  longestStreak: number
}

export function StreakCard({ streak, longestStreak }: StreakCardProps) {
  const streakDays = ["M", "T", "W", "T", "F", "S", "S"]
  const today = new Date().getDay()
  const adjustedToday = today === 0 ? 6 : today - 1
  const [animatedStreak, setAnimatedStreak] = useState(0)

  useEffect(() => {
    // Reset animation when streak changes so it replays smoothly.
    setAnimatedStreak(0)
  }, [streak])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (animatedStreak < streak) {
        setAnimatedStreak((prev) => Math.min(prev + 1, streak))
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [animatedStreak, streak])

  const isOnFire = streak >= 7
  const displayedStreak = Math.min(streak, 7)

  // Highlight the last `displayedStreak` days counting back from today.
  const completedDays = useMemo(() => {
    const set = new Set<number>()
    for (let i = 0; i < displayedStreak; i++) {
      const idx = (adjustedToday - i + 7) % 7
      set.add(idx)
    }
    return set
  }, [displayedStreak, adjustedToday])

  return (
    <Card className="overflow-hidden border-border/50 relative group">
      {/* Animated background glow for high streaks */}
      {isOnFire && (
        <div className="absolute inset-0 bg-gradient-to-br from-streak/10 via-transparent to-orange-500/10 animate-pulse" />
      )}

      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 relative">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          Streak
          {isOnFire && <Sparkles className="h-4 w-4 text-gold animate-pulse" />}
        </CardTitle>
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-streak/15 shadow-lg shadow-streak/20 group-hover:scale-110 transition-transform duration-300">
          <Flame className={`h-5 w-5 text-streak ${isOnFire ? "animate-flame" : ""}`} />
        </div>
      </CardHeader>
      <CardContent className="relative">
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-bold text-streak tabular-nums">{animatedStreak}</span>
          <span className="text-muted-foreground">day{streak !== 1 ? "s" : ""}</span>
          {isOnFire && (
            <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-streak to-orange-500 px-2 py-0.5 text-xs font-bold text-white animate-scale-pulse">
              <Flame className="h-3 w-3" />
              On Fire!
            </span>
          )}
        </div>

        {/* Week visualization */}
        <div className="mt-5 flex justify-between gap-1">
          {streakDays.map((day, i) => {
            const isCompleted = completedDays.has(i)
            const isFuture = i > adjustedToday && !isCompleted
            const isToday = i === adjustedToday

            return (
              <div
                key={i}
                className="flex flex-1 flex-col items-center gap-1.5"
                style={{ animationDelay: `${i * 50}ms` }}
              >
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-xl text-xs font-bold transition-all duration-300 hover:scale-110 ${
                    isCompleted
                      ? "bg-gradient-to-br from-streak to-orange-500 text-white shadow-lg shadow-streak/30"
                      : isFuture
                        ? "border-2 border-dashed border-border bg-transparent text-muted-foreground"
                        : isToday
                          ? "border-2 border-streak bg-streak/10 text-streak animate-pulse"
                          : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCompleted ? <Flame className="h-5 w-5" /> : day}
                </div>
              </div>
            )
          })}
        </div>

        {/* Stats row */}
        <div className="mt-5 flex items-center justify-between rounded-xl bg-muted/50 p-3 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gold/15">
              <Trophy className="h-3.5 w-3.5 text-gold" />
            </div>
            <span className="text-muted-foreground">Best:</span>
            <span className="font-bold">{longestStreak}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/15">
              <Calendar className="h-3.5 w-3.5 text-primary" />
            </div>
            <span className="text-muted-foreground">This week:</span>
            <span className="font-bold">{Math.min(streak, adjustedToday + 1)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
