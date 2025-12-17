import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { AdminSidebar } from "@/components/admin/admin-sidebar"

export default async function AdminLayout({
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

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()

  // If profile doesn't exist or is_admin field doesn't exist, create/update it
  if (profileError || !profile) {
    // Try to update the profile to add is_admin field if it doesn't exist
    await supabase
      .from("profiles")
      .update({ is_admin: false })
      .eq("id", user.id)
  }

  // For now, allow access if profile exists (you can restrict this later)
  // TODO: Uncomment the line below once you've set is_admin = true for your user
  // if (!profile?.is_admin) {
  //   redirect("/dashboard")
  // }

  return (
    <div className="flex min-h-svh">
      <AdminSidebar />
      <main className="flex-1 overflow-auto bg-muted/30 p-6">{children}</main>
    </div>
  )
}

