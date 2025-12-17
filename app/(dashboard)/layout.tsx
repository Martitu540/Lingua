import type React from "react"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import dynamic from "next/dynamic"
import DashboardSidebarClient from "@/components/dashboard/DashboardSidebarClient"
import { DashboardHeader } from "@/components/dashboard/dashboard-header"
import { AuthProvider } from "@/components/auth/auth-provider"

function isOnboardingComplete(profile: any) {
  const completedAt = profile?.settings?.onboarding?.completedAt
  return typeof completedAt === "string" && completedAt.length > 0
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  // Fetch user profile
  const { data: profileRow } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle()
  let profile: any = profileRow ?? null

  if (!isOnboardingComplete(profile)) {
    redirect("/onboarding")
  }

  // Hearts recharge logic: up to 5 hearts, +1 every 4 hours
  if (profile) {
    const maxHearts = 5
    const now = new Date()
    const currentHearts = profile.hearts ?? maxHearts
    const lastRefresh = profile.last_heart_refresh ? new Date(profile.last_heart_refresh) : null

    if (currentHearts < maxHearts && lastRefresh) {
      const diffMs = now.getTime() - lastRefresh.getTime()
      const hours = diffMs / (1000 * 60 * 60)
      const intervalHours = 4
      const heartsToAdd = Math.floor(hours / intervalHours)

      if (heartsToAdd > 0) {
        const newHearts = Math.min(maxHearts, currentHearts + heartsToAdd)
        const addedIntervalsMs = heartsToAdd * intervalHours * 60 * 60 * 1000
        const newLastRefreshDate =
          newHearts >= maxHearts ? now : new Date(lastRefresh.getTime() + addedIntervalsMs)

        const { data: updatedProfile } = await supabase
          .from("profiles")
          .update({
            hearts: newHearts,
            last_heart_refresh: newLastRefreshDate.toISOString(),
          })
          .eq("id", user.id)
          .select("*")
          .single()

        if (updatedProfile) {
          profile = updatedProfile
        } else {
          profile = {
            ...profile,
            hearts: newHearts,
            last_heart_refresh: newLastRefreshDate.toISOString(),
          }
        }
      }
    }
  }

  return (
    <AuthProvider>
      <div className="flex min-h-svh">
        <DashboardSidebarClient profile={profile} />
        <div className="flex flex-1 flex-col">
          <DashboardHeader profile={profile} />
          <main className="flex-1 overflow-auto bg-muted/30 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </AuthProvider>
  )
}
