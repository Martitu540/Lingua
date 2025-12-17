"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Heart, Clock, Zap } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "@/hooks/use-toast"
import { HeartsPurchase } from "@/components/payments/hearts-purchase"

interface LivesManagerProps {
  hearts: number
  lastHeartRefresh: string | null
  userId: string
}

const MAX_HEARTS = 5
const HEART_RECHARGE_HOURS = 4

export function LivesManager({ hearts: initialHearts, lastHeartRefresh, userId }: LivesManagerProps) {
  const [hearts, setHearts] = useState(initialHearts)
  const [timeUntilNextHeart, setTimeUntilNextHeart] = useState<string>("")
  const [mounted, setMounted] = useState(false)
  const [isWatchingAd, setIsWatchingAd] = useState(false)

  const supabase = createClient()

  const refreshHearts = async () => {
    if (!userId) return
    const { data: profile, error } = await supabase.from("profiles").select("hearts, last_heart_refresh").eq("id", userId).single()
    if (error) {
      console.error("refreshHearts failed", error)
      return
    }
    if (profile) {
      setHearts(profile.hearts || MAX_HEARTS)
    }
  }

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const updateTimer = () => {
      if (hearts >= MAX_HEARTS || !lastHeartRefresh) {
        setTimeUntilNextHeart("")
        return
      }

      const now = new Date()
      const lastRefresh = new Date(lastHeartRefresh)
      const diffMs = now.getTime() - lastRefresh.getTime()
      const hoursElapsed = diffMs / (1000 * 60 * 60)
      const heartsToAdd = Math.floor(hoursElapsed / HEART_RECHARGE_HOURS)

      if (heartsToAdd > 0) {
        // Auto-refresh hearts
        refreshHearts()
        return
      }

      const nextHeartMs = HEART_RECHARGE_HOURS * 60 * 60 * 1000 - (diffMs % (HEART_RECHARGE_HOURS * 60 * 60 * 1000))
      const minutes = Math.floor(nextHeartMs / (1000 * 60))
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60

      if (hours > 0) {
        setTimeUntilNextHeart(`${hours}h ${mins}m`)
      } else {
        setTimeUntilNextHeart(`${mins}m`)
      }
    }

    updateTimer()
    const interval = setInterval(updateTimer, 60000) // Update every minute
    return () => clearInterval(interval)
  }, [hearts, lastHeartRefresh, mounted, userId])

  const handlePurchaseSuccess = async () => {
    // Refresh hearts after successful purchase
    await refreshHearts()
  }

  const handleWatchAd = async () => {
    if (!userId || isWatchingAd) return
    setIsWatchingAd(true)
    // In a real app, integrate with ad network
    const newHearts = Math.min(MAX_HEARTS, hearts + 1)
    const { error } = await supabase.from("profiles").update({ hearts: newHearts }).eq("id", userId)
    if (error) {
      console.error("Failed to grant heart from ad", error)
      toast({
        title: "Could not add heart",
        description: "Please try again.",
        variant: "destructive",
      })
      setIsWatchingAd(false)
      return
    }
    toast({
      title: "Ad Watched",
      description: "You earned 1 heart!",
    })
    setHearts(newHearts)
    setIsWatchingAd(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Heart className="h-5 w-5 fill-hearts text-hearts" />
          Lives
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Hearts Display */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: Math.max(MAX_HEARTS, hearts) }).map((_, i) => (
              <Heart
                key={i}
                className={`h-8 w-8 ${
                  i < hearts ? "fill-hearts text-hearts" : "fill-muted text-muted-foreground opacity-30"
                }`}
              />
            ))}
          </div>
          {hearts > MAX_HEARTS && (
            <p className="text-xs text-muted-foreground">
              You have {hearts} hearts (max capacity: {MAX_HEARTS})
            </p>
          )}
        </div>

        {/* Timer */}
        {hearts < MAX_HEARTS && timeUntilNextHeart && (
          <div className="flex items-center gap-2 rounded-lg bg-muted/50 p-3">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              Next heart in: <span className="font-semibold text-foreground">{timeUntilNextHeart}</span>
            </span>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {hearts < MAX_HEARTS && (
            <Button variant="outline" onClick={handleWatchAd} className="w-full gap-2" disabled={isWatchingAd}>
              <Zap className="h-4 w-4" />
              Watch Ad for 1 Heart
            </Button>
          )}

          <HeartsPurchase currentHearts={hearts} onSuccess={handlePurchaseSuccess} />
        </div>
      </CardContent>
    </Card>
  )
}
