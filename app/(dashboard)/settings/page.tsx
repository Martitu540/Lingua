import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SettingsForm } from "@/components/settings/settings-form"
import type { Profile } from "@/types/database"

export default async function SettingsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <SettingsForm profile={profile as Profile} userEmail={user.email || ""} />
    </div>
  )
}
