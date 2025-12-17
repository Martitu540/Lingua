"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { Flame, Zap, Heart, Crown, Plus, Clock } from "lucide-react"
import type { Profile } from "@/types/database"
import { Progress } from "@/components/ui/progress"
import { ThemeToggle } from "@/components/theme-toggle"
import { DonationButton } from "@/components/payments/donation-button"
import { HeartsPurchase } from "@/components/payments/hearts-purchase"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"

interface DashboardHeaderProps {
  profile: Profile | null
}

const MAX_HEARTS = 5
const HEART_INTERVAL_MS = 4 * 60 * 60 * 1000

export function DashboardHeader({ profile: initialProfile }: DashboardHeaderProps) {
  const supabase = createClient()
  const [profile, setProfile] = useState(initialProfile)
  const [hearts, setHearts] = useState(initialProfile?.hearts ?? MAX_HEARTS)
  const [lastHeartRefresh, setLastHeartRefresh] = useState<string | null>(initialProfile?.last_heart_refresh ?? null)
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState("")
  const [isRefreshing, setIsRefreshing] = useState(false)

  // Refresh profile data from database
  const refreshProfile = useCallback(async () => {
    if (!profile?.id) return
    
    setIsRefreshing(true)
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", profile.id)
        .single()
      
      if (error) {
        console.error("Failed to refresh profile", error)
      } else if (data) {
        setProfile(data as Profile)
        setHearts(data.hearts ?? MAX_HEARTS)
        setLastHeartRefresh(data.last_heart_refresh ?? null)
      }
    } catch (error) {
      console.error("Error refreshing profile:", error)
    } finally {
      setIsRefreshing(false)
    }
  }, [profile?.id, supabase])

  // Listen for profile update events
  useEffect(() => {
    const handleProfileUpdate = () => {
      console.log("🔄 Profile update event received, refreshing header...")
      refreshProfile()
    }

    // Listen for custom events
    window.addEventListener("profile-updated", handleProfileUpdate)
    
    return () => {
      window.removeEventListener("profile-updated", handleProfileUpdate)
    }
  }, [refreshProfile])

  // Update local state when initial profile prop changes
  useEffect(() => {
    if (initialProfile) {
      setProfile(initialProfile)
      setHearts(initialProfile.hearts ?? MAX_HEARTS)
      setLastHeartRefresh(initialProfile.last_heart_refresh ?? null)
    }
  }, [initialProfile])

  const xpProgress = profile ? profile.total_xp % 100 : 0
  const level = profile?.current_level || 1

  const refreshHearts = async () => {
    if (!profile?.id) return
    setIsRefreshing(true)
    const { data, error } = await supabase
      .from("profiles")
      .select("hearts, last_heart_refresh")
      .eq("id", profile.id)
      .single()
    if (error) {
      console.error("Failed to refresh hearts", error)
    } else if (data) {
      setHearts(data.hearts ?? MAX_HEARTS)
      setLastHeartRefresh(data.last_heart_refresh ?? null)
      // Also update profile state
      if (profile) {
        setProfile({ ...profile, hearts: data.hearts, last_heart_refresh: data.last_heart_refresh })
      }
    }
    setIsRefreshing(false)
  }

  useEffect(() => {
    if (!lastHeartRefresh) {
      setTimeUntilNextHeart("")
      return
    }

    const updateTimer = () => {
      if (hearts >= MAX_HEARTS) {
        setTimeUntilNextHeart("")
        return
      }

      const now = Date.now()
      const lastRefresh = new Date(lastHeartRefresh).getTime()
      const diffMs = now - lastRefresh
      const heartsToAdd = Math.floor(diffMs / HEART_INTERVAL_MS)

      if (heartsToAdd > 0) {
        refreshHearts()
        return
      }

      const nextHeartMs = HEART_INTERVAL_MS - (diffMs % HEART_INTERVAL_MS)
      const minutes = Math.floor(nextHeartMs / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      setTimeUntilNextHeart(hours > 0 ? `${hours}h ${mins}m` : `${mins}m`)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60_000)
    return () => clearInterval(interval)
  }, [hearts, lastHeartRefresh])

  const heartsLabel = useMemo(() => {
    if (hearts >= MAX_HEARTS) return "Full"
    if (timeUntilNextHeart) return `+1 in ${timeUntilNextHeart}`
    return "Recharging"
  }, [hearts, timeUntilNextHeart])

  return (
    <header className="flex h-16 items-center justify-between border-b bg-card px-4 md:px-6">
      {/* Left side - empty for mobile menu space */}
      <div className="w-10 md:hidden" />

      {/* Center - XP Progress */}
      <div className="hidden flex-1 items-center justify-center gap-4 md:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-accent text-sm font-bold text-white shadow-lg">
            {level}
          </div>
          <div className="w-40">
            <div className="mb-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Level {level}</span>
              <span className="font-medium">{xpProgress}/100 XP</span>
            </div>
            <Progress value={xpProgress} className="h-2" />
          </div>
        </div>
      </div>

      {/* Right side - Stats */}
      <div className="flex items-center gap-3">
        {/* Streak */}
        <div className="flex items-center gap-1.5 rounded-xl bg-streak/15 px-3 py-2 transition-all hover:bg-streak/20">
          <Flame className="h-5 w-5 text-streak" />
          <span className="font-bold text-streak">{profile?.streak_count || 0}</span>
        </div>

        {/* XP */}
        <div className="flex items-center gap-1.5 rounded-xl bg-xp/15 px-3 py-2 transition-all hover:bg-xp/20">
          <Zap className="h-5 w-5 text-xp" />
          <span className="font-bold text-xp">{profile?.total_xp || 0}</span>
        </div>

        {/* Hearts with recharge and purchase */}
        <div className="flex items-center gap-2 rounded-xl bg-hearts/15 px-3 py-2 transition-all hover:bg-hearts/20">
          <div className="flex items-center gap-1.5">
            <Heart className="h-5 w-5 fill-hearts text-hearts" />
            <span className="font-bold text-hearts">{hearts}</span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{isRefreshing ? "Syncing..." : heartsLabel}</span>
          </div>
          <HeartsPurchase
            currentHearts={hearts}
            onSuccess={refreshHearts}
            trigger={
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-hearts hover:bg-hearts/20"
                aria-label="Buy hearts"
              >
                <Plus className="h-4 w-4" />
              </Button>
            }
          />
        </div>

        {/* Donation */}
        <DonationButton />

        {/* Premium badge (if applicable) */}
        {profile?.is_premium && (
          <div className="hidden items-center gap-1.5 rounded-xl bg-gold/15 px-3 py-2 md:flex">
            <Crown className="h-5 w-5 text-gold" />
          </div>
        )}

        <div className="hidden md:block">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
